const db = require("../config/database");
//esta función permitirá validar el formato de la fecha, sin embargo, sólo se puede por Año/mes/dia Areandina-fisio
const esFechaValida = (fecha) => {
    if (typeof fecha !== "string") {
        return false;
    }

    const formato = /^\d{4}-\d{2}-\d{2}$/;

    if (!formato.test(fecha)) {
        return false;
    }

    const fechaConvertida = new Date(`${fecha}T00:00:00Z`);

    return (
        !Number.isNaN(fechaConvertida.getTime()) &&
        fechaConvertida.toISOString().slice(0, 10) === fecha
    );
};

// ==========================================
// Obtener todos los períodos académicos
// ==========================================
const obtenerPeriodos = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id_periodo,
                nombre_periodo,
                DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
                DATE_FORMAT(fecha_final, '%Y-%m-%d') AS fecha_final,
                estado
            FROM periodo_academico
            ORDER BY fecha_inicio DESC
        `);

        res.status(200).json({
            ok: true,
            total: rows.length,
            periodos: rows
        });
    } catch (error) {
        console.error("Error al obtener períodos:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener los períodos académicos"
        });
    }
};
// ==========================================
// Obtener un período académico por ID
// ==========================================
const obtenerPeriodoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                id_periodo,
                nombre_periodo,
                DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
                DATE_FORMAT(fecha_final, '%Y-%m-%d') AS fecha_final,
                estado
            FROM periodo_academico
            WHERE id_periodo = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Período académico no encontrado"
            });
        }

        res.status(200).json({
            ok: true,
            periodo: rows[0]
        });
    } catch (error) {
        console.error("Error al obtener período:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el período académico"
        });
    }
};
// ==========================================
// Crear un período académico
// ==========================================
const crearPeriodo = async (req, res) => {
    try {
        const {
            nombre_periodo,
            fecha_inicio,
            fecha_final,
            estado = 1
        } = req.body;

        if (
            typeof nombre_periodo !== "string" ||
            !nombre_periodo.trim()
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre del período es obligatorio"
            });
        }

        if (nombre_periodo.trim().length > 30) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El nombre del período no puede superar 30 caracteres"
            });
        }

        if (
            !esFechaValida(fecha_inicio) ||
            !esFechaValida(fecha_final)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Las fechas deben ser válidas y usar el formato YYYY-MM-DD"
            });
        }

        if (fecha_inicio >= fecha_final) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha final debe ser posterior a la fecha de inicio"
            });
        }

        if (![0, 1].includes(estado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        const nombreNormalizado = nombre_periodo.trim().toUpperCase();

        const [periodosExistentes] = await db.query(
            `
            SELECT id_periodo
            FROM periodo_academico
            WHERE nombre_periodo = ?
            `,
            [nombreNormalizado]
        );

        if (periodosExistentes.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe un período con ese nombre"
            });
        }

        const [resultado] = await db.query(
            `
            INSERT INTO periodo_academico (
                nombre_periodo,
                fecha_inicio,
                fecha_final,
                estado
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                nombreNormalizado,
                fecha_inicio,
                fecha_final,
                estado
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Período académico creado correctamente",
            id_periodo: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear período:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe un período con ese nombre"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al crear el período académico"
        });
    }
};
// ==========================================
// Actualizar un período académico
// ==========================================
const actualizarPeriodo = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombre_periodo,
            fecha_inicio,
            fecha_final,
            estado = 1
        } = req.body;

        if (
            typeof nombre_periodo !== "string" ||
            !nombre_periodo.trim()
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre del período es obligatorio"
            });
        }

        if (nombre_periodo.trim().length > 30) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El nombre del período no puede superar 30 caracteres"
            });
        }

        if (
            !esFechaValida(fecha_inicio) ||
            !esFechaValida(fecha_final)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Las fechas deben ser válidas y usar el formato YYYY-MM-DD"
            });
        }

        if (fecha_inicio >= fecha_final) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha final debe ser posterior a la fecha de inicio"
            });
        }

        if (![0, 1].includes(estado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        // Verificar que el período exista
        const [periodos] = await db.query(
            `
            SELECT id_periodo
            FROM periodo_academico
            WHERE id_periodo = ?
            `,
            [id]
        );

        if (periodos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Período académico no encontrado"
            });
        }

        const nombreNormalizado = nombre_periodo.trim().toUpperCase();

        // Verificar que el nombre no pertenezca a otro período
        const [duplicados] = await db.query(
            `
            SELECT id_periodo
            FROM periodo_academico
            WHERE nombre_periodo = ?
              AND id_periodo <> ?
            `,
            [nombreNormalizado, id]
        );

        if (duplicados.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe otro período con ese nombre"
            });
        }

        await db.query(
            `
            UPDATE periodo_academico
            SET
                nombre_periodo = ?,
                fecha_inicio = ?,
                fecha_final = ?,
                estado = ?
            WHERE id_periodo = ?
            `,
            [
                nombreNormalizado,
                fecha_inicio,
                fecha_final,
                estado,
                id
            ]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Período académico actualizado correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar período:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe otro período con ese nombre"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar el período académico"
        });
    }
};
// ==========================================
// Eliminar un período académico
// ==========================================
const eliminarPeriodo = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el período exista
        const [periodos] = await db.query(
            `
            SELECT id_periodo
            FROM periodo_academico
            WHERE id_periodo = ?
            `,
            [id]
        );

        if (periodos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Período académico no encontrado"
            });
        }

        await db.query(
            `
            DELETE FROM periodo_academico
            WHERE id_periodo = ?
            `,
            [id]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Período académico eliminado correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar período:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "No se puede eliminar el período porque tiene asignaciones relacionadas"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar el período académico"
        });
    }
};
module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId,
    crearPeriodo,
    actualizarPeriodo,
    eliminarPeriodo
};