const express = require("express");
const { rateLimit } = require("express-rate-limit");

const {
    registrarAdministradorInicial,
    iniciarSesion,
    obtenerPerfil,
    cambiarPassword,
    recuperarClave,
    restablecerClave
} = require("../controllers/authController");

const {
    autenticarToken
} = require("../middlewares/authMiddleware");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        ok: false,
        mensaje:
            "Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos"
    }
});

const recuperacionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        ok: false,
        mensaje:
            "Demasiados intentos de recuperación. Intente nuevamente en 15 minutos"
    }
});

// Crear exclusivamente el primer administrador
router.post(
    "/registro-inicial",
    registrarAdministradorInicial
);

router.post(
    "/login",
    loginLimiter,
    iniciarSesion
);

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

// Recuperación de contraseña sin correo (validación correo + cédula)
router.post(
    "/recuperar-clave",
    recuperacionLimiter,
    recuperarClave
);

router.post(
    "/restablecer-clave",
    recuperacionLimiter,
    restablecerClave
);

module.exports = router;
