const bcrypt = require("bcryptjs");
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
module.exports = {
    registrarAdministradorInicial,
    iniciarSesion,
    obtenerPerfil,
    cambiarPassword
};