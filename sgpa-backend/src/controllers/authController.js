const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const db = require("../config/database");

// Registrar exclusivamente el primer administrador del sistema
const registrarAdministradorInicial = async (req, res) => {
    try {
        const {
            nombre,
            correo,
            password
        } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos nombre, correo y password son obligatorios"
            });
        }

        const nombreNormalizado = String(nombre).trim();
        const correoNormalizado = String(correo)
            .trim()
            .toLowerCase();

        if (nombreNormalizado.length < 3) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre debe tener al menos 3 caracteres"
            });
        }

        const formatoCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoCorreo.test(correoNormalizado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El correo no tiene un formato válido"
            });
        }

        const passwordTexto = String(password);

        if (passwordTexto.length < 8) {
            return res.status(400).json({
                ok: false,
                mensaje: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        const passwordSegura =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

        if (!passwordSegura.test(passwordTexto)) {
            return res.status(400).json({
                ok: false,
                mensaje: "La contraseña debe incluir mayúscula, minúscula y número"
            });
        }

        // El registro inicial se bloquea cuando ya existe un usuario
        const [conteoUsuarios] = await db.query(`
            SELECT COUNT(*) AS total
            FROM usuario
        `);

        if (conteoUsuarios[0].total > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El administrador inicial ya fue registrado"
            });
        }

        const passwordHash = await bcrypt.hash(
            passwordTexto,
            12
        );

        const [resultado] = await db.query(
            `
                INSERT INTO usuario (
                    nombre,
                    correo,
                    password,
                    rol,
                    id_docente,
                    estado
                )
                VALUES (?, ?, ?, 'ADMIN', NULL, 1)
            `,
            [
                nombreNormalizado,
                correoNormalizado,
                passwordHash
            ]
        );

        return res.status(201).json({
            ok: true,
            mensaje: "Administrador inicial creado correctamente",
            usuario: {
                id_usuario: resultado.insertId,
                nombre: nombreNormalizado,
                correo: correoNormalizado,
                rol: "ADMIN"
            }
        });
    } catch (error) {
        console.error(
            "Error al registrar el administrador inicial:",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "El correo ya está registrado"
            });
        }

        return res.status(500).json({
            ok: false,
            mensaje: "Error al registrar el administrador inicial"
        });
    }
};

const iniciarSesion = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // Validar campos obligatorios
        if (!correo || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos correo y password son obligatorios"
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        // Buscar el usuario por correo
        const [usuarios] = await db.query(
            `SELECT
                id_usuario,
                nombre,
                correo,
                password,
                rol,
                id_docente,
                estado,
                debe_cambiar_password
            FROM usuario
            WHERE correo = ?
            LIMIT 1`,
            [correoNormalizado]
        );

        // Se utiliza un mensaje genérico para no revelar
        // si el correo se encuentra registrado
        if (usuarios.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: "Credenciales inválidas"
            });
        }

        const usuario = usuarios[0];

        if (usuario.estado !== 1) {
            return res.status(403).json({
                ok: false,
                mensaje: "El usuario se encuentra inactivo"
            });
        }

        // Comparar la contraseña recibida con el hash almacenado
        const passwordValido = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordValido) {
            return res.status(401).json({
                ok: false,
                mensaje: "Credenciales inválidas"
            });
        }
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET no está configurado");
        }

        await db.query(
            `UPDATE usuario
             SET ultimo_acceso = NOW()
             WHERE id_usuario = ?`,
            [usuario.id_usuario]
        );

        // Crear el token de acceso
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                rol: usuario.rol,
                id_docente: usuario.id_docente
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "8h"
            }
        );

        return res.status(200).json({
            ok: true,
            mensaje: "Inicio de sesión exitoso",
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
                id_docente: usuario.id_docente,
                debe_cambiar_password: usuario.debe_cambiar_password
            }
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};

const obtenerPerfil = async (req, res) => {
    return res.status(200).json({
        ok: true,
        usuario: req.usuario
    });
};

const cambiarPassword = async (req, res) => {
    try {
        const {
            password_actual,
            password_nueva,
            confirmar_password
        } = req.body;

        if (!password_actual || !password_nueva || !confirmar_password) {
            return res.status(400).json({
                ok: false,
                mensaje: "Todos los campos de contraseña son obligatorios"
            });
        }

        if (password_nueva !== confirmar_password) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva contraseña y su confirmación no coinciden"
            });
        }

        if (password_nueva.length < 8) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva contraseña debe tener al menos 8 caracteres"
            });
        }

        const cumpleComplejidad =
            /[A-Z]/.test(password_nueva) &&
            /[a-z]/.test(password_nueva) &&
            /[0-9]/.test(password_nueva);

        if (!cumpleComplejidad) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva contraseña debe incluir mayúscula, minúscula y número"
            });
        }

        const [usuarios] = await db.query(
            `SELECT id_usuario, password
             FROM usuario
             WHERE id_usuario = ? AND estado = 1`,
            [req.usuario.id_usuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Usuario no encontrado"
            });
        }

        const usuario = usuarios[0];

        const passwordCorrecta = await bcrypt.compare(
            password_actual,
            usuario.password
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                ok: false,
                mensaje: "La contraseña actual es incorrecta"
            });
        }

        const esLaMisma = await bcrypt.compare(
            password_nueva,
            usuario.password
        );

        if (esLaMisma) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva contraseña debe ser diferente de la actual"
            });
        }

        const passwordHash = await bcrypt.hash(password_nueva, 12);

        await db.query(
            `UPDATE usuario
             SET password = ?,
                 debe_cambiar_password = 0,
                 password_actualizada_en = NOW()
             WHERE id_usuario = ?`,
            [passwordHash, usuario.id_usuario]
        );

        return res.status(200).json({
            ok: true,
            mensaje: "Contraseña actualizada correctamente"
        });
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};
// Recuperación de contraseña sin correo: valida la identidad
// con el correo institucional y la cédula del docente.
const recuperarClave = async (req, res) => {
    try {
        const {
            correo,
            cedula
        } = req.body;

        if (!correo || !cedula) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos correo y cédula son obligatorios"
            });
        }

        const correoNormalizado = String(correo)
            .trim()
            .toLowerCase();

        const formatoCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoCorreo.test(correoNormalizado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El correo no tiene un formato válido"
            });
        }

        const [usuarios] = await db.query(
            `SELECT
                u.id_usuario,
                u.estado,
                d.cedula
            FROM usuario u
            LEFT JOIN docente d
                ON u.id_docente = d.id_docente
            WHERE u.correo = ?
            LIMIT 1`,
            [correoNormalizado]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "No existe una cuenta con ese correo institucional"
            });
        }

        const usuario = usuarios[0];

        if (usuario.estado !== 1) {
            return res.status(403).json({
                ok: false,
                mensaje: "El usuario se encuentra inactivo"
            });
        }

        if (
            !usuario.cedula ||
            String(usuario.cedula).trim() !== String(cedula).trim()
        ) {
            return res.status(401).json({
                ok: false,
                mensaje: "Los datos no coinciden con el registro del docente"
            });
        }

        // Invalidar tokens anteriores del usuario.
        await db.query(
            "DELETE FROM recuperacion_clave WHERE id_usuario = ?",
            [usuario.id_usuario]
        );

        const token = crypto.randomBytes(32).toString("hex");

        await db.query(
            `INSERT INTO recuperacion_clave (
                id_usuario,
                token,
                expira_en
            )
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
            [usuario.id_usuario, token]
        );

        return res.status(200).json({
            ok: true,
            mensaje: "Identidad verificada. Defina una nueva contraseña.",
            token
        });
    } catch (error) {
        console.error("Error al recuperar la contraseña:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};

// Establecer una nueva contraseña con el token generado en recuperarClave.
const restablecerClave = async (req, res) => {
    try {
        const {
            token,
            password_nueva,
            confirmar_password
        } = req.body;

        if (!token || !password_nueva || !confirmar_password) {
            return res.status(400).json({
                ok: false,
                mensaje: "El token y las contraseñas son obligatorios"
            });
        }

        if (password_nueva !== confirmar_password) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva contraseña y su confirmación no coinciden"
            });
        }

        if (password_nueva.length < 8) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva contraseña debe tener al menos 8 caracteres"
            });
        }

        const cumpleComplejidad =
            /[A-Z]/.test(password_nueva) &&
            /[a-z]/.test(password_nueva) &&
            /[0-9]/.test(password_nueva);

        if (!cumpleComplejidad) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva contraseña debe incluir mayúscula, minúscula y número"
            });
        }

        const [tokens] = await db.query(
            `SELECT
                r.id,
                r.id_usuario,
                r.expira_en,
                r.usado
            FROM recuperacion_clave r
            INNER JOIN usuario u
                ON r.id_usuario = u.id_usuario
            WHERE r.token = ?
            LIMIT 1`,
            [String(token).trim()]
        );

        if (tokens.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El enlace de recuperación no es válido"
            });
        }

        const registro = tokens[0];

        if (registro.usado === 1) {
            return res.status(400).json({
                ok: false,
                mensaje: "El enlace de recuperación ya fue utilizado"
            });
        }

        if (new Date(registro.expira_en) < new Date()) {
            return res.status(400).json({
                ok: false,
                mensaje: "El enlace de recuperación ha expirado"
            });
        }

        const passwordHash = await bcrypt.hash(password_nueva, 12);

        await db.query(
            `UPDATE usuario
             SET password = ?,
                 debe_cambiar_password = 0,
                 password_actualizada_en = NOW()
             WHERE id_usuario = ?`,
            [passwordHash, registro.id_usuario]
        );

        await db.query(
            "UPDATE recuperacion_clave SET usado = 1 WHERE id = ?",
            [registro.id]
        );

        return res.status(200).json({
            ok: true,
            mensaje: "Contraseña actualizada correctamente"
        });
    } catch (error) {
        console.error("Error al restablecer la contraseña:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};

module.exports = {
    registrarAdministradorInicial,
    iniciarSesion,
    obtenerPerfil,
    cambiarPassword,
    recuperarClave,
    restablecerClave
};