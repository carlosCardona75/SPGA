const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../config/database");

// Listar usuarios sin exponer contraseñas
const obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.query(`
            SELECT
                u.id_usuario,
                u.nombre,
                u.correo,
                u.rol,
                u.id_docente,
                CONCAT(d.nombres, ' ', d.apellidos) AS nombre_docente,
                u.estado,
                u.debe_cambiar_password,
                u.creado_en,
                u.password_actualizada_en,
                u.ultimo_acceso
            FROM usuario u
            LEFT JOIN docente d
                ON u.id_docente = d.id_docente
            ORDER BY u.nombre
        `);

        return res.status(200).json({
            ok: true,
            total: usuarios.length,
            usuarios
        });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const {
            id_docente,
            rol = "DOCENTE"
        } = req.body;

        const idDocenteNumero = Number(id_docente);
        const rolNormalizado = String(rol)
            .trim()
            .toUpperCase();

        if (
            !Number.isInteger(idDocenteNumero) ||
            idDocenteNumero <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "id_docente debe ser un número entero positivo"
            });
        }

        if (!["ADMIN", "DOCENTE"].includes(rolNormalizado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El rol debe ser ADMIN o DOCENTE"
            });
        }

        const [docentes] = await db.query(
            `SELECT
                id_docente,
                nombres,
                apellidos,
                correo,
                estado
            FROM docente
            WHERE id_docente = ?
            LIMIT 1`,
            [idDocenteNumero]
        );

        if (docentes.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El docente indicado no existe"
            });
        }

        const docente = docentes[0];

        const correoNormalizado = String(
            docente.correo || ""
        )
            .trim()
            .toLowerCase();

        const formatoCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoCorreo.test(correoNormalizado)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El docente no tiene un correo válido"
            });
        }

        // Para crear cuentas institucionales exigimos
        // un correo real de Areandina.
        if (!correoNormalizado.endsWith("@areandina.edu.co")) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El docente no tiene un correo institucional autorizado"
            });
        }

        if (
            rolNormalizado === "DOCENTE" &&
            docente.estado !== 1
        ) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "No se puede crear la cuenta porque el docente está inactivo"
            });
        }

        const [existentes] = await db.query(
            `SELECT
                id_usuario,
                correo,
                id_docente
            FROM usuario
            WHERE correo = ?
               OR id_docente = ?
            LIMIT 1`,
            [correoNormalizado, idDocenteNumero]
        );

        if (existentes.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "El docente ya tiene una cuenta de usuario"
            });
        }

        const nombreCompleto =
            `${docente.nombres} ${docente.apellidos}`
                .trim();

        // La contraseña temporal contiene mayúscula,
        // minúscula, número y un valor aleatorio.
        const passwordTemporal =
            `Sgpa7-${crypto
                .randomBytes(8)
                .toString("hex")}`;

        const passwordHash = await bcrypt.hash(
            passwordTemporal,
            12
        );

        const [resultado] = await db.query(
            `INSERT INTO usuario (
                nombre,
                correo,
                password,
                rol,
                id_docente,
                estado,
                debe_cambiar_password,
                password_actualizada_en
            )
            VALUES (?, ?, ?, ?, ?, 1, 1, NULL)`,
            [
                nombreCompleto,
                correoNormalizado,
                passwordHash,
                rolNormalizado,
                idDocenteNumero
            ]
        );

        return res.status(201).json({
            ok: true,
            mensaje: "Usuario creado correctamente",
            usuario: {
                id_usuario: resultado.insertId,
                nombre: nombreCompleto,
                correo: correoNormalizado,
                rol: rolNormalizado,
                id_docente: idDocenteNumero,
                debe_cambiar_password: 1
            },
            password_temporal: passwordTemporal,
            advertencia:
                "La contraseña temporal se muestra una sola vez"
        });
    } catch (error) {
        console.error("Error al crear usuario:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "El correo o el docente ya están asociados a otro usuario"
            });
        }

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};

const restablecerPasswordUsuario = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);

        if (
            !Number.isInteger(idUsuario) ||
            idUsuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El ID del usuario debe ser un número entero positivo"
            });
        }

        const [usuarios] = await db.query(
            `SELECT
                id_usuario,
                nombre,
                correo,
                estado
            FROM usuario
            WHERE id_usuario = ?
            LIMIT 1`,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Usuario no encontrado"
            });
        }

        const usuario = usuarios[0];

        const passwordTemporal =
            `Sgpa7-${crypto
                .randomBytes(8)
                .toString("hex")}`;

        const passwordHash = await bcrypt.hash(
            passwordTemporal,
            12
        );

        await db.query(
            `UPDATE usuario
            SET
                password = ?,
                debe_cambiar_password = 1,
                password_actualizada_en = NULL
            WHERE id_usuario = ?`,
            [passwordHash, idUsuario]
        );

        return res.status(200).json({
            ok: true,
            mensaje:
                "Contraseña temporal generada correctamente",
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo
            },
            password_temporal: passwordTemporal,
            advertencia:
                "La contraseña temporal se muestra una sola vez"
        });
    } catch (error) {
        console.error(
            "Error al restablecer la contraseña:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
};
module.exports = {
    obtenerUsuarios,
    /* El administrador no inventa el nombre ni el correo: se toman de docente.
Solo acepta correos institucionales.
Un docente no puede tener dos cuentas.
Para rol DOCENTE, el registro académico debe estar activo.
Para rol ADMIN, permitimos que Leidy y Adriana tengan cuenta aunque su estado docente sea 0, 
porque su función administrativa no depende de que tengan carga docente activa.
La contraseña temporal aparece una sola vez y se almacena únicamente como hash.*/
    crearUsuario,
    restablecerPasswordUsuario
};