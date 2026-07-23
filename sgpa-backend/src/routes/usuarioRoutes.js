const express = require("express");

const {
    obtenerUsuarios,
    crearUsuario,
    restablecerPasswordUsuario
} = require("../controllers/usuarioController");

const {
    autenticarToken,
    autorizarRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    obtenerUsuarios
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearUsuario
);

router.patch(
    "/:id/restablecer-password",
    autenticarToken,
    autorizarRoles("ADMIN"),
    restablecerPasswordUsuario
);

module.exports = router;
