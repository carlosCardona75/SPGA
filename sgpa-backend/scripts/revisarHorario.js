const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const carpetaData = path.join(__dirname, "..", "data");

const archivoExcel = fs
  .readdirSync(carpetaData)
  .find((archivo) => archivo.endsWith(".xlsx"));

if (!archivoExcel) {
  throw new Error("No se encontró ningún archivo Excel.");
}

const workbook = xlsx.readFile(path.join(carpetaData, archivoExcel));

const sheet = workbook.Sheets["HORARIO 202660 "];

if (!sheet) {
  throw new Error("No se encontró la hoja HORARIO 202660.");
}

const filas = xlsx.utils.sheet_to_json(sheet, {
  header: 1,
  defval: "",
});

console.log("========== PRIMERAS 10 FILAS ==========\n");

filas.slice(0, 10).forEach((fila, indice) => {
  console.log(`Fila ${indice + 1}:`);
  console.log(fila);
  console.log("--------------------------------------");
});
