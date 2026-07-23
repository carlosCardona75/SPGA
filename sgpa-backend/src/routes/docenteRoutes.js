const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    obtenerDocentes,
    obtenerMiPerfil,
    obtenerDocentePorId,
    crearDocente,
    actualizarDocente,
    eliminarDocente
} = require("../controllers/docenteController");

router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    obtenerDocentes
);

router.get(
    "/mi-perfil",
    autenticarToken,
    autorizarRoles("DOCENTE"),
    obtenerMiPerfil
);

router.get(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    obtenerDocentePorId
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearDocente
);

router.put(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    actualizarDocente
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    eliminarDocente
);

module.exports = router;
