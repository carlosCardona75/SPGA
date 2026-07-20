const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const pool = require("../src/config/database");

const PERIODO = "202660";
const carpetaData = path.join(__dirname, "..", "data");

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

function convertirHora(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Excel puede guardar la hora como fracción de un día.
  if (typeof valor === "number") {
    let segundosTotales = Math.round(valor * 24 * 60 * 60);

    // Evita que 1 se convierta en 24:00:00.
    segundosTotales %= 24 * 60 * 60;

    const horas = Math.floor(segundosTotales / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;

    return [horas, minutos, segundos]
      .map((numero) => String(numero).padStart(2, "0"))
      .join(":");
  }

  const horaTexto = limpiarTexto(valor);

  const coincidencia = horaTexto.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!coincidencia) {
    return null;
  }

  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  const segundos = Number(coincidencia[3] ?? 0);

  if (
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59 ||
    segundos < 0 ||
    segundos > 59
  ) {
    return null;
  }

  return [horas, minutos, segundos]
    .map((numero) => String(numero).padStart(2, "0"))
    .join(":");
}

function encontrarArchivoExcel() {
  if (!fs.existsSync(carpetaData)) {
    throw new Error(`No existe la carpeta data: ${carpetaData}`);
  }

  const archivos = fs
    .readdirSync(carpetaData)
    .filter((archivo) => /\.(xlsx|xls)$/i.test(archivo))
    .filter((archivo) => !archivo.startsWith("~$"));

  if (archivos.length === 0) {
    throw new Error("No se encontró ningún archivo Excel en la carpeta data.");
  }

  if (archivos.length > 1) {
    console.log("⚠️ Se encontraron varios archivos Excel:");

    archivos.forEach((archivo) => {
      console.log(`   - ${archivo}`);
    });

    console.log(`\nSe utilizará: ${archivos[0]}\n`);
  }

  return archivos[0];
}

function encontrarHojaHorario(workbook) {
  const nombreHoja = workbook.SheetNames.find(
    (nombre) => normalizarTexto(nombre) === `HORARIO ${PERIODO}`
  );

  if (!nombreHoja) {
    throw new Error(
      `No se encontró la hoja HORARIO ${PERIODO}. Hojas disponibles: ${workbook.SheetNames.join(
        ", "
      )}`
    );
  }

  return {
    nombre: nombreHoja,
    hoja: workbook.Sheets[nombreHoja],
  };
}

function esDocentePendiente(nombreDocente) {
  const nombre = normalizarTexto(nombreDocente);

  return (
    nombre === "POR ASIGNAR" ||
    nombre === "NN" ||
    /^NN\d*(?:_|$)/.test(nombre)
  );
}

async function cargarMaterias(connection) {
  const [materias] = await connection.query(`
    SELECT
      id_materia,
      codigo,
      nombre_materia
    FROM materia
  `);

  const mapa = new Map();

  for (const materia of materias) {
    mapa.set(normalizarTexto(materia.codigo), materia);
  }

  return mapa;
}

async function cargarDocentes(connection) {
  const [docentes] = await connection.query(`
    SELECT
      id_docente,
      nombres,
      apellidos,
      estado
    FROM docente
  `);

  const mapa = new Map();

  for (const docente of docentes) {
    const nombreCompleto = `${docente.nombres ?? ""} ${
      docente.apellidos ?? ""
    }`;

    mapa.set(normalizarTexto(nombreCompleto), docente);
  }

  return mapa;
}

async function obtenerPeriodo(connection) {
  const [periodos] = await connection.execute(
    `
      SELECT id_periodo, nombre_periodo
      FROM periodo_academico
      WHERE nombre_periodo = ?
      LIMIT 1
    `,
    [PERIODO]
  );

  if (periodos.length === 0) {
    throw new Error(
      `No existe el período académico ${PERIODO} en periodo_academico.`
    );
  }

  return periodos[0];
}

async function obtenerOCrearGrupo(
  connection,
  codigoGrupo,
  materia,
  estadisticas
) {
  const [grupos] = await connection.execute(
    `
      SELECT id_grupo
      FROM grupo
      WHERE cod_grupo = ?
        AND id_materia = ?
      LIMIT 1
    `,
    [codigoGrupo, materia.id_materia]
  );

  if (grupos.length > 0) {
    estadisticas.gruposExistentes++;
    return grupos[0].id_grupo;
  }

  const descripcion = `${materia.nombre_materia} - Grupo ${codigoGrupo}`;

  const [resultado] = await connection.execute(
    `
      INSERT INTO grupo (
        cod_grupo,
        descripcion,
        id_materia,
        estado
      )
      VALUES (?, ?, ?, 1)
    `,
    [
      codigoGrupo,
      descripcion.substring(0, 100),
      materia.id_materia,
    ]
  );

  estadisticas.gruposCreados++;

  return resultado.insertId;
}

async function obtenerOCrearAula(
  connection,
  codigoAula,
  estadisticas
) {
  if (!codigoAula) {
    return null;
  }

  const [aulas] = await connection.execute(
    `
      SELECT id_aula
      FROM aula
      WHERE codigo = ?
      LIMIT 1
    `,
    [codigoAula]
  );

  if (aulas.length > 0) {
    estadisticas.aulasExistentes++;
    return aulas[0].id_aula;
  }

  const [resultado] = await connection.execute(
    `
      INSERT INTO aula (
        codigo,
        capacidad,
        estado
      )
      VALUES (?, NULL, 1)
    `,
    [codigoAula]
  );

  estadisticas.aulasCreadas++;

  return resultado.insertId;
}

async function obtenerOCrearAsignacion(
  connection,
  idDocente,
  idGrupo,
  idPeriodo,
  estadisticas
) {
  const [asignaciones] = await connection.execute(
    `
      SELECT id_asignacion
      FROM asignacion
      WHERE id_docente = ?
        AND id_grupo = ?
        AND id_periodo = ?
      LIMIT 1
    `,
    [idDocente, idGrupo, idPeriodo]
  );

  if (asignaciones.length > 0) {
    estadisticas.asignacionesExistentes++;
    return asignaciones[0].id_asignacion;
  }

  const [resultado] = await connection.execute(
    `
      INSERT INTO asignacion (
        id_docente,
        id_grupo,
        id_periodo,
        estado
      )
      VALUES (?, ?, ?, 1)
    `,
    [idDocente, idGrupo, idPeriodo]
  );

  estadisticas.asignacionesCreadas++;

  return resultado.insertId;
}

async function detalleHorarioExiste(
  connection,
  idAsignacion,
  idAula,
  dia,
  horaInicio,
  horaFin
) {
  const [detalles] = await connection.execute(
    `
      SELECT id_detalle
      FROM detalle_horario
      WHERE id_asignacion = ?
        AND id_aula <=> ?
        AND dia_semana = ?
        AND hora_inicio = ?
        AND hora_fin = ?
      LIMIT 1
    `,
    [
      idAsignacion,
      idAula,
      dia,
      horaInicio,
      horaFin,
    ]
  );

  return detalles.length > 0;
}

async function importarHorario() {
  let connection;

  const estadisticas = {
    filasConDatos: 0,
    filasImportadas: 0,
    filasOmitidas: 0,
    detallesDuplicados: 0,

    gruposCreados: 0,
    gruposExistentes: 0,

    aulasCreadas: 0,
    aulasExistentes: 0,

    asignacionesCreadas: 0,
    asignacionesExistentes: 0,
  };

  const observaciones = [];
  const docentesNoEncontrados = new Set();
  const materiasNoEncontradas = new Set();

  try {
    const archivoExcel = encontrarArchivoExcel();
    const rutaExcel = path.join(carpetaData, archivoExcel);

    const workbook = xlsx.readFile(rutaExcel);
    const { nombre, hoja } = encontrarHojaHorario(workbook);

    const filas = xlsx.utils.sheet_to_json(hoja, {
      header: 1,
      defval: "",
      raw: true,
    });

    connection = await pool.getConnection();

    await connection.beginTransaction();

    const periodo = await obtenerPeriodo(connection);
    const materias = await cargarMaterias(connection);
    const docentes = await cargarDocentes(connection);

    console.log("\n==============================================");
    console.log("       IMPORTACIÓN DEL HORARIO ACADÉMICO");
    console.log("==============================================");
    console.log(`Archivo: ${archivoExcel}`);
    console.log(`Hoja: "${nombre}"`);
    console.log(`Período: ${periodo.nombre_periodo}`);
    console.log("----------------------------------------------\n");

    // La primera fila contiene los encabezados.
    for (let indice = 1; indice < filas.length; indice++) {
      const fila = filas[indice];
      const numeroFilaExcel = indice + 1;

      const filaVacia = fila.every(
        (celda) => limpiarTexto(celda) === ""
      );

      if (filaVacia) {
        continue;
      }

      estadisticas.filasConDatos++;

      /*
       * Posiciones reales del Excel:
       *
       * B = código materia       índice 1
       * C = nombre materia       índice 2
       * E = grupo                índice 4
       * F = día                  índice 5
       * G = hora inicio          índice 6
       * H = hora fin             índice 7
       * N = aula                 índice 13
       * O = docente              índice 14
       */

      const codigoMateria = limpiarTexto(fila[1]);
      const codigoGrupo = limpiarTexto(fila[4]);
      const dia = normalizarTexto(fila[5]);
      const horaInicio = convertirHora(fila[6]);
      const horaFin = convertirHora(fila[7]);
      const codigoAula = limpiarTexto(fila[13]);
      const nombreDocente = limpiarTexto(fila[14]);

      const problemas = [];

      if (
        !codigoMateria ||
        normalizarTexto(codigoMateria) === "NA"
      ) {
        problemas.push("materia vacía o código NA");
      }

      if (!codigoGrupo) {
        problemas.push("grupo vacío");
      }

      if (!dia) {
        problemas.push("día vacío");
      }

      if (!horaInicio) {
        problemas.push("hora inicial inválida");
      }

      if (!horaFin) {
        problemas.push("hora final inválida");
      }

      if (
        horaInicio &&
        horaFin &&
        horaInicio >= horaFin
      ) {
        problemas.push(
          `la hora inicial ${horaInicio} no es menor que ${horaFin}`
        );
      }

      if (!nombreDocente) {
        problemas.push("docente vacío");
      } else if (esDocentePendiente(nombreDocente)) {
        problemas.push(`docente pendiente: ${nombreDocente}`);
      }

      if (problemas.length > 0) {
        estadisticas.filasOmitidas++;

        observaciones.push({
          fila: numeroFilaExcel,
          materia: codigoMateria || "(vacía)",
          grupo: codigoGrupo || "(vacío)",
          docente: nombreDocente || "(vacío)",
          motivo: problemas.join("; "),
        });

        continue;
      }

      const materia = materias.get(
        normalizarTexto(codigoMateria)
      );

      if (!materia) {
        estadisticas.filasOmitidas++;
        materiasNoEncontradas.add(codigoMateria);

        observaciones.push({
          fila: numeroFilaExcel,
          materia: codigoMateria,
          grupo: codigoGrupo,
          docente: nombreDocente,
          motivo: "materia no encontrada en la base de datos",
        });

        continue;
      }

      const docente = docentes.get(
        normalizarTexto(nombreDocente)
      );

      if (!docente) {
        estadisticas.filasOmitidas++;
        docentesNoEncontrados.add(nombreDocente);

        observaciones.push({
          fila: numeroFilaExcel,
          materia: codigoMateria,
          grupo: codigoGrupo,
          docente: nombreDocente,
          motivo: "docente no encontrado en la base de datos",
        });

        continue;
      }

      const idGrupo = await obtenerOCrearGrupo(
        connection,
        codigoGrupo,
        materia,
        estadisticas
      );

      const idAula = await obtenerOCrearAula(
        connection,
        codigoAula,
        estadisticas
      );

      const idAsignacion = await obtenerOCrearAsignacion(
        connection,
        docente.id_docente,
        idGrupo,
        periodo.id_periodo,
        estadisticas
      );

      const existeDetalle = await detalleHorarioExiste(
        connection,
        idAsignacion,
        idAula,
        dia,
        horaInicio,
        horaFin
      );

      if (existeDetalle) {
        estadisticas.detallesDuplicados++;
        continue;
      }

      await connection.execute(
        `
          INSERT INTO detalle_horario (
            id_asignacion,
            id_aula,
            dia_semana,
            hora_inicio,
            hora_fin,
            estado
          )
          VALUES (?, ?, ?, ?, ?, 1)
        `,
        [
          idAsignacion,
          idAula,
          dia,
          horaInicio,
          horaFin,
        ]
      );

      estadisticas.filasImportadas++;
    }

    await connection.commit();

    console.log("✅ La transacción fue confirmada correctamente.");
    console.log("\n================ RESUMEN =================");
    console.log(
      `Filas con información:          ${estadisticas.filasConDatos}`
    );
    console.log(
      `Detalles importados:            ${estadisticas.filasImportadas}`
    );
    console.log(
      `Detalles ya existentes:         ${estadisticas.detallesDuplicados}`
    );
    console.log(
      `Filas omitidas:                 ${estadisticas.filasOmitidas}`
    );
    console.log("------------------------------------------");
    console.log(
      `Grupos creados:                 ${estadisticas.gruposCreados}`
    );
    console.log(
      `Grupos reutilizados:            ${estadisticas.gruposExistentes}`
    );
    console.log(
      `Aulas creadas:                  ${estadisticas.aulasCreadas}`
    );
    console.log(
      `Aulas reutilizadas:             ${estadisticas.aulasExistentes}`
    );
    console.log(
      `Asignaciones creadas:           ${estadisticas.asignacionesCreadas}`
    );
    console.log(
      `Asignaciones reutilizadas:      ${estadisticas.asignacionesExistentes}`
    );

    if (materiasNoEncontradas.size > 0) {
      console.log("\n⚠️ Materias no encontradas:");

      for (const materia of materiasNoEncontradas) {
        console.log(`   - ${materia}`);
      }
    }

    if (docentesNoEncontrados.size > 0) {
      console.log("\n⚠️ Docentes no encontrados:");

      for (const docente of docentesNoEncontrados) {
        console.log(`   - ${docente}`);
      }
    }

    if (observaciones.length > 0) {
      console.log("\nPrimeras 30 filas omitidas:");

      observaciones.slice(0, 30).forEach((observacion) => {
        console.log(
          `\nFila ${observacion.fila} | Materia: ${observacion.materia} | Grupo: ${observacion.grupo}`
        );
        console.log(`Docente: ${observacion.docente}`);
        console.log(`Motivo: ${observacion.motivo}`);
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

importarHorario();
