const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    obtenerAsignaciones,
    obtenerAsignacionPorId,
    crearAsignacion,
    actualizarAsignacion,
    eliminarAsignacion
} = require("../controllers/asignacionController");

// Obtener todas las asignaciones
router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    obtenerAsignaciones
);

router.get(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    obtenerAsignacionPorId
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearAsignacion
);

router.put(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    actualizarAsignacion
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    eliminarAsignacion
);

module.exports = router;