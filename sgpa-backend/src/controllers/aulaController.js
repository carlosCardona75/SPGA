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
module.exports = {
    obtenerAulas,
    obtenerAulaPorId
};