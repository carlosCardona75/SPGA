const db = require("./config/database");
const express = require("express");
const cors = require("cors");

const docenteRoutes = require("./routes/docenteRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/docentes", docenteRoutes);

// Probar conexión con MySQL
db.getConnection()
  .then((connection) => {
    console.log("✅ Conectado correctamente a MySQL");
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Error conectando a MySQL");
    console.error(error.message);
  });

// Ruta principal
app.get("/", (req, res) => {
    res.json({
        mensaje: "API SGPA funcionando correctamente"
    });
});

module.exports = app;