const db = require("../config/database");

// Obtener todas las materias
const obtenerMaterias = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id_materia,
                codigo,
                nombre_materia,
                semestre,
                creditos,
                horas_semanales,
                estado
            FROM materia
            ORDER BY nombre_materia
        `);

        res.status(200).json({
            ok: true,
            total: rows.length,
            materias: rows
        });
    } catch (error) {
        console.error("Error al obtener materias:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener las materias"
        });
    }
};

// Obtener una materia por ID
const obtenerMateriaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                id_materia,
                codigo,
                nombre_materia,
                semestre,
                creditos,
                horas_semanales,
                estado
            FROM materia
            WHERE id_materia = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Materia no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            materia: rows[0]
        });
    } catch (error) {
        console.error("Error al obtener materia:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener la materia"
        });
    }
};

// Crear materia
const crearMateria = async (req, res) => {
    try {
        const {
            codigo,
            nombre_materia,
            semestre = null,
            creditos = null,
            horas_semanales = null,
            estado = 1
        } = req.body;

        if (!codigo || !nombre_materia) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos codigo y nombre_materia son obligatorios"
            });
        }

        const [existentes] = await db.query(
            `
            SELECT id_materia
            FROM materia
            WHERE codigo = ?
            `,
            [codigo]
        );

        if (existentes.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe una materia con ese código"
            });
        }

        const [resultado] = await db.query(
            `
            INSERT INTO materia (
                codigo,
                nombre_materia,
                semestre,
                creditos,
                horas_semanales,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                codigo,
                nombre_materia,
                semestre,
                creditos,
                horas_semanales,
                estado
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Materia creada correctamente",
            id_materia: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear materia:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al crear la materia"
        });
    }
};

// Actualizar materia
const actualizarMateria = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            codigo,
            nombre_materia,
            semestre = null,
            creditos = null,
            horas_semanales = null,
            estado = 1
        } = req.body;

        if (!codigo || !nombre_materia) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos codigo y nombre_materia son obligatorios"
            });
        }

        const [materia] = await db.query(
            `
            SELECT id_materia
            FROM materia
            WHERE id_materia = ?
            `,
            [id]
        );

        if (materia.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Materia no encontrada"
            });
        }

        const [duplicados] = await db.query(
            `
            SELECT id_materia
            FROM materia
            WHERE codigo = ?
              AND id_materia <> ?
            `,
            [codigo, id]
        );

        if (duplicados.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "Otra materia ya utiliza ese código"
            });
        }

        await db.query(
            `
            UPDATE materia
            SET
                codigo = ?,
                nombre_materia = ?,
                semestre = ?,
                creditos = ?,
                horas_semanales = ?,
                estado = ?
            WHERE id_materia = ?
            `,
            [
                codigo,
                nombre_materia,
                semestre,
                creditos,
                horas_semanales,
                estado,
                id
            ]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Materia actualizada correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar materia:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar la materia"
        });
    }
};

// Eliminar materia
const eliminarMateria = async (req, res) => {
    try {
        const { id } = req.params;

        const [materia] = await db.query(
            `
            SELECT id_materia
            FROM materia
            WHERE id_materia = ?
            `,
            [id]
        );

        if (materia.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Materia no encontrada"
            });
        }

        await db.query(
            `
            DELETE FROM materia
            WHERE id_materia = ?
            `,
            [id]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Materia eliminada correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar materia:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "No se puede eliminar la materia porque tiene registros relacionados"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar la materia"
        });
    }
};

module.exports = {
    obtenerMaterias,
    obtenerMateriaPorId,
    crearMateria,
    actualizarMateria,
    eliminarMateria
};