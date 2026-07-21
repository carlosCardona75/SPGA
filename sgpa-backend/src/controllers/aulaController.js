const db = require("../config/database");

// ==========================================
// Obtener todas las aulas
// ==========================================
const obtenerAulas = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id_aula,
                codigo,
                capacidad,
                estado
            FROM aula
            ORDER BY codigo
        `);

        res.status(200).json({
            ok: true,
            total: rows.length,
            aulas: rows
        });
    } catch (error) {
        console.error("Error al obtener aulas:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener las aulas"
        });
    }
};
// ==========================================
// Obtener un aula por ID
// ==========================================
const obtenerAulaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                id_aula,
                codigo,
                capacidad,
                estado
            FROM aula
            WHERE id_aula = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Aula no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            aula: rows[0]
        });
    } catch (error) {
        console.error("Error al obtener aula:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el aula"
        });
    }
};
// ==========================================
// Crear un aula
// ==========================================
const crearAula = async (req, res) => {
    try {
        const {
            codigo,
            capacidad = null,
            estado = 1
        } = req.body;

        // Validar el código obligatorio
        if (typeof codigo !== "string" || !codigo.trim()) {
            return res.status(400).json({
                ok: false,
                mensaje: "El código del aula es obligatorio"
            });
        }

        // Validar capacidad cuando sea proporcionada
        if (
            capacidad !== null &&
            (!Number.isInteger(capacidad) || capacidad <= 0)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La capacidad debe ser un número entero mayor que cero"
            });
        }

        // Validar estado
        if (![0, 1].includes(estado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        const codigoNormalizado = codigo.trim().toUpperCase();

        // Verificar que el código no esté repetido
        const [aulasExistentes] = await db.query(
            `
            SELECT id_aula
            FROM aula
            WHERE codigo = ?
            `,
            [codigoNormalizado]
        );

        if (aulasExistentes.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe un aula con ese código"
            });
        }

        const [resultado] = await db.query(
            `
            INSERT INTO aula (
                codigo,
                capacidad,
                estado
            )
            VALUES (?, ?, ?)
            `,
            [
                codigoNormalizado,
                capacidad,
                estado
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Aula creada correctamente",
            id_aula: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear aula:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe un aula con ese código"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al crear el aula"
        });
    }
};
// ==========================================
// Actualizar un aula
// ==========================================
const actualizarAula = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            codigo,
            capacidad = null,
            estado = 1
        } = req.body;

        if (typeof codigo !== "string" || !codigo.trim()) {
            return res.status(400).json({
                ok: false,
                mensaje: "El código del aula es obligatorio"
            });
        }

        if (
            capacidad !== null &&
            (!Number.isInteger(capacidad) || capacidad <= 0)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La capacidad debe ser un número entero mayor que cero"
            });
        }

        if (![0, 1].includes(estado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        // Verificar que el aula exista
        const [aulas] = await db.query(
            `
            SELECT id_aula
            FROM aula
            WHERE id_aula = ?
            `,
            [id]
        );

        if (aulas.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Aula no encontrada"
            });
        }

        const codigoNormalizado = codigo.trim().toUpperCase();

        // Verificar que el código no pertenezca a otra aula
        const [duplicadas] = await db.query(
            `
            SELECT id_aula
            FROM aula
            WHERE codigo = ?
              AND id_aula <> ?
            `,
            [codigoNormalizado, id]
        );

        if (duplicadas.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe otra aula con ese código"
            });
        }

        await db.query(
            `
            UPDATE aula
            SET
                codigo = ?,
                capacidad = ?,
                estado = ?
            WHERE id_aula = ?
            `,
            [
                codigoNormalizado,
                capacidad,
                estado,
                id
            ]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Aula actualizada correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar aula:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe otra aula con ese código"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar el aula"
        });
    }
};
// ==========================================
// Eliminar un aula
// ==========================================
const eliminarAula = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el aula exista
        const [aulas] = await db.query(
            `
            SELECT id_aula
            FROM aula
            WHERE id_aula = ?
            `,
            [id]
        );

        if (aulas.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Aula no encontrada"
            });
        }

        await db.query(
            `
            DELETE FROM aula
            WHERE id_aula = ?
            `,
            [id]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Aula eliminada correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar aula:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "No se puede eliminar el aula porque tiene horarios relacionados"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar el aula"
        });
    }
};
module.exports = {
    obtenerAulas,
    obtenerAulaPorId,
    crearAula,
    actualizarAula,
    eliminarAula
};