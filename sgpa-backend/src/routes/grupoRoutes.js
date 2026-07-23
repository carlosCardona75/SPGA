const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    obtenerGrupos,
    obtenerGrupoPorId,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo
} = require("../controllers/grupoController");

router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerGrupos
);

router.get(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerGrupoPorId
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearGrupo
);

router.put(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    actualizarGrupo
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    eliminarGrupo
);

module.exports = router;
