const express = require("express");

const router = express.Router();

const {
    obtenerDocentes
} = require("../controllers/docenteController");

router.get("/", obtenerDocentes);

module.exports = router;