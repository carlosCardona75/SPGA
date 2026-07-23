const jwt = require("jsonwebtoken");
const db = require("../config/database");

const autenticarToken = async (req, res, next) => {
    try {
        const encabezado = req.headers.authorization;

        if (!encabezado || !encabezado.startsWith("Bearer ")) {
            return res.status(401).json({
                ok: false,
                mensaje: "Token de acceso requerido"
            });
        }

        const token = encabezado.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                ok: false,
                mensaje: "Token de acceso requerido"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET no está configurado");
        }

        const datosToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Consultamos nuevamente la cuenta para comprobar
        // que todavía existe y permanece activa.
        const [usuarios] = await db.query(
            `SELECT
                id_usuario,
                nombre,
                correo,
                rol,
                id_docente,
                estado,
                debe_cambiar_password
            FROM usuario
            WHERE id_usuario = ?
            LIMIT 1`,
            [datosToken.id_usuario]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: "Usuario no autorizado"
            });
        }

        const usuario = usuarios[0];

        if (usuario.estado !== 1) {
            return res.status(403).json({
                ok: false,
                mensaje: "El usuario se encuentra inactivo"
            });
        }
                // Guardamos el usuario autenticado en la solicitud.
        req.usuario = {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            id_docente: usuario.id_docente,
            debe_cambiar_password:
                usuario.debe_cambiar_password
        };
        const esRutaCambioPassword =
            req.baseUrl === "/api/auth" &&
            req.path === "/cambiar-password";

        if (
            usuario.debe_cambiar_password === 1 &&
            !esRutaCambioPassword
        ) {
            return res.status(403).json({
                ok: false,
                mensaje:
                    "Debe cambiar la contraseña temporal antes de continuar"
            });
        }

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                ok: false,
                mensaje: "El token ha expirado"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                ok: false,
                mensaje: "Token inválido"
            });
        }

        console.error("Error al validar el token:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};

const autorizarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                ok: false,
                mensaje: "Usuario no autenticado"
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                ok: false,
                mensaje: "No tiene permisos para realizar esta acción"
            });
        }
        next();
    };
};
module.exports = {
    autenticarToken,
    autorizarRoles
};
