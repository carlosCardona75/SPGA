/**
 * Genera un Excel con las materias del plan de Fisioterapia 2026
 * marcando el origen de cada una: NUEVA (plan 2026) o
 * REUTILIZADA (ya existía en el plan 202660).
 */

const path = require("path");
const xlsx = require("xlsx");
const pool = require("../src/config/database");
const { PLAN_FISIOTERAPIA_2026 } = require("./datosPlanFisioterapia2026");

const ROMANOS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII" };

function normalizarTexto(valor) {
  return String(valor ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

async function generarListado() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [materias] = await connection.query(`
      SELECT codigo, nombre_materia, semestre, creditos
      FROM materia
    `);

    const porNombre = new Map();

    for (const materia of materias) {
      // Las materias del propio plan nuevo (código FIS%) no se
      // consideran "existentes del plan 202660".
      if (normalizarTexto(materia.codigo).startsWith("FIS")) {
        continue;
      }

      porNombre.set(normalizarTexto(materia.nombre_materia), materia);
    }

    const filas = [
      [
        "ÁREA DE FORMACIÓN",
        "PERIODO ACADÉMICO",
        "SEMESTRE",
        "CODIGO",
        "NOMBRE DE ASIGNATURA",
        "TIPOLOGÍA",
        "CRÉDITOS",
        "ORIGEN",
        "CÓDIGO EXISTENTE (202660)",
      ],
    ];

    for (const asignatura of PLAN_FISIOTERAPIA_2026.asignaturas) {
      const existente = porNombre.get(
        normalizarTexto(asignatura.nombre)
      );

      const esReutilizada = Boolean(existente);

      filas.push([
        asignatura.area,
        ROMANOS[asignatura.periodo] ?? asignatura.periodo,
        asignatura.periodo,
        esReutilizada ? existente.codigo : "",
        asignatura.nombre,
        asignatura.tipologia,
        asignatura.creditos,
        esReutilizada ? "REUTILIZADA (plan 202660)" : "NUEVA (plan 2026)",
        esReutilizada ? existente.codigo : "",
      ]);
    }

    const hoja = xlsx.utils.aoa_to_sheet(filas);
    hoja["!cols"] = [
      { wch: 22 },
      { wch: 18 },
      { wch: 10 },
      { wch: 14 },
      { wch: 52 },
      { wch: 10 },
      { wch: 10 },
      { wch: 28 },
      { wch: 22 },
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, hoja, "PLAN FISIOTERAPIA 2026");

    const carpeta = path.join(__dirname, "..", "plantillas");
    const rutaSalida = path.join(
      carpeta,
      "PLAN_FISIOTERAPIA_2026_LISTADO_MATERIAS.xlsx"
    );

    xlsx.writeFile(workbook, rutaSalida);

    const nuevas = filas.filter((f) => f[7].startsWith("NUEVA")).length;
    const reutilizadas = filas.filter((f) => f[7].startsWith("REUTILIZADA")).length;

    console.log("✅ Listado generado:");
    console.log(`   ${rutaSalida}`);
    console.log(`   Materias nuevas:        ${nuevas}`);
    console.log(`   Materias reutilizadas:  ${reutilizadas}`);
    console.log(`   Total:                  ${nuevas + reutilizadas}`);
  } catch (error) {
    console.error("❌ No se pudo generar el listado.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();
  }
}

generarListado();
