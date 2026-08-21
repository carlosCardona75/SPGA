const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    exportarReportes
} = require("../controllers/reporteController");

router.get(
    "/exportar",
    autenticarToken,
    autorizarRoles("ADMIN"),
    exportarReportes
);

module.exports = router;
