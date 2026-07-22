const db = require("../config/database");
const DIAS_VALIDOS = [
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO"
];

// Validar y normalizar una hora al formato HH:MM:SS
const normalizarHora = (hora) => {
    if (typeof hora !== "string") {
        return null;
    }

    const formatoHora = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
    const coincidencia = hora.match(formatoHora);

    if (!coincidencia) {
        return null;
    }

    const segundos = coincidencia[3] || "00";

    return `${coincidencia[1]}:${coincidencia[2]}:${segundos}`;
};

// Obtener todos los horarios
// Obtener horarios con filtros opcionales
const obtenerHorarios = async (req, res) => {
    try {
        const {
            id_docente,
            id_grupo,
            id_periodo,
            id_aula,
            dia_semana,
            estado,
            aula_pendiente
        } = req.query;

        const condiciones = [];
        const valores = [];

        if (id_docente) {
            condiciones.push("a.id_docente = ?");
            valores.push(id_docente);
        }

        if (id_grupo) {
            condiciones.push("a.id_grupo = ?");
            valores.push(id_grupo);
        }

        if (id_periodo) {
            condiciones.push("a.id_periodo = ?");
            valores.push(id_periodo);
        }

        if (id_aula) {
            condiciones.push("dh.id_aula = ?");
            valores.push(id_aula);
        }

        if (dia_semana) {
            const diaNormalizado = String(dia_semana)
                .trim()
                .toUpperCase();

            if (!DIAS_VALIDOS.includes(diaNormalizado)) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "El día de la semana no es válido"
                });
            }

            condiciones.push("dh.dia_semana = ?");
            valores.push(diaNormalizado);
        }

        if (estado !== undefined) {
            if (![0, 1].includes(Number(estado))) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "El estado debe ser 0 o 1"
                });
            }

            condiciones.push("dh.estado = ?");
            valores.push(Number(estado));
        }

        if (aula_pendiente !== undefined) {
            if (!["true", "false"].includes(aula_pendiente)) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "aula_pendiente debe ser true o false"
                });
            }

            condiciones.push(
                aula_pendiente === "true"
                    ? "dh.id_aula IS NULL"
                    : "dh.id_aula IS NOT NULL"
            );
        }

        if (id_aula && aula_pendiente !== undefined) {
            return res.status(400).json({
                ok: false,
                mensaje: "No se puede combinar id_aula con aula_pendiente"
            });
        }

        const where =
            condiciones.length > 0
                ? `WHERE ${condiciones.join(" AND ")}`
                : "";

        const [rows] = await db.query(
            `
            SELECT
                dh.id_detalle,
                dh.id_asignacion,
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
                dh.id_aula,
                au.codigo AS codigo_aula,
                au.capacidad,
                dh.dia_semana,
                dh.hora_inicio,
                dh.hora_fin,
                dh.estado
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            INNER JOIN docente d
                ON a.id_docente = d.id_docente
            INNER JOIN grupo g
                ON a.id_grupo = g.id_grupo
            INNER JOIN materia m
                ON g.id_materia = m.id_materia
            INNER JOIN periodo_academico p
                ON a.id_periodo = p.id_periodo
            LEFT JOIN aula au
                ON dh.id_aula = au.id_aula
            ${where}
            ORDER BY dh.id_detalle
            `,
            valores
        );

        res.status(200).json({
            ok: true,
            total: rows.length,
            filtros: req.query,
            horarios: rows
        });
    } catch (error) {
        console.error("Error al obtener horarios:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener los horarios"
        });
    }
};
// Obtener un horario por ID
const obtenerHorarioPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                dh.id_detalle,
                dh.id_asignacion,
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
                dh.id_aula,
                au.codigo AS codigo_aula,
                au.capacidad,
                dh.dia_semana,
                dh.hora_inicio,
                dh.hora_fin,
                dh.estado
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            INNER JOIN docente d
                ON a.id_docente = d.id_docente
            INNER JOIN grupo g
                ON a.id_grupo = g.id_grupo
            INNER JOIN materia m
                ON g.id_materia = m.id_materia
            INNER JOIN periodo_academico p
                ON a.id_periodo = p.id_periodo
            LEFT JOIN aula au
                ON dh.id_aula = au.id_aula
            WHERE dh.id_detalle = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Horario no encontrado"
            });
        }

        res.status(200).json({
            ok: true,
            horario: rows[0]
        });
    } catch (error) {
        console.error("Error al obtener el horario:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el horario"
        });
    }
};
// Crear un horario
const crearHorario = async (req, res) => {
    try {
        const {
            id_asignacion,
            id_aula = null,
            dia_semana,
            hora_inicio,
            hora_fin,
            estado = 1
        } = req.body;

        // Validar campos obligatorios
        if (!id_asignacion || !dia_semana || !hora_inicio || !hora_fin) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos id_asignacion, dia_semana, hora_inicio y hora_fin son obligatorios"
            });
        }

        const diaNormalizado = String(dia_semana).trim().toUpperCase();
        const horaInicioNormalizada = normalizarHora(hora_inicio);
        const horaFinNormalizada = normalizarHora(hora_fin);

        // Validar día
        if (!DIAS_VALIDOS.includes(diaNormalizado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El día de la semana no es válido"
            });
        }

        // Validar formato de horas
        if (!horaInicioNormalizada || !horaFinNormalizada) {
            return res.status(400).json({
                ok: false,
                mensaje: "Las horas deben tener un formato válido HH:MM o HH:MM:SS"
            });
        }

        // Validar orden de las horas
        if (horaInicioNormalizada >= horaFinNormalizada) {
            return res.status(400).json({
                ok: false,
                mensaje: "La hora de inicio debe ser menor que la hora final"
            });
        }

        // Validar estado
        if (![0, 1].includes(Number(estado))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        // Obtener la asignación, el docente, el grupo y el período
        const [asignaciones] = await db.query(
            `
            SELECT
                a.id_asignacion,
                a.id_docente,
                a.id_grupo,
                a.id_periodo,
                d.max_horas
            FROM asignacion a
            INNER JOIN docente d
                ON a.id_docente = d.id_docente
            WHERE a.id_asignacion = ?
              AND a.estado = 1
            `,
            [id_asignacion]
        );

        if (asignaciones.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "La asignación indicada no existe o está inactiva"
            });
        }

        const asignacion = asignaciones[0];
        const aulaNormalizada =
            id_aula === null || id_aula === undefined || id_aula === ""
                ? null
                : id_aula;

        // Validar el aula únicamente cuando fue indicada
        if (aulaNormalizada !== null) {
            const [aulas] = await db.query(
                `
                SELECT id_aula
                FROM aula
                WHERE id_aula = ?
                  AND estado = 1
                `,
                [aulaNormalizada]
            );

            if (aulas.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "El aula indicada no existe o está inactiva"
                });
            }
        }

        // Verificar cruce de horario del docente
        const [crucesDocente] = await db.query(
            `
            SELECT dh.id_detalle
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            WHERE a.id_docente = ?
              AND a.id_periodo = ?
              AND dh.dia_semana = ?
              AND dh.estado = 1
              AND ? < dh.hora_fin
              AND ? > dh.hora_inicio
            LIMIT 1
            `,
            [
                asignacion.id_docente,
                asignacion.id_periodo,
                diaNormalizado,
                horaInicioNormalizada,
                horaFinNormalizada
            ]
        );

        if (crucesDocente.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El docente ya tiene un horario que se cruza con el rango indicado"
            });
        }

        // Verificar cruce de horario del grupo
        const [crucesGrupo] = await db.query(
            `
            SELECT dh.id_detalle
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            WHERE a.id_grupo = ?
              AND a.id_periodo = ?
              AND dh.dia_semana = ?
              AND dh.estado = 1
              AND ? < dh.hora_fin
              AND ? > dh.hora_inicio
            LIMIT 1
            `,
            [
                asignacion.id_grupo,
                asignacion.id_periodo,
                diaNormalizado,
                horaInicioNormalizada,
                horaFinNormalizada
            ]
        );

        if (crucesGrupo.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El grupo ya tiene un horario que se cruza con el rango indicado"
            });
        }

        // Verificar cruce de aula solamente cuando hay un aula asignada
        if (aulaNormalizada !== null) {
            const [crucesAula] = await db.query(
                `
                SELECT dh.id_detalle
                FROM detalle_horario dh
                INNER JOIN asignacion a
                    ON dh.id_asignacion = a.id_asignacion
                WHERE dh.id_aula = ?
                  AND a.id_periodo = ?
                  AND dh.dia_semana = ?
                  AND dh.estado = 1
                  AND ? < dh.hora_fin
                  AND ? > dh.hora_inicio
                LIMIT 1
                `,
                [
                    aulaNormalizada,
                    asignacion.id_periodo,
                    diaNormalizado,
                    horaInicioNormalizada,
                    horaFinNormalizada
                ]
            );

            if (crucesAula.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: "El aula ya está ocupada en el rango de horario indicado"
                });
            }
        }

        // Calcular la duración del horario nuevo
        const convertirASegundos = (hora) => {
            const [horas, minutos, segundos] = hora.split(":").map(Number);

            return horas * 3600 + minutos * 60 + segundos;
        };

        const duracionNueva =
            (
                convertirASegundos(horaFinNormalizada) -
                convertirASegundos(horaInicioNormalizada)
            ) / 3600;

        // Calcular las horas actuales del docente en el período
        const [cargaHoraria] = await db.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        TIME_TO_SEC(
                            TIMEDIFF(dh.hora_fin, dh.hora_inicio)
                        ) / 3600
                    ),
                    0
                ) AS total_horas
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            WHERE a.id_docente = ?
              AND a.id_periodo = ?
              AND dh.estado = 1
            `,
            [
                asignacion.id_docente,
                asignacion.id_periodo
            ]
        );

        const horasActuales = Number(cargaHoraria[0].total_horas);
        const maxHoras = Number(asignacion.max_horas);

        if (horasActuales + duracionNueva > maxHoras) {
            return res.status(409).json({
                ok: false,
                mensaje: `El docente superaría el máximo permitido de ${maxHoras} horas`
            });
        }

        // Insertar el horario
        const [resultado] = await db.query(
            `
            INSERT INTO detalle_horario (
                id_asignacion,
                id_aula,
                dia_semana,
                hora_inicio,
                hora_fin,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                id_asignacion,
                aulaNormalizada,
                diaNormalizado,
                horaInicioNormalizada,
                horaFinNormalizada,
                Number(estado)
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: "Horario creado correctamente",
            id_detalle: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear el horario:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al crear el horario"
        });
    }
};

// Actualizar un horario
const actualizarHorario = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_asignacion,
            id_aula = null,
            dia_semana,
            hora_inicio,
            hora_fin,
            estado
        } = req.body;

        if (
            !id_asignacion ||
            !dia_semana ||
            !hora_inicio ||
            !hora_fin ||
            estado === undefined
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los campos id_asignacion, dia_semana, hora_inicio, hora_fin y estado son obligatorios"
            });
        }

        const diaNormalizado = String(dia_semana).trim().toUpperCase();
        const horaInicioNormalizada = normalizarHora(hora_inicio);
        const horaFinNormalizada = normalizarHora(hora_fin);

        if (!DIAS_VALIDOS.includes(diaNormalizado)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El día de la semana no es válido"
            });
        }

        if (!horaInicioNormalizada || !horaFinNormalizada) {
            return res.status(400).json({
                ok: false,
                mensaje: "Las horas deben tener un formato válido HH:MM o HH:MM:SS"
            });
        }

        if (horaInicioNormalizada >= horaFinNormalizada) {
            return res.status(400).json({
                ok: false,
                mensaje: "La hora de inicio debe ser menor que la hora final"
            });
        }

        if (![0, 1].includes(Number(estado))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser 0 o 1"
            });
        }

        // Verificar que el horario exista
        const [horarios] = await db.query(
            "SELECT id_detalle FROM detalle_horario WHERE id_detalle = ?",
            [id]
        );

        if (horarios.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Horario no encontrado"
            });
        }

        // Obtener los datos de la asignación
        const [asignaciones] = await db.query(
            `
            SELECT
                a.id_asignacion,
                a.id_docente,
                a.id_grupo,
                a.id_periodo,
                d.max_horas
            FROM asignacion a
            INNER JOIN docente d
                ON a.id_docente = d.id_docente
            WHERE a.id_asignacion = ?
              AND a.estado = 1
            `,
            [id_asignacion]
        );

        if (asignaciones.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "La asignación indicada no existe o está inactiva"
            });
        }

        const asignacion = asignaciones[0];

        const aulaNormalizada =
            id_aula === null || id_aula === undefined || id_aula === ""
                ? null
                : id_aula;

        if (aulaNormalizada !== null) {
            const [aulas] = await db.query(
                `
                SELECT id_aula
                FROM aula
                WHERE id_aula = ?
                  AND estado = 1
                `,
                [aulaNormalizada]
            );

            if (aulas.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "El aula indicada no existe o está inactiva"
                });
            }
        }

        // Verificar cruce del docente, excluyendo el horario actual
        const [crucesDocente] = await db.query(
            `
            SELECT dh.id_detalle
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            WHERE a.id_docente = ?
              AND a.id_periodo = ?
              AND dh.dia_semana = ?
              AND dh.estado = 1
              AND dh.id_detalle <> ?
              AND ? < dh.hora_fin
              AND ? > dh.hora_inicio
            LIMIT 1
            `,
            [
                asignacion.id_docente,
                asignacion.id_periodo,
                diaNormalizado,
                id,
                horaInicioNormalizada,
                horaFinNormalizada
            ]
        );

        if (crucesDocente.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El docente ya tiene un horario que se cruza con el rango indicado"
            });
        }

        // Verificar cruce del grupo
        const [crucesGrupo] = await db.query(
            `
            SELECT dh.id_detalle
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            WHERE a.id_grupo = ?
              AND a.id_periodo = ?
              AND dh.dia_semana = ?
              AND dh.estado = 1
              AND dh.id_detalle <> ?
              AND ? < dh.hora_fin
              AND ? > dh.hora_inicio
            LIMIT 1
            `,
            [
                asignacion.id_grupo,
                asignacion.id_periodo,
                diaNormalizado,
                id,
                horaInicioNormalizada,
                horaFinNormalizada
            ]
        );

        if (crucesGrupo.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "El grupo ya tiene un horario que se cruza con el rango indicado"
            });
        }

        // Verificar cruce del aula
        if (aulaNormalizada !== null) {
            const [crucesAula] = await db.query(
                `
                SELECT dh.id_detalle
                FROM detalle_horario dh
                INNER JOIN asignacion a
                    ON dh.id_asignacion = a.id_asignacion
                WHERE dh.id_aula = ?
                  AND a.id_periodo = ?
                  AND dh.dia_semana = ?
                  AND dh.estado = 1
                  AND dh.id_detalle <> ?
                  AND ? < dh.hora_fin
                  AND ? > dh.hora_inicio
                LIMIT 1
                `,
                [
                    aulaNormalizada,
                    asignacion.id_periodo,
                    diaNormalizado,
                    id,
                    horaInicioNormalizada,
                    horaFinNormalizada
                ]
            );

            if (crucesAula.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: "El aula ya está ocupada en el rango de horario indicado"
                });
            }
        }

        const convertirASegundos = (hora) => {
            const [horas, minutos, segundos] = hora.split(":").map(Number);

            return horas * 3600 + minutos * 60 + segundos;
        };

        const duracionNueva =
            (
                convertirASegundos(horaFinNormalizada) -
                convertirASegundos(horaInicioNormalizada)
            ) / 3600;

        // Calcular la carga sin incluir el horario que se actualiza
        const [cargaHoraria] = await db.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        TIME_TO_SEC(
                            TIMEDIFF(dh.hora_fin, dh.hora_inicio)
                        ) / 3600
                    ),
                    0
                ) AS total_horas
            FROM detalle_horario dh
            INNER JOIN asignacion a
                ON dh.id_asignacion = a.id_asignacion
            WHERE a.id_docente = ?
              AND a.id_periodo = ?
              AND dh.estado = 1
              AND dh.id_detalle <> ?
            `,
            [
                asignacion.id_docente,
                asignacion.id_periodo,
                id
            ]
        );

        const horasActuales = Number(cargaHoraria[0].total_horas);
        const maxHoras = Number(asignacion.max_horas);

        if (horasActuales + duracionNueva > maxHoras) {
            return res.status(409).json({
                ok: false,
                mensaje: `El docente superaría el máximo permitido de ${maxHoras} horas`
            });
        }

        await db.query(
            `
            UPDATE detalle_horario
            SET id_asignacion = ?,
                id_aula = ?,
                dia_semana = ?,
                hora_inicio = ?,
                hora_fin = ?,
                estado = ?
            WHERE id_detalle = ?
            `,
            [
                id_asignacion,
                aulaNormalizada,
                diaNormalizado,
                horaInicioNormalizada,
                horaFinNormalizada,
                Number(estado),
                id
            ]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Horario actualizado correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar el horario:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar el horario"
        });
    }
};

// Eliminar un horario
const eliminarHorario = async (req, res) => {
    try {
        const { id } = req.params;

        const [horarios] = await db.query(
            "SELECT id_detalle FROM detalle_horario WHERE id_detalle = ?",
            [id]
        );

        if (horarios.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "Horario no encontrado"
            });
        }

        await db.query(
            "DELETE FROM detalle_horario WHERE id_detalle = ?",
            [id]
        );

        res.status(200).json({
            ok: true,
            mensaje: "Horario eliminado correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar el horario:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar el horario"
        });
    }
};
module.exports = {
    obtenerHorarios,
    obtenerHorarioPorId,
    crearHorario,
    actualizarHorario,
    eliminarHorario
};