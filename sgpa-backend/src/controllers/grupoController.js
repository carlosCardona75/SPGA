const db = require("../config/database");

// ==========================================
// Obtener todos los grupos
// ==========================================
const obtenerGrupos = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                g.id_grupo,
                g.cod_grupo,
                g.descripcion,
                g.id_materia,
                m.codigo AS codigo_materia,
                m.nombre_materia,
                g.estado
            FROM grupo g
            INNER JOIN materia m
                ON g.id_materia = m.id_materia
            ORDER BY g.descripcion, g.cod_grupo
        `);

        console.log("Cantidad de grupos:", rows.length);
        console.log(rows);

        res.status(200).json({
            ok: true,
            total: rows.length,
            grupos: rows
        });
    } catch (error) {
        console.error("Error al obtener grupos:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener los grupos"
        });
    }
};

// ==========================================
// Obtener un grupo por ID
// ==========================================
const obtenerGrupoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                g.id_grupo,
                g.cod_grupo,
                g.descripcion,
                g.id_materia,
                m.codigo AS codigo_materia,
                m.nombre_materia,
                g.estado
            FROM grupo g
            INNER JOIN materia m
                ON g.id_materia = m.id_materia
            WHERE g.id_grupo = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Grupo no encontrado"
            });
        }

        res.status(200).json({
            ok: true,
            grupo: rows[0]
        });
    } catch (error) {
        console.error("Error al obtener grupo:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el grupo"
        });
    }
};

// ==========================================
// Crear un grupo
// ==========================================
const crearGrupo = async (req, res) => {
    try {
        const {
            cod_grupo,
            descripcion,
            id_materia,
            estado = 1
        } = req.body;

        if (!cod_grupo || !descripcion || !id_materia) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los campos cod_grupo, descripcion e id_materia son obligatorios"
            });
        }

        // Verificar que la materia exista
        const [materias] = await db.query(
            `
            SELECT id_materia
            FROM materia
            WHERE id_materia = ?
            `,
            [id_materia]
        );

        if (materias.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "La materia indicada no existe"
            });
        }

        const [resultado] = await db.query(
            `
            INSERT INTO grupo (
                cod_grupo,
                descripcion,
                id_materia,
                estado
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cod_grupo,
                descripcion,
                id_materia,
                estado
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Grupo creado correctamente",
            id_grupo: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear grupo:", error);

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(409).json({
                ok: false,
                mensaje: "La materia relacionada no existe"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al crear el grupo"
        });
    }
};

// ==========================================
// Actualizar un grupo
// ==========================================
const actualizarGrupo = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            cod_grupo,
            descripcion,
            id_materia,
            estado = 1
        } = req.body;

        if (!cod_grupo || !descripcion || !id_materia) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los campos cod_grupo, descripcion e id_materia son obligatorios"
            });
        }

        // Verificar que el grupo exista
        const [grupos] = await db.query(
            `
            SELECT id_grupo
            FROM grupo
            WHERE id_grupo = ?
            `,
            [id]
        );

        if (grupos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Grupo no encontrado"
            });
        }

        // Verificar que la materia exista
        const [materias] = await db.query(
            `
            SELECT id_materia
            FROM materia
            WHERE id_materia = ?
            `,
            [id_materia]
        );

        if (materias.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "La materia indicada no existe"
            });
        }

        await db.query(
            `
            UPDATE grupo
            SET
                cod_grupo = ?,
                descripcion = ?,
                id_materia = ?,
                estado = ?
            WHERE id_grupo = ?
            `,
            [
                cod_grupo,
                descripcion,
                id_materia,
                estado,
                id
            ]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Grupo actualizado correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar grupo:", error);

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(409).json({
                ok: false,
                mensaje: "La materia relacionada no existe"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar el grupo"
        });
    }
};

// ==========================================
// Eliminar un grupo
// ==========================================
const eliminarGrupo = async (req, res) => {
    try {
        const { id } = req.params;

        const [grupos] = await db.query(
            `
            SELECT id_grupo
            FROM grupo
            WHERE id_grupo = ?
            `,
            [id]
        );

        if (grupos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Grupo no encontrado"
            });
        }

        await db.query(
            `
            DELETE FROM grupo
            WHERE id_grupo = ?
            `,
            [id]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Grupo eliminado correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar grupo:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "No se puede eliminar el grupo porque tiene registros relacionados"
            });
        }

        res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar el grupo"
        });
    }
};

module.exports = {
    obtenerGrupos,
    obtenerGrupoPorId,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo
};
