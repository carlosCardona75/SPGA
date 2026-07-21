const express = require("express");
const cors = require("cors");

const db = require("./config/database");

// Importar rutas
const docenteRoutes = require("./routes/docenteRoutes");
const materiaRoutes = require("./routes/materiaRoutes");
const grupoRoutes = require("./routes/grupoRoutes");

const app = express();

// =============================
// Middlewares
// =============================
app.use(cors());
app.use(express.json());

// =============================
// Ruta principal
// =============================
app.get("/", (req, res) => {
    res.status(200).json({
        ok: true,
        mensaje: "API SGPA funcionando correctamente"
    });
});

// =============================
// Ruta de prueba
// =============================
app.get("/api/test", (req, res) => {
    res.status(200).json({
        ok: true,
        mensaje: "Servidor funcionando correctamente"
    });
});

// =============================
// Rutas del sistema
// =============================
app.use("/api/docentes", docenteRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/grupos", grupoRoutes);

// =============================
// Verificar conexión con MySQL
// =============================
db.getConnection()
    .then((connection) => {
        console.log("✅ Conectado correctamente a MySQL");
        connection.release();
    })
    .catch((error) => {
        console.error("❌ Error conectando a MySQL");
        console.error(error.message);
    });

// =============================
// Exportar aplicación
// =============================
module.exports = app;
