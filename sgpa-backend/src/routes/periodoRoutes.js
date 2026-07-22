const express = require("express");

const router = express.Router();

const {
    obtenerPeriodos,
    obtenerPeriodoPorId,
    crearPeriodo,
    actualizarPeriodo,
    eliminarPeriodo
} = require("../controllers/periodoController");

// Obtener todos los períodos académicos
router.get("/", obtenerPeriodos);
router.get("/:id", obtenerPeriodoPorId);
router.post("/", crearPeriodo);
router.put("/:id", actualizarPeriodo);
router.delete("/:id", eliminarPeriodo);

module.exports = router;