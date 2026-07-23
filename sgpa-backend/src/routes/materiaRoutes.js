const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    obtenerMaterias,
    obtenerMateriaPorId,
    crearMateria,
    actualizarMateria,
    eliminarMateria
} = require("../controllers/materiaController");

router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerMaterias
);

router.get(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerMateriaPorId
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearMateria
);

router.put(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    actualizarMateria
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    eliminarMateria
);

module.exports = router;