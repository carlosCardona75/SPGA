const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const carpetaData = path.join(__dirname, "..", "data");

function texto(valor) {
  return String(valor ?? "")
    .replace(/\u00A0/g, " ")
    .trim();
}

function normalizarTexto(valor) {
  return texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function convertirHora(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Hora guardada por Excel como fracción del día
  if (typeof valor === "number") {
    const segundosTotales = Math.round(valor * 24 * 60 * 60);
    const horas = Math.floor(segundosTotales / 3600) % 24;
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;

    return [horas, minutos, segundos]
      .map((numero) => String(numero).padStart(2, "0"))
      .join(":");
  }

  const horaTexto = texto(valor);

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

function buscarArchivoExcel() {
  if (!fs.existsSync(carpetaData)) {
    throw new Error(`No existe la carpeta: ${carpetaData}`);
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
    archivos.forEach((archivo) => console.log(`   - ${archivo}`));
    console.log(`\nSe utilizará: ${archivos[0]}\n`);
  }

  return archivos[0];
}

function buscarHojaHorario(workbook) {
  const nombreHoja = workbook.SheetNames.find(
    (nombre) => normalizarTexto(nombre) === "HORARIO 202660"
  );

  if (!nombreHoja) {
    throw new Error(
      `No se encontró la hoja HORARIO 202660. Hojas disponibles: ${workbook.SheetNames.join(
        ", "
      )}`
    );
  }

  return {
    nombre: nombreHoja,
    hoja: workbook.Sheets[nombreHoja],
  };
}

function ejecutar() {
  const archivoExcel = buscarArchivoExcel();
  const rutaExcel = path.join(carpetaData, archivoExcel);

  const workbook = xlsx.readFile(rutaExcel);
  const { nombre, hoja } = buscarHojaHorario(workbook);

  const filas = xlsx.utils.sheet_to_json(hoja, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (filas.length < 2) {
    throw new Error("La hoja de horario no contiene registros.");
  }

  const resumen = {
    totalFilasExcel: filas.length,
    filasConDatos: 0,
    filasValidas: 0,
    filasInvalidas: 0,
    sinMateria: 0,
    sinGrupo: 0,
    sinDia: 0,
    sinHoraInicio: 0,
    sinHoraFin: 0,
    sinDocente: 0,
    docentesPendientes: 0,
    sinAula: 0,
  };

  const errores = [];
  const docentes = new Set();
  const materias = new Set();
  const grupos = new Set();
  const aulas = new Set();

  // La fila 1 contiene los encabezados
  for (let indice = 1; indice < filas.length; indice++) {
    const fila = filas[indice];
    const numeroFilaExcel = indice + 1;

    const codigoMateria = texto(fila[1]);
    const nombreMateria = texto(fila[2]);
    const codigoGrupo = texto(fila[4]);
    const dia = normalizarTexto(fila[5]);
    const horaInicio = convertirHora(fila[6]);
    const horaFin = convertirHora(fila[7]);
    const codigoAula = texto(fila[13]);
    const nombreDocente = texto(fila[14]);

    const filaVacia = fila.every((celda) => texto(celda) === "");

    if (filaVacia) {
      continue;
    }

    resumen.filasConDatos++;

    const problemas = [];

    if (!codigoMateria || normalizarTexto(codigoMateria) === "NA") {
      resumen.sinMateria++;
      problemas.push("materia ausente o código NA");
    } else {
      materias.add(codigoMateria);
    }

    if (!codigoGrupo) {
      resumen.sinGrupo++;
      problemas.push("grupo vacío");
    } else {
      grupos.add(`${codigoMateria}-${codigoGrupo}`);
    }

    if (!dia) {
      resumen.sinDia++;
      problemas.push("día vacío");
    }

    if (!horaInicio) {
      resumen.sinHoraInicio++;
      problemas.push(`hora inicial inválida: ${texto(fila[6])}`);
    }

    if (!horaFin) {
      resumen.sinHoraFin++;
      problemas.push(`hora final inválida: ${texto(fila[7])}`);
    }

    if (!nombreDocente) {
      resumen.sinDocente++;
      problemas.push("docente vacío");
    } else {
      const docenteNormalizado = normalizarTexto(nombreDocente);

      if (
        docenteNormalizado === "POR ASIGNAR" ||
        docenteNormalizado.startsWith("NN")
      ) {
        resumen.docentesPendientes++;
        problemas.push(`docente pendiente: ${nombreDocente}`);
      } else {
        docentes.add(nombreDocente);
      }
    }

    if (!codigoAula) {
      resumen.sinAula++;
    } else {
      aulas.add(codigoAula);
    }

    if (problemas.length > 0) {
      resumen.filasInvalidas++;

      errores.push({
        fila: numeroFilaExcel,
        materia: codigoMateria || "(vacía)",
        grupo: codigoGrupo || "(vacío)",
        docente: nombreDocente || "(vacío)",
        problemas,
      });
    } else {
      resumen.filasValidas++;
    }

    // Evita una variable sin usar durante la revisión
    void nombreMateria;
  }

  console.log("\n==============================================");
  console.log("        VALIDACIÓN DEL HORARIO 202660");
  console.log("==============================================");
  console.log(`Archivo: ${archivoExcel}`);
  console.log(`Hoja: "${nombre}"`);
  console.log("----------------------------------------------");
  console.log(`Filas físicas del Excel:       ${resumen.totalFilasExcel}`);
  console.log(`Filas con información:         ${resumen.filasConDatos}`);
  console.log(`Filas totalmente válidas:      ${resumen.filasValidas}`);
  console.log(`Filas con alguna observación:  ${resumen.filasInvalidas}`);
  console.log("----------------------------------------------");
  console.log(`Materias diferentes:           ${materias.size}`);
  console.log(`Grupos materia-grupo:          ${grupos.size}`);
  console.log(`Docentes diferentes:           ${docentes.size}`);
  console.log(`Aulas diferentes:              ${aulas.size}`);
  console.log("----------------------------------------------");
  console.log(`Filas sin aula:                ${resumen.sinAula}`);
  console.log(`Docentes pendientes:           ${resumen.docentesPendientes}`);
  console.log(`Filas sin materia válida:      ${resumen.sinMateria}`);
  console.log(`Filas sin grupo:               ${resumen.sinGrupo}`);
  console.log(`Filas sin día:                 ${resumen.sinDia}`);
  console.log(`Horas iniciales inválidas:     ${resumen.sinHoraInicio}`);
  console.log(`Horas finales inválidas:       ${resumen.sinHoraFin}`);

  if (errores.length > 0) {
    console.log("\nPrimeras 20 observaciones:");

    errores.slice(0, 20).forEach((error) => {
      console.log(
        `\nFila ${error.fila} | Materia: ${error.materia} | Grupo: ${error.grupo}`
      );
      console.log(`Docente: ${error.docente}`);
      console.log(`Motivo: ${error.problemas.join("; ")}`);
    });
  }

  console.log("\n✅ La validación terminó sin modificar la base de datos.");
}

try {
  ejecutar();
} catch (error) {
  console.error("\n❌ Error al validar el horario:");
  console.error(error.message);
  process.exitCode = 1;
}