const express = require("express");

const {
    autenticarToken,
    autorizarRoles
} = require("../middlewares/authMiddleware");

const router = express.Router();

const {
    obtenerAulas,
    obtenerAulaPorId,
    crearAula,
    actualizarAula,
    eliminarAula
} = require("../controllers/aulaController");

// Obtener todas las aulas
router.get(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerAulas
);

router.get(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN", "DOCENTE"),
    obtenerAulaPorId
);

router.post(
    "/",
    autenticarToken,
    autorizarRoles("ADMIN"),
    crearAula
);

router.put(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    actualizarAula
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarRoles("ADMIN"),
    eliminarAula
);

module.exports = router;
