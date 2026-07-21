const express = require("express");

const router = express.Router();

const {
    obtenerAulas,
    obtenerAulaPorId,
    crearAula,
    actualizarAula,
    eliminarAula
} = require("../controllers/aulaController");

// Obtener todas las aulas
router.get("/", obtenerAulas);
router.get("/:id", obtenerAulaPorId);
router.post("/", crearAula);
router.put("/:id", actualizarAula);
router.delete("/:id", eliminarAula);

module.exports = router;
