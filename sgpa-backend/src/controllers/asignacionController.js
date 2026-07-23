const db = require("../config/database");


// Obtener asignaciones
const obtenerAsignaciones = async (req, res) => {
    try {
        const idDocenteForzado =
            res.locals.idDocenteForzado;

        const where = idDocenteForzado
            ? "WHERE a.id_docente = ?"
            : "";

        const valores = idDocenteForzado
            ? [idDocenteForzado]
            : [];

        const [rows] = await db.query(
            `
            SELECT
                a.id_asignacion,
                a.id_docente,
                d.cedula,
                CONCAT(d.nombres, ' ', d.apellidos)
                    AS nombre_docente,
                a.id_grupo,
                g.cod_grupo,
                g.descripcion AS descripcion_grupo,
                m.codigo AS codigo_materia,
                m.nombre_materia,
                a.id_periodo,
                p.nombre_periodo,
                p.fecha_inicio,
                p.fecha_final,
                a.estado
            FROM asignacion a
            INNER JOIN docente d
                ON a.id_docente = d.id_docente
            INNER JOIN grupo g
                ON a.id_grupo = g.id_grupo
            INNER JOIN materia m
                ON g.id_materia = m.id_materia
            INNER JOIN periodo_academico p
                ON a.id_periodo = p.id_periodo
            ${where}
            ORDER BY a.id_asignacion
            `,
            valores
        );

        const filtrosAplicados = {};

        if (idDocenteForzado) {
            filtrosAplicados.id_docente = String(
                idDocenteForzado
            );
        }

        res.status(200).json({
            ok: true,
            total: rows.length,
            filtros: filtrosAplicados,
            asignaciones: rows
        });
    } catch (error) {
        console.error(
            "Error al obtener asignaciones:",
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener las asignaciones"
        });
    }
};
// Obtener las asignaciones del docente autenticado
const obtenerMisAsignaciones = async (req, res) => {
    const idDocente = req.usuario?.id_docente;

    if (!idDocente) {
        return res.status(403).json({
            ok: false,
            mensaje: "El usuario autenticado no está asociado a un docente"
        });
    }

    res.locals.idDocenteForzado = idDocente;

    return obtenerAsignaciones(req, res);
};
// Obtener una asignación por ID
const obtenerAsignacionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                a.id_asignacion,
                a.id_docente,
                d.cedula,
                CONCAT(d.nombres, ' ', d.apellidos) AS nombre_docente,
                a.id_grupo,
                g.cod_grupo,
                g.descripcion AS descripcion_grupo,
                m.codigo AS codigo_materia,
                m.nombre_materia,
                a.id_periodo,
                p.nombre_periodo,
                p.fecha_inicio,
                p.fecha_final,
                a.estado
            FROM asignacion a
            INNER JOIN docente d
                ON a.id_docente = d.id_docente
            INNER JOIN grupo g
                ON a.id_grupo = g.id_grupo
            INNER JOIN materia m
                ON g.id_materia = m.id_materia
            INNER JOIN periodo_academico p
                ON a.id_periodo = p.id_periodo
            WHERE a.id_asignacion = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Asignación no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            asignacion: rows[0]
        });
    } catch (error) {
        console.error("Error al obtener la asignación:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener la asignación"
        });
    }
};
// Crear una asignación
const crearAsignacion = async (req, res) => {
    try {
        const {
            id_docente,
            id_grupo,
            id_periodo,
            estado = 1
        } = req.body;

        // Validar campos obligatorios
        if (!id_docente || !id_grupo || !id_periodo) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos id_docente, id_grupo e id_periodo son obligatorios"
            });
        }

        // Validar el estado
        if (![0, 1].includes(Number(estado))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        // Verificar que el docente exista
        const [docentes] = await db.query(
            "SELECT id_docente FROM docente WHERE id_docente = ?",
            [id_docente]
        );

        if (docentes.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El docente indicado no existe"
            });
        }

        // Verificar que el grupo exista
        const [grupos] = await db.query(
            "SELECT id_grupo FROM grupo WHERE id_grupo = ?",
            [id_grupo]
        );

        if (grupos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El grupo indicado no existe"
            });
        }

        // Verificar que el período exista
        const [periodos] = await db.query(
            "SELECT id_periodo FROM periodo_academico WHERE id_periodo = ?",
            [id_periodo]
        );

        if (periodos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El período académico indicado no existe"
            });
        }

        // Evitar una asignación duplicada
        const [asignacionesExistentes] = await db.query(
            `
            SELECT id_asignacion
            FROM asignacion
            WHERE id_docente = ?
              AND id_grupo = ?
              AND id_periodo = ?
            `,
            [id_docente, id_grupo, id_periodo]
        );

        if (asignacionesExistentes.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El docente ya está asignado a ese grupo en el período indicado"
            });
        }

        // Insertar la asignación
        const [resultado] = await db.query(
            `
            INSERT INTO asignacion (
                id_docente,
                id_grupo,
                id_periodo,
                estado
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                id_docente,
                id_grupo,
                id_periodo,
                Number(estado)
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Asignación creada correctamente",
            id_asignacion: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear la asignación:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al crear la asignación"
        });
    }
};
// Actualizar una asignación
const actualizarAsignacion = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_docente,
            id_grupo,
            id_periodo,
            estado
        } = req.body;

        // Validar campos obligatorios
        if (
            !id_docente ||
            !id_grupo ||
            !id_periodo ||
            estado === undefined
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos id_docente, id_grupo, id_periodo y estado son obligatorios"
            });
        }

        // Validar el estado
        if (![0, 1].includes(Number(estado))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        // Verificar que la asignación exista
        const [asignaciones] = await db.query(
            "SELECT id_asignacion FROM asignacion WHERE id_asignacion = ?",
            [id]
        );

        if (asignaciones.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Asignación no encontrada"
            });
        }

        // Verificar que el docente exista
        const [docentes] = await db.query(
            "SELECT id_docente FROM docente WHERE id_docente = ?",
            [id_docente]
        );

        if (docentes.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El docente indicado no existe"
            });
        }

        // Verificar que el grupo exista
        const [grupos] = await db.query(
            "SELECT id_grupo FROM grupo WHERE id_grupo = ?",
            [id_grupo]
        );

        if (grupos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El grupo indicado no existe"
            });
        }

        // Verificar que el período exista
        const [periodos] = await db.query(
            "SELECT id_periodo FROM periodo_academico WHERE id_periodo = ?",
            [id_periodo]
        );

        if (periodos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El período académico indicado no existe"
            });
        }

        // Evitar que la actualización genere un duplicado
        const [duplicados] = await db.query(
            `
            SELECT id_asignacion
            FROM asignacion
            WHERE id_docente = ?
              AND id_grupo = ?
              AND id_periodo = ?
              AND id_asignacion <> ?
            `,
            [id_docente, id_grupo, id_periodo, id]
        );

        if (duplicados.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El docente ya está asignado a ese grupo en el período indicado"
            });
        }

        // Actualizar la asignación
        await db.query(
            `
            UPDATE asignacion
            SET id_docente = ?,
                id_grupo = ?,
                id_periodo = ?,
                estado = ?
            WHERE id_asignacion = ?
            `,
            [
                id_docente,
                id_grupo,
                id_periodo,
                Number(estado),
                id
            ]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Asignación actualizada correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar la asignación:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar la asignación"
        });
    }
};
// Eliminar una asignación
const eliminarAsignacion = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la asignación exista
        const [asignaciones] = await db.query(
            "SELECT id_asignacion FROM asignacion WHERE id_asignacion = ?",
            [id]
        );

        if (asignaciones.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Asignación no encontrada"
            });
        }

        // Verificar si tiene detalles de horario relacionados
        const [detallesHorario] = await db.query(
            `
            SELECT id_detalle
            FROM detalle_horario
            WHERE id_asignacion = ?
            LIMIT 1
            `,
            [id]
        );

        if (detallesHorario.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "No se puede eliminar la asignación porque tiene horarios relacionados"
            });
        }

        // Eliminar la asignación
        await db.query(
            "DELETE FROM asignacion WHERE id_asignacion = ?",
            [id]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Asignación eliminada correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar la asignación:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar la asignación"
        });
    }
};
module.exports = {
    obtenerAsignaciones,
    obtenerMisAsignaciones,
    obtenerAsignacionPorId,
    crearAsignacion,
    actualizarAsignacion,
    eliminarAsignacion
};