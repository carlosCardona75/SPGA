const express = require("express");

const router = express.Router();

const {
    obtenerAsignaciones,
    obtenerAsignacionPorId,
    crearAsignacion,
    actualizarAsignacion,
    eliminarAsignacion
} = require("../controllers/asignacionController");

// Obtener todas las asignaciones
router.get("/", obtenerAsignaciones);
router.get("/:id", obtenerAsignacionPorId);
router.post("/", crearAsignacion);
router.put("/:id", actualizarAsignacion);
router.delete("/:id", eliminarAsignacion);

module.exports = router;