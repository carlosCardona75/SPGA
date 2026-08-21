const ExcelJS = require("exceljs");

const db = require("../config/database");

const aSegundos = (hora) => {
    if (!hora) return 0;

    const partes = String(hora).split(":").map(Number);

    return (partes[0] || 0) * 3600 + (partes[1] || 0) * 60 + (partes[2] || 0);
};

// Exportar los reportes del sistema a un archivo Excel con una hoja por reporte
const exportarReportes = async (req, res) => {
    try {
        const [horarios] = await db.query(`
            SELECT
                a.id_docente,
                CONCAT(d.nombres, ' ', d.apellidos) AS nombre_docente,
                p.nombre_periodo,
                au.codigo AS codigo_aula,
                dh.dia_semana,
                dh.hora_inicio,
                dh.hora_fin
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
        `);

        const [docentes] = await db.query(`
            SELECT id_docente, nombres, apellidos
            FROM docente
        `);

        // Reporte 1: horas programadas por docente
        const mapaDocentes = new Map();

        docentes.forEach((docente) => {
            const nombre =
                `${docente.nombres} ${docente.apellidos}`.trim();

            if (nombre && !mapaDocentes.has(docente.id_docente)) {
                mapaDocentes.set(docente.id_docente, {
                    nombre,
                    segundos: 0,
                    cantidad: 0
                });
            }
        });

        horarios.forEach((horario) => {
            const segundos =
                aSegundos(horario.hora_fin) -
                aSegundos(horario.hora_inicio);

            if (!mapaDocentes.has(horario.id_docente)) {
                mapaDocentes.set(horario.id_docente, {
                    nombre: horario.nombre_docente || "Sin docente",
                    segundos: 0,
                    cantidad: 0
                });
            }

            const registro = mapaDocentes.get(horario.id_docente);
            registro.segundos += Math.max(segundos, 0);
            registro.cantidad += 1;
        });

        const horasPorDocente = Array.from(mapaDocentes.values())
            .map((registro) => ({
                docente: registro.nombre,
                horarios: registro.cantidad,
                total_horas:
                    Math.round((registro.segundos / 3600) * 100) / 100
            }))
            .sort((a, b) => b.total_horas - a.total_horas);

        // Reporte 2: horarios por período
        const mapaPeriodos = new Map();

        horarios.forEach((horario) => {
            const periodo =
                horario.nombre_periodo || "Sin período";

            if (!mapaPeriodos.has(periodo)) {
                mapaPeriodos.set(periodo, { cantidad: 0, sinAula: 0 });
            }

            const registro = mapaPeriodos.get(periodo);
            registro.cantidad += 1;

            if (
                horario.codigo_aula === null ||
                horario.codigo_aula === undefined
            ) {
                registro.sinAula += 1;
            }
        });

        const horariosPorPeriodo = Array.from(mapaPeriodos.entries())
            .map(([periodo, datos]) => ({
                periodo,
                horarios: datos.cantidad,
                sin_aula: datos.sinAula
            }))
            .sort((a, b) => b.horarios - a.horarios);

        // Reporte 3: horarios por día de la semana
        const ordenDias = [
            "LUNES",
            "MARTES",
            "MIERCOLES",
            "JUEVES",
            "VIERNES",
            "SABADO"
        ];

        const mapaDias = new Map();

        horarios.forEach((horario) => {
            const dia = horario.dia_semana || "SIN DIA";

            if (!mapaDias.has(dia)) {
                mapaDias.set(dia, { cantidad: 0 });
            }

            mapaDias.get(dia).cantidad += 1;
        });

        const horariosPorDia = Array.from(mapaDias.entries())
            .map(([dia, datos]) => ({ dia, horarios: datos.cantidad }))
            .sort(
                (a, b) =>
                    ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia)
            );

        // Reporte 4: uso de aulas
        const mapaAulas = new Map();

        horarios.forEach((horario) => {
            if (
                horario.codigo_aula === null ||
                horario.codigo_aula === undefined
            ) {
                return;
            }

            const codigo = horario.codigo_aula || "Sin código";

            if (!mapaAulas.has(codigo)) {
                mapaAulas.set(codigo, { cantidad: 0 });
            }

            mapaAulas.get(codigo).cantidad += 1;
        });

        const usoDeAulas = Array.from(mapaAulas.entries())
            .map(([aula, datos]) => ({ aula, horarios: datos.cantidad }))
            .sort((a, b) => b.horarios - a.horarios);

        if (horarios.length === 0 && docentes.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "No hay datos para generar los reportes"
            });
        }

        const libro = new ExcelJS.Workbook();
        libro.creator = "SGPA";
        libro.created = new Date();

        const agregarHoja = (nombre, columnas, filas) => {
            const hoja = libro.addWorksheet(nombre);

            hoja.columns = columnas;

            hoja.addRows(filas);

            const encabezado = hoja.getRow(1);

            encabezado.font = {
                bold: true,
                color: {
                    argb: "FFFFFFFF"
                }
            };

            encabezado.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "FF1F4E78"
                }
            };

            encabezado.alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            hoja.views = [
                {
                    state: "frozen",
                    ySplit: 1
                }
            ];

            hoja.autoFilter = {
                from: {
                    row: 1,
                    column: 1
                },
                to: {
                    row: 1,
                    column: columnas.length
                }
            };
        };

        agregarHoja(
            "Horas por docente",
            [
                { header: "docente", key: "docente", width: 38 },
                { header: "horarios", key: "horarios", width: 12 },
                { header: "total_horas", key: "total_horas", width: 14 }
            ],
            horasPorDocente
        );

        agregarHoja(
            "Horarios por periodo",
            [
                { header: "periodo", key: "periodo", width: 18 },
                { header: "horarios", key: "horarios", width: 12 },
                { header: "sin_aula", key: "sin_aula", width: 12 }
            ],
            horariosPorPeriodo
        );

        agregarHoja(
            "Horarios por dia",
            [
                { header: "dia", key: "dia", width: 16 },
                { header: "horarios", key: "horarios", width: 12 }
            ],
            horariosPorDia
        );

        agregarHoja(
            "Uso de aulas",
            [
                { header: "aula", key: "aula", width: 18 },
                { header: "horarios", key: "horarios", width: 12 }
            ],
            usoDeAulas
        );

        const archivoExcel = Buffer.from(
            await libro.xlsx.writeBuffer()
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="reporte_sgpa.xlsx"'
        );

        return res.status(200).send(archivoExcel);
    } catch (error) {
        console.error("Error al exportar reportes:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al exportar los reportes"
        });
    }
};

module.exports = {
    exportarReportes
};
