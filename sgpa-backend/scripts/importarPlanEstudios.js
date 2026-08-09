/**
 * Importa un plan de estudios desde la PLANTILLA_PLAN_ESTUDIOS.xlsx.
 *
 * Lee la hoja CONFIG (programa, período, fechas) y la hoja
 * PENSUM ACADÉMICO (área, período, código, nombre, tipología, créditos).
 *
 * Acciones:
 *   - Crea el período académico si no existe.
 *   - Inserta las materias (omite las que ya existen por código o nombre).
 *   - Crea un grupo inicial por materia (código = semestre + "01").
 */

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const pool = require("../src/config/database");

const carpetaPlantillas = path.join(__dirname, "..", "plantillas");

const ROMANOS = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };

function limpiarTexto(valor) {
  return String(valor ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTexto(valor) {
  return limpiarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function convertirPeriodo(valor) {
  const texto = limpiarTexto(valor);

  if (texto === "") {
    return null;
  }

  if (ROMANOS[texto.toUpperCase()] !== undefined) {
    return ROMANOS[texto.toUpperCase()];
  }

  const numero = Number(texto);

  if (Number.isInteger(numero) && numero >= 1 && numero <= 8) {
    return numero;
  }

  return null;
}

function encontrarPlantilla() {
  if (!fs.existsSync(carpetaPlantillas)) {
    throw new Error(`No existe la carpeta de plantillas: ${carpetaPlantillas}`);
  }

  const archivos = fs
    .readdirSync(carpetaPlantillas)
    .filter((archivo) => /\.(xlsx|xls)$/i.test(archivo))
    .filter((archivo) => !archivo.startsWith("~$"));

  if (archivos.length === 0) {
    throw new Error(
      `No se encontró ninguna plantilla en: ${carpetaPlantillas}`
    );
  }

  return path.join(carpetaPlantillas, archivos[0]);
}

function leerConfiguracion(workbook) {
  const config = {
    programa: "",
    periodo: "",
    fechaInicio: null,
    fechaFinal: null,
    crearGrupo: true,
  };

  const hoja = workbook.Sheets["CONFIG"];

  if (!hoja) {
    return config;
  }

  const filas = xlsx.utils.sheet_to_json(hoja, { header: 1, defval: "" });

  for (const fila of filas) {
    const parametro = normalizarTexto(fila[0]);

    switch (parametro) {
      case "PROGRAMA":
        config.programa = limpiarTexto(fila[1]);
        break;
      case "PERIODO":
        config.periodo = limpiarTexto(fila[1]);
        break;
      case "FECHA INICIO":
        config.fechaInicio = limpiarTexto(fila[1]) || null;
        break;
      case "FECHA FINAL":
        config.fechaFinal = limpiarTexto(fila[1]) || null;
        break;
      case "CREAR 1 GRUPO POR MATERIA":
        config.crearGrupo = normalizarTexto(fila[1]) !== "NO";
        break;
      default:
        break;
    }
  }

  return config;
}

function leerPensum(workbook) {
  const hoja = workbook.Sheets["PENSUM ACADÉMICO"];

  if (!hoja) {
    throw new Error("No se encontró la hoja PENSUM ACADÉMICO.");
  }

  const filas = xlsx.utils.sheet_to_json(hoja, {
    header: 1,
    defval: "",
    raw: true,
  });

  const asignaturas = [];

  for (let indice = 1; indice < filas.length; indice++) {
    const fila = filas[indice];

    // Posiciones: 0 área, 1 período, 2 código, 3 nombre, 4 tipología, 5 créditos
    const area = limpiarTexto(fila[0]);
    const periodo = convertirPeriodo(fila[1]);
    const codigo = limpiarTexto(fila[2]);
    const nombre = limpiarTexto(fila[3]);
    const tipologia = limpiarTexto(fila[4]).toUpperCase();
    const creditos = fila[5];

    if (!nombre) {
      continue;
    }

    asignaturas.push({
      area,
      periodo,
      codigo,
      nombre,
      tipologia,
      creditos: Number.isFinite(Number(creditos)) ? Number(creditos) : null,
    });
  }

  return asignaturas;
}

function generarCodigo(secuencia, programa) {
  const prefijo = (limpiarTexto(programa).match(/[A-Za-z]/g) || ["F"])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "PLAN";

  return `${prefijo}${String(secuencia).padStart(3, "0")}`;
}

async function importarPlanEstudios() {
  let connection;

  const estadisticas = {
    periodoCreado: false,
    materiasCreadas: 0,
    materiasOmitidasPorCodigo: 0,
    materiasOmitidasPorNombre: 0,
    gruposCreados: 0,
  };

  const observaciones = [];

  try {
    const rutaExcel = encontrarPlantilla();
    const workbook = xlsx.readFile(rutaExcel);

    const config = leerConfiguracion(workbook);
    const asignaturas = leerPensum(workbook);

    if (!config.periodo) {
      throw new Error("Falta el parámetro PERIODO en la hoja CONFIG.");
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // ---------- 1. Período académico ----------
    const [periodos] = await connection.execute(
      `
        SELECT id_periodo
        FROM periodo_academico
        WHERE nombre_periodo = ?
        LIMIT 1
      `,
      [config.periodo]
    );

    let idPeriodo;

    if (periodos.length > 0) {
      idPeriodo = periodos[0].id_periodo;
    } else {
      const [resultado] = await connection.execute(
        `
          INSERT INTO periodo_academico (
            nombre_periodo,
            fecha_inicio,
            fecha_final,
            estado
          )
          VALUES (?, ?, ?, 1)
        `,
        [config.periodo, config.fechaInicio, config.fechaFinal]
      );

      idPeriodo = resultado.insertId;
      estadisticas.periodoCreado = true;
    }

    // ---------- 2. Materias y grupos existentes ----------
    const [materias] = await connection.query(`
      SELECT codigo, nombre_materia, id_materia
      FROM materia
    `);

    const porCodigo = new Map();
    const porNombre = new Map();

    for (const materia of materias) {
      if (materia.codigo) {
        porCodigo.set(normalizarTexto(materia.codigo), materia);
      }

      if (materia.nombre_materia) {
        porNombre.set(normalizarTexto(materia.nombre_materia), materia);
      }
    }

    // ---------- 3. Importar materias y grupos ----------
    let secuencia = 1;

    for (const asignatura of asignaturas) {
      if (!asignatura.periodo) {
        observaciones.push(
          `Período inválido (${asignatura.nombre}): se omitió.`
        );
        continue;
      }

      let codigoMateria = asignatura.codigo;

      if (codigoMateria) {
        const existente = porCodigo.get(normalizarTexto(codigoMateria));

        if (existente) {
          estadisticas.materiasOmitidasPorCodigo++;
          observaciones.push(
            `Materia omitida por código ya existente (${codigoMateria}): ${asignatura.nombre}`
          );
          continue;
        }
      } else {
        codigoMateria = generarCodigo(secuencia, config.programa);
        secuencia++;
      }

      const nombreNormalizado = normalizarTexto(asignatura.nombre);
      const existentePorNombre = porNombre.get(nombreNormalizado);

      if (existentePorNombre) {
        estadisticas.materiasOmitidasPorNombre++;
        observaciones.push(
          `Materia omitida por nombre ya existente (${existentePorNombre.codigo}): ${asignatura.nombre}`
        );
        continue;
      }

      const [resultado] = await connection.execute(
        `
          INSERT INTO materia (
            codigo,
            nombre_materia,
            semestre,
            creditos,
            horas_semanales,
            estado
          )
          VALUES (?, ?, ?, ?, NULL, 1)
        `,
        [
          codigoMateria,
          asignatura.nombre,
          asignatura.periodo,
          asignatura.creditos,
        ]
      );

      const idMateria = resultado.insertId;
      estadisticas.materiasCreadas++;

      porCodigo.set(normalizarTexto(codigoMateria), { id_materia: idMateria });
      porNombre.set(nombreNormalizado, { id_materia: idMateria });

      if (config.crearGrupo) {
        const codigoGrupo = `${asignatura.periodo}01`;
        const descripcion = `${asignatura.nombre} - Grupo ${codigoGrupo}`;

        await connection.execute(
          `
            INSERT INTO grupo (
              cod_grupo,
              descripcion,
              id_materia,
              estado
            )
            VALUES (?, ?, ?, 1)
          `,
          [codigoGrupo, descripcion.substring(0, 100), idMateria]
        );

        estadisticas.gruposCreados++;
      }
    }

    await connection.commit();

    // ---------- Resumen ----------
    console.log("\n==============================================");
    console.log("       IMPORTACIÓN DE PLAN DE ESTUDIOS");
    console.log("==============================================");
    console.log(`Archivo: ${path.basename(rutaExcel)}`);
    console.log(`Programa: ${config.programa || "(sin programa)"}`);
    console.log(`Período: ${config.periodo} (id ${idPeriodo})`);
    console.log(`Materias leídas: ${asignaturas.length}`);
    console.log("----------------------------------------------");
    console.log(`Período creado:              ${estadisticas.periodoCreado ? "SÍ" : "ya existía"}`);
    console.log(`Materias creadas:            ${estadisticas.materiasCreadas}`);
    console.log(`Materias omitidas (código):  ${estadisticas.materiasOmitidasPorCodigo}`);
    console.log(`Materias omitidas (nombre):  ${estadisticas.materiasOmitidasPorNombre}`);
    console.log(`Grupos creados:              ${estadisticas.gruposCreados}`);

    if (observaciones.length > 0) {
      console.log("\nObservaciones:");
      observaciones.forEach((observacion) => {
        console.log(`   - ${observacion}`);
      });
    }

    console.log("\n✅ Importación terminada.");
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("\n❌ La importación fue cancelada.");
    console.error("No se confirmaron los cambios de esta ejecución.");
    console.error("\nDetalle del error:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();
  }
}

importarPlanEstudios();
