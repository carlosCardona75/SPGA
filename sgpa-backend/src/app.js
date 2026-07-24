const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const db = require("./config/database");

// Importar rutas
const docenteRoutes = require("./routes/docenteRoutes");
const materiaRoutes = require("./routes/materiaRoutes");
const grupoRoutes = require("./routes/grupoRoutes");
const aulaRoutes = require("./routes/aulaRoutes");
const periodoRoutes = require("./routes/periodoRoutes");
const asignacionRoutes = require("./routes/asignacionRoutes");
const horarioRoutes = require("./routes/horarioRoutes");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");

const app = express();

// =============================
// Middlewares
// =============================
app.use(helmet());

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
};
app.use(cors(corsOptions));

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
app.use("/api/aulas", aulaRoutes);
app.use("/api/periodos", periodoRoutes);
app.use("/api/asignaciones", asignacionRoutes);
app.use("/api/horarios", horarioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);

// =============================
// Ruta no encontrada
// =============================
app.use((req, res) => {
    res.status(404).json({
        ok: false,
        mensaje: "Ruta no encontrada"
    });
});

// =============================
// Manejador global de errores
// =============================
app.use((error, req, res, next) => {
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        Object.prototype.hasOwnProperty.call(error, "body")
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: "El cuerpo JSON no tiene un formato válido"
        });
    }
    console.error("Error no controlado:", error);

    res.status(500).json({
        ok: false,
        mensaje: "Error interno del servidor"
    });
});

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
