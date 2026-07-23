const express = require("express");

const {
    registrarAdministradorInicial,
    iniciarSesion,
    obtenerPerfil,
    cambiarPassword
} = require("../controllers/authController");

const {
    autenticarToken
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Crear exclusivamente el primer administrador
router.post(
    "/registro-inicial",
    registrarAdministradorInicial
);

router.post("/login", iniciarSesion);

router.get(
    "/perfil",
    autenticarToken,
    obtenerPerfil
);

router.patch(
    "/cambiar-password",
    autenticarToken,
    cambiarPassword
);

module.exports = router;
