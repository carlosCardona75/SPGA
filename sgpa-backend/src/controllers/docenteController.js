const db = require("../config/database");

// Obtener todos los docentes
const obtenerDocentes = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id_docente,
                cedula,
                id_banner,
                nombres,
                apellidos,
                correo,
                telefono,
                max_horas,
                estado
            FROM docente
            ORDER BY nombres, apellidos
        `);

        res.status(200).json({
            ok: true,
            total: rows.length,
            docentes: rows
        });
    } catch (error) {
        console.error("Error al obtener docentes:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener docentes"
        });
    }
};

// Obtener un docente por ID
const obtenerDocentePorId = async (req, res) => {
    try {
        const idDocente =
            res.locals.idDocenteForzado ?? req.params.id;

        const [rows] = await db.query(
            `
            SELECT
                id_docente,
                cedula,
                id_banner,
                nombres,
                apellidos,
                correo,
                telefono,
                max_horas,
                estado
            FROM docente
            WHERE id_docente = ?
            `,
            [idDocente]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Docente no encontrado"
            });
        }

        res.status(200).json({
            ok: true,
            docente: rows[0]
        });
    } catch (error) {
        console.error("Error al obtener docente:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el docente"
        });
    }
};

// Obtener el perfil del docente autenticado
const obtenerMiPerfil = async (req, res) => {
    const idDocente = req.usuario?.id_docente;

    if (!idDocente) {
        return res.status(403).json({
            ok: false,
            mensaje: "El usuario autenticado no está asociado a un docente"
        });
    }

    // El ID se obtiene del token y no de la URL.
    res.locals.idDocenteForzado = idDocente;

    return obtenerDocentePorId(req, res);
};

// Crear docente
const crearDocente = async (req, res) => {
    try {
        const {
            cedula,
            id_banner,
            nombres,
            apellidos,
            correo,
            telefono = null,
            max_horas = 40,
            estado = 1
        } = req.body;

        if (!cedula || !id_banner || !nombres || !apellidos || !correo) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los campos cedula, id_banner, nombres, apellidos y correo son obligatorios"
            });
        }

        const [existentes] = await db.query(
            `
            SELECT id_docente
            FROM docente
            WHERE cedula = ?
               OR id_banner = ?
               OR correo = ?
            `,
            [cedula, id_banner, correo]
        );

        if (existentes.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "Ya existe un docente con la misma cédula, código Banner o correo"
            });
        }

        const [resultado] = await db.query(
            `
            INSERT INTO docente (
                cedula,
                id_banner,
                nombres,
                apellidos,
                correo,
                telefono,
                max_horas,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                cedula,
                id_banner,
                nombres,
                apellidos,
                correo,
                telefono,
                max_horas,
                estado
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Docente creado correctamente",
            id_docente: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear docente:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al crear el docente"
        });
    }
};

// Actualizar docente
const actualizarDocente = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            cedula,
            id_banner,
            nombres,
            apellidos,
            correo,
            telefono = null,
            max_horas = 40,
            estado = 1
        } = req.body;

        if (!cedula || !id_banner || !nombres || !apellidos || !correo) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los campos cedula, id_banner, nombres, apellidos y correo son obligatorios"
            });
        }

        const [docente] = await db.query(
            `
            SELECT id_docente
            FROM docente
            WHERE id_docente = ?
            `,
            [id]
        );

        if (docente.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Docente no encontrado"
            });
        }

        const [duplicados] = await db.query(
            `
            SELECT id_docente
            FROM docente
            WHERE (cedula = ? OR id_banner = ? OR correo = ?)
              AND id_docente <> ?
            `,
            [cedula, id_banner, correo, id]
        );

        if (duplicados.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "Otro docente ya utiliza esa cédula, código Banner o correo"
            });
        }

        await db.query(
            `
            UPDATE docente
            SET
                cedula = ?,
                id_banner = ?,
                nombres = ?,
                apellidos = ?,
                correo = ?,
                telefono = ?,
                max_horas = ?,
                estado = ?
            WHERE id_docente = ?
            `,
            [
                cedula,
                id_banner,
                nombres,
                apellidos,
                correo,
                telefono,
                max_horas,
                estado,
                id
            ]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Docente actualizado correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar docente:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar el docente"
        });
    }
};

// Eliminar docente
const eliminarDocente = async (req, res) => {
    try {
        const { id } = req.params;

        const [docente] = await db.query(
            `
            SELECT id_docente
            FROM docente
            WHERE id_docente = ?
            `,
            [id]
        );

        if (docente.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Docente no encontrado"
            });
        }

        await db.query(
            `
            DELETE FROM docente
            WHERE id_docente = ?
            `,
            [id]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Docente eliminado correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar docente:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "No se puede eliminar el docente porque tiene asignaciones relacionadas"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar el docente"
        });
    }
};

module.exports = {
    obtenerDocentes,
    obtenerMiPerfil,
    obtenerDocentePorId,
    crearDocente,
    actualizarDocente,
    eliminarDocente
};
