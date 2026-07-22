const express = require("express");

const router = express.Router();

const {
    obtenerHorarios,
    obtenerHorarioPorId,
    crearHorario,
    actualizarHorario,
    eliminarHorario,
    exportarHorarios
} = require("../controllers/horarioController");

// Obtener todos los horarios
router.get("/", obtenerHorarios);
//exportaremos el horario
router.get("/exportar", exportarHorarios);
// aqui obtenermos el horario por id
router.get("/:id", obtenerHorarioPorId);
//aqui crearemos horarios
router.post("/", crearHorario);
//aqui actualizaremos horario
router.put("/:id", actualizarHorario);
//aqui eliminaremos el horario
router.delete("/:id", eliminarHorario);


module.exports = router;