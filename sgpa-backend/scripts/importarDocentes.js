const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const db = require("../src/config/database");

// Buscar automáticamente el primer archivo .xlsx
const carpetaData = path.join(__dirname, "..", "data");

const archivoExcel = fs
  .readdirSync(carpetaData)
  .find((archivo) => archivo.endsWith(".xlsx"));

if (!archivoExcel) {
  throw new Error("No se encontró ningún archivo Excel en la carpeta data.");
}

console.log("📄 Archivo encontrado:", archivoExcel);

const workbook = xlsx.readFile(path.join(carpetaData, archivoExcel));

// Hoja de docentes
const sheet = workbook.Sheets["LISTA DE DOCENTES"];

// Convertir a JSON
const docentes = xlsx.utils.sheet_to_json(sheet, {
    range: 1
});


async function importarDocentes() {

    try {

        for (const docente of docentes) {

            const nombreCompleto = (docente[" NOMBRES COMPLETOS "] || "").trim();
            const partes = nombreCompleto.split(/\s+/);

            let nombres = "";
            let apellidos = "";

            if (partes.length >= 4) {
                nombres = partes.slice(0, 2).join(" ");
                apellidos = partes.slice(2).join(" ");
            } else if (partes.length === 3) {
                nombres = partes[0];
                apellidos = partes.slice(1).join(" ");
            } else {
                nombres = nombreCompleto;
            }

            await db.query(
                `
                INSERT IGNORE INTO docente
                (
                    cedula,
                    id_banner,
                    nombres,
                    apellidos,
                    correo,
                    telefono,
                    max_horas,
                    estado
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    String(docente["ID BANNER"]).trim(),
                    String(docente["ID BANNER"]).trim(),
                    nombres,
                    apellidos,
                    (docente["CORREO INSTITUCIONAL"] || "").trim(),
                    "",
                    40,
                    "Activo"
                ]
            );
        }

        console.log("✅ Docentes importados correctamente.");

        process.exit();

    } catch (error) {

        console.error(error);

        process.exit();

    }

}

importarDocentes();
