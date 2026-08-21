import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import ApartmentIcon from "@mui/icons-material/Apartment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PeopleIcon from "@mui/icons-material/People";
import ScheduleIcon from "@mui/icons-material/Schedule";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Button from "@mui/material/Button";

import MainLayout from "../../layouts/MainLayout";
import { exportarReportes } from "../../services/reporteService";
import { obtenerHorarios } from "../../services/horarioService";
import { obtenerDocentes } from "../../services/docenteService";
import { obtenerAulas } from "../../services/aulaService";
import { obtenerPeriodos } from "../../services/periodoService";

const tarjetas = [
  {
    clave: "totalHorarios",
    etiqueta: "Horarios programados",
    icono: ScheduleIcon,
    color: "#0369A1",
    fondo: "#E0F2FE",
  },
  {
    clave: "sinAula",
    etiqueta: "Horarios sin aula",
    icono: ApartmentIcon,
    color: "#DC3545",
    fondo: "#F8D7DA",
  },
  {
    clave: "conAula",
    etiqueta: "Horarios con aula",
    icono: MeetingRoomIcon,
    color: "#198754",
    fondo: "#D1E7DD",
  },
  {
    clave: "docentesConHorario",
    etiqueta: "Docentes con horario",
    icono: PeopleIcon,
    color: "#3D7A2A",
    fondo: "#DFF2D8",
  },
];

const aSegundos = (hora) => {
  if (!hora) return 0;

  const partes = String(hora).split(":").map(Number);
  const horas = partes[0] || 0;
  const minutos = partes[1] || 0;
  const segundos = partes[2] || 0;

  return horas * 3600 + minutos * 60 + segundos;
};

const formatearHoras = (segundos) => {
  const horas = segundos / 3600;

  return `${horas.toFixed(2).replace(".", ",")} h`;
};

const formatearDia = (dia) => {
  if (!dia) return "Sin día";

  return dia.charAt(0) + dia.slice(1).toLowerCase();
};

function Reportes() {
  const [horarios, setHorarios] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [
          dataHorarios,
          dataDocentes,
          dataAulas,
          dataPeriodos,
        ] = await Promise.all([
          obtenerHorarios(),
          obtenerDocentes(),
          obtenerAulas(),
          obtenerPeriodos(),
        ]);

        setHorarios(dataHorarios.horarios ?? []);
        setDocentes(dataDocentes.docentes ?? []);
        setAulas(dataAulas.aulas ?? []);
        setPeriodos(dataPeriodos.periodos ?? []);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar los datos de reportes.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const descargarExcel = async () => {
    try {
      setExportando(true);
      setError("");

      const blob = await exportarReportes();

      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "reporte_sgpa.xlsx";
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      window.URL.revokeObjectURL(url);
    } catch (solicitudError) {
      setError(
        solicitudError.response?.data?.mensaje ||
          "No fue posible exportar los reportes.",
      );
    } finally {
      setExportando(false);
    }
  };

  const resumen = useMemo(() => {
    const sinAula = horarios.filter(
      (horario) => horario.id_aula === null || horario.id_aula === undefined,
    ).length;

    return {
      totalHorarios: horarios.length,
      sinAula,
      conAula: horarios.length - sinAula,
      docentesConHorario: new Set(
        horarios.map((horario) => horario.id_docente),
      ).size,
    };
  }, [horarios]);

  const horasPorDocente = useMemo(() => {
    const mapa = new Map();

    docentes.forEach((docente) => {
      const nombre = `${docente.nombres} ${docente.apellidos}`.trim();

      if (nombre && !mapa.has(docente.id_docente)) {
        mapa.set(docente.id_docente, {
          id: docente.id_docente,
          nombre,
          segundos: 0,
          cantidad: 0,
        });
      }
    });

    horarios.forEach((horario) => {
      const id = horario.id_docente;
      const nombre = horario.nombre_docente || "Sin docente";
      const segundos = aSegundos(horario.hora_fin) - aSegundos(horario.hora_inicio);

      if (!mapa.has(id)) {
        mapa.set(id, { nombre, segundos, cantidad: 0 });
      }

      const registro = mapa.get(id);
      registro.segundos += Math.max(segundos, 0);
      registro.cantidad += 1;
    });

    return Array.from(mapa.values())
      .map((registro) => ({
        ...registro,
        horas: registro.segundos / 3600,
      }))
      .sort((a, b) => b.horas - a.horas);
  }, [docentes, horarios]);

  const horariosPorPeriodo = useMemo(() => {
    const mapa = new Map();

    horarios.forEach((horario) => {
      const nombre = horario.nombre_periodo || "Sin período";

      if (!mapa.has(nombre)) {
        mapa.set(nombre, { cantidad: 0, sinAula: 0 });
      }

      const registro = mapa.get(nombre);
      registro.cantidad += 1;

      if (horario.id_aula === null || horario.id_aula === undefined) {
        registro.sinAula += 1;
      }
    });

    return Array.from(mapa.entries())
      .map(([periodo, datos]) => ({ periodo, ...datos }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [horarios]);

  const horariosPorAula = useMemo(() => {
    const mapa = new Map();

    horarios.forEach((horario) => {
      if (horario.id_aula === null || horario.id_aula === undefined) return;

      const codigo = horario.codigo_aula || "Sin código";

      if (!mapa.has(codigo)) {
        mapa.set(codigo, { cantidad: 0 });
      }

      mapa.get(codigo).cantidad += 1;
    });

    return Array.from(mapa.entries())
      .map(([aula, datos]) => ({ aula, ...datos }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [horarios]);

  const horariosPorDia = useMemo(() => {
    const orden = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

    const mapa = new Map();

    horarios.forEach((horario) => {
      const dia = horario.dia_semana || "SIN DIA";

      if (!mapa.has(dia)) {
        mapa.set(dia, { cantidad: 0 });
      }

      mapa.get(dia).cantidad += 1;
    });

    return Array.from(mapa.entries())
      .map(([dia, datos]) => ({ dia, ...datos }))
      .sort((a, b) => orden.indexOf(a.dia) - orden.indexOf(b.dia));
  }, [horarios]);

  const maxSegundosDocente = Math.max(
    0,
    ...horasPorDocente.map((docente) => docente.segundos),
  );

  return (
    <MainLayout>
      <Stack
        spacing={0.5}
        mb={3.5}
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Reportes
          </Typography>

          <Typography color="text.secondary">
            Resumen estadístico de la programación académica.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={descargarExcel}
          disabled={exportando}
        >
          {exportando ? "Exportando..." : "Exportar a Excel"}
        </Button>
      </Stack>

      {cargando && (
        <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!cargando && !error && (
        <Stack spacing={3}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2.5,
            }}
          >
            {tarjetas.map(({ clave, etiqueta, icono: Icono, color, fondo }) => (
              <Card
                key={clave}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider" }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        {etiqueta}
                      </Typography>
                      <Typography variant="h4" mt={1}>
                        {resumen[clave]}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 3,
                        color,
                        bgcolor: fondo,
                      }}
                    >
                      <Icono />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 3,
            }}
          >
            <Card variant="outlined">
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Horas programadas por docente
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 440 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Docente</TableCell>
                      <TableCell align="center">Horarios</TableCell>
                      <TableCell align="center">Total horas</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {horasPorDocente.map((docente) => (
                      <TableRow key={docente.id ?? docente.nombre} hover>
                        <TableCell>{docente.nombre}</TableCell>
                        <TableCell align="center">{docente.cantidad}</TableCell>
                        <TableCell align="center" sx={{ minWidth: 110 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 1.25,
                            }}
                          >
                            <Typography variant="body2">
                              {formatearHoras(docente.segundos)}
                            </Typography>

                            <Box
                              sx={{
                                width: 90,
                                height: 8,
                                borderRadius: 1,
                                bgcolor: "action.hover",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${
                                    maxSegundosDocente > 0
                                      ? (docente.segundos /
                                          maxSegundosDocente) *
                                        100
                                      : 0
                                  }%`,
                                  height: "100%",
                                  borderRadius: 1,
                                  bgcolor: "primary.light",
                                  transition: "width 300ms ease",
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}

                    {horasPorDocente.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No hay datos para mostrar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card variant="outlined">
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Horarios por período
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Período</TableCell>
                      <TableCell align="center">Horarios</TableCell>
                      <TableCell align="center">Sin aula</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {horariosPorPeriodo.map((periodo) => (
                      <TableRow key={periodo.periodo} hover>
                        <TableCell>{periodo.periodo}</TableCell>
                        <TableCell align="center">{periodo.cantidad}</TableCell>
                        <TableCell align="center">
                          {periodo.sinAula > 0 ? (
                            <Chip
                              label={periodo.sinAula}
                              color="warning"
                              size="small"
                            />
                          ) : (
                            periodo.sinAula
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {horariosPorPeriodo.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No hay datos para mostrar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card variant="outlined">
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Horarios por día de la semana
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Día</TableCell>
                      <TableCell align="center">Horarios</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {horariosPorDia.map((dia) => (
                      <TableRow key={dia.dia} hover>
                        <TableCell>{formatearDia(dia.dia)}</TableCell>
                        <TableCell align="center">{dia.cantidad}</TableCell>
                      </TableRow>
                    ))}

                    {horariosPorDia.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No hay datos para mostrar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card variant="outlined">
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Uso de aulas
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Aula</TableCell>
                      <TableCell align="center">Horarios asignados</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {horariosPorAula.map((aula) => (
                      <TableRow key={aula.aula} hover>
                        <TableCell>{aula.aula}</TableCell>
                        <TableCell align="center">{aula.cantidad}</TableCell>
                      </TableRow>
                    ))}

                    {horariosPorAula.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          Ningún horario tiene aula asignada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Aulas registradas: {aulas.length}. Períodos registrados:{" "}
                  {periodos.length}. Docentes registrados: {docentes.length}.
                </Typography>
              </Box>
            </Card>
          </Box>
        </Stack>
      )}
    </MainLayout>
  );
}

export default Reportes;
