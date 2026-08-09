/**
 * Genera la PLANTILLA_PLAN_ESTUDIOS.xlsx reutilizable.
 * El cliente pega el pensum en la hoja "PENSUM ACADÉMICO"
 * y ajusta la hoja "CONFIG", luego se ejecuta importarPlanEstudios.js.
 */

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { PLAN_FISIOTERAPIA_2026 } = require("./datosPlanFisioterapia2026");

const ROMANOS = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };

const carpetaPlantillas = path.join(__dirname, "..", "plantillas");
const rutaSalida = path.join(carpetaPlantillas, "PLANTILLA_PLAN_ESTUDIOS.xlsx");

function numerosARomanos(numero) {
  return Object.keys(ROMANOS).find((k) => ROMANOS[k] === numero) || String(numero);
}

function crearHojaPensum() {
  const encabezado = [
    "ÁREA DE FORMACIÓN",
    "PERIODO ACADÉMICO",
    "COD MATERIA (opcional)",
    "NOMBRE DE ASIGNATURA",
    "TIPOLOGÍA (T / TP / P)",
    "CRÉDITOS",
  ];

  const filas = [encabezado];

  PLAN_FISIOTERAPIA_2026.asignaturas.forEach((asignatura) => {
    filas.push([
      asignatura.area,
      numerosARomanos(asignatura.periodo),
      "",
      asignatura.nombre,
      asignatura.tipologia,
      asignatura.creditos,
    ]);
  });

  const hoja = xlsx.utils.aoa_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 20 },
    { wch: 52 },
    { wch: 18 },
    { wch: 10 },
  ];

  return hoja;
}

function crearHojaConfig() {
  const filas = [
    ["PARÁMETRO", "VALOR", "DESCRIPCIÓN"],
    ["PROGRAMA", PLAN_FISIOTERAPIA_2026.programa, "Nombre del programa (se guarda como referencia)."],
    ["PERIODO", PLAN_FISIOTERAPIA_2026.periodo, "Código del período académico. Si no existe se crea."],
    ["FECHA INICIO", PLAN_FISIOTERAPIA_2026.fechaInicio, "Fecha inicial del período (AAAA-MM-DD)."],
    ["FECHA FINAL", PLAN_FISIOTERAPIA_2026.fechaFinal, "Fecha final del período (AAAA-MM-DD)."],
    ["CREAR 1 GRUPO POR MATERIA", "SI", "SI crea un grupo inicial (semestre + 01) por cada materia."],
  ];

  const hoja = xlsx.utils.aoa_to_sheet(filas);
  hoja["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 90 }];

  return hoja;
}

function crearHojaInstrucciones() {
  const filas = [
    ["PLANTILLA DE IMPORTACIÓN DE PLAN DE ESTUDIOS (SGPA)"],
    [""],
    ["1. Abre la hoja CONFIG y verifica: PROGRAMA, PERIODO (ej. 202670), FECHA INICIO y FECHA FINAL."],
    ["2. En la hoja PENSUM ACADÉMICO, reemplaza las filas de ejemplo con el pensum del programa:"],
    ["     - ÁREA DE FORMACIÓN: p. ej. Profesional Específica, Profesional Común, Transversal, Libre Elección."],
    ["     - PERIODO ACADÉMICO: número (1 a 8) o romano (I a VIII)."],
    ["     - COD MATERIA: opcional. Si se deja vacío se genera automáticamente (ej. FST001)."],
    ["     - NOMBRE DE ASIGNATURA: obligatorio."],
    ["     - TIPOLOGÍA: T (teórica), TP (teórico-práctica) o P (práctica)."],
    ["     - CRÉDITOS: número entero."],
    ["3. Guarda el archivo y ejecuta:  node scripts/importarPlanEstudios.js"],
    ["4. El script crea (si faltan): el período, las materias y un grupo inicial por materia."],
    [""],
    ["Observación: si una materia ya existe por código o por nombre, se omite y se reporta al final."],
  ];

  const hoja = xlsx.utils.aoa_to_sheet(filas);
  hoja["!cols"] = [{ wch: 130 }];

  return hoja;
}

function generarPlantilla() {
  if (!fs.existsSync(carpetaPlantillas)) {
    fs.mkdirSync(carpetaPlantillas, { recursive: true });
  }

  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(
    workbook,
    crearHojaInstrucciones(),
    "INSTRUCCIONES"
  );
  xlsx.utils.book_append_sheet(workbook, crearHojaConfig(), "CONFIG");
  xlsx.utils.book_append_sheet(
    workbook,
    crearHojaPensum(),
    "PENSUM ACADÉMICO"
  );

  xlsx.writeFile(workbook, rutaSalida);

  console.log("✅ Plantilla generada:");
  console.log(`   ${rutaSalida}`);
  console.log(
    `   Materias de ejemplo incluidas: ${PLAN_FISIOTERAPIA_2026.asignaturas.length}`
  );
}

generarPlantilla();
