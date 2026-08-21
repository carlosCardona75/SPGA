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
    eliminarDocente,
    exportarDocentes
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
    "/exportar",
    autenticarToken,
    autorizarRoles("ADMIN"),
    exportarDocentes
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
