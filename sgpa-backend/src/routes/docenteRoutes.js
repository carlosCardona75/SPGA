const express = require("express");

const router = express.Router();

const {
    obtenerDocentes,
    obtenerDocentePorId,
    crearDocente,
    actualizarDocente,
    eliminarDocente
} = require("../controllers/docenteController");

router.get("/", obtenerDocentes);
router.get("/:id", obtenerDocentePorId);
router.post("/", crearDocente);
router.put("/:id", actualizarDocente);
router.delete("/:id", eliminarDocente);

module.exports = router;
