const express = require("express");

const router = express.Router();

const {
    obtenerMaterias,
    obtenerMateriaPorId,
    crearMateria,
    actualizarMateria,
    eliminarMateria
} = require("../controllers/materiaController");

router.get("/", obtenerMaterias);
router.get("/:id", obtenerMateriaPorId);
router.post("/", crearMateria);
router.put("/:id", actualizarMateria);
router.delete("/:id", eliminarMateria);

module.exports = router;