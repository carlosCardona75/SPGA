const db = require("../config/database");

const obtenerDocentes = async (req, res) => {
    try {

        const [rows] = await db.query(
            "SELECT * FROM docente"
        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener docentes"
        });

    }
};

module.exports = {
    obtenerDocentes
};