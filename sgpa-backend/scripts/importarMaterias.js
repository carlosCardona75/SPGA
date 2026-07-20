const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const db = require("../src/config/database");

// Buscar el Excel
const carpetaData = path.join(__dirname, "..", "data");

const archivoExcel = fs
    .readdirSync(carpetaData)
    .find((archivo) => archivo.endsWith(".xlsx"));

if (!archivoExcel) {
    throw new Error("No se encontró ningún archivo Excel.");
}

console.log("📄 Archivo encontrado:", archivoExcel);

const workbook = xlsx.readFile(path.join(carpetaData, archivoExcel));

const sheet = workbook.Sheets["PENSUM ACADÉMICO"];

const filas = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    defval: ""
});

async function importarMaterias() {

    try {

        // Empieza después del encabezado
        for (let i = 2; i < filas.length; i++) {

            const fila = filas[i];

            const codigo = String(fila[0]).trim();
            const nombre = String(fila[2]).trim();
            const creditos = fila[7] || null;

            // Saltar filas de semestre
            if (!codigo) continue;

            // Evitar filas como "PPE4FST001..."
            if (codigo.startsWith("PPE")) continue;

            await db.query(
                `
                INSERT IGNORE INTO materia
                (
                    codigo,
                    nombre_materia,
                    semestre,
                    creditos,
                    horas_semanales,
                    estado
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    codigo,
                    nombre,
                    null,
                    creditos,
                    null,
                    1
                ]
            );

        }

        console.log("✅ Materias importadas correctamente.");

        process.exit();

    } catch (error) {

        console.error(error);

        process.exit();

    }

}

importarMaterias();
