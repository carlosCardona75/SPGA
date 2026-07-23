const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    obtenerPeriodos,
    obtenerPeriodoPorId,
    crearPeriodo,
    actualizarPeriodo,
    eliminarPeriodo
} = require("../controllers/periodoController");

// Obtener todos los períodos académicos
router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerPeriodos
);

router.get(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerPeriodoPorId
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearPeriodo
);

router.put(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    actualizarPeriodo
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    eliminarPeriodo
);

module.exports = router;