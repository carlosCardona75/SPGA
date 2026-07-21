const express = require("express");

const router = express.Router();

const {
    obtenerAulas,
    obtenerAulaPorId
} = require("../controllers/aulaController");

// Obtener todas las aulas
router.get("/", obtenerAulas);
router.get("/:id", obtenerAulaPorId);

module.exports = router;