const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    obtenerHorarios,
    obtenerMiHorario,
    obtenerHorarioPorId,
    crearHorario,
    actualizarHorario,
    eliminarHorario,
    exportarHorarios
} = require("../controllers/horarioController");


router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    obtenerHorarios
);

router.get(
    "/mi-horario",
    autenticarToken,
    autorizarRoles("DOCENTE"),
    obtenerMiHorario
);

router.get(
    "/exportar",
    autenticarToken,
    autorizarRoles("ADMIN"),
    exportarHorarios
);

router.get(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    obtenerHorarioPorId
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearHorario
);

router.put(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    actualizarHorario
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    eliminarHorario
);


module.exports = router;