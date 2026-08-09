import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

import MainLayout from "../../layouts/MainLayout";
import {
  actualizarHorario,
  crearHorario,
  eliminarHorario,
  exportarHorarios,
  exportarMiHorario,
  obtenerHorarios,
  obtenerMiHorario,
} from "../../services/horarioService";
import { obtenerAsignaciones } from "../../services/asignacionService";
import { obtenerAulas } from "../../services/aulaService";
import { obtenerDocentes } from "../../services/docenteService";
import { obtenerGrupos } from "../../services/grupoService";
import { obtenerPeriodos } from "../../services/periodoService";
import { esAdmin } from "../../utils/rol";

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

const formularioInicial = {
  id_asignacion: "",
  id_aula: "",
  dia_semana: "",
  hora_inicio: "",
  hora_fin: "",
  estado: 1,
};

const filtrosIniciales = {
  id_docente: "",
  id_grupo: "",
  id_periodo: "",
  id_aula: "",
  dia_semana: "",
  aula_pendiente: "",
};

const formatearHora = (hora) => {
  if (!hora) return "Sin hora";

  const partes = String(hora).split(":");

  return partes.length >= 2 ? `${partes[0]}:${partes[1]}` : hora;
};

const aSegundos = (hora) => {
  if (!hora) return 0;

  const partes = String(hora).split(":").map(Number);
  const horas = partes[0] || 0;
  const minutos = partes[1] || 0;
  const segundos = partes[2] || 0;

  return horas * 3600 + minutos * 60 + segundos;
};

const seCruzan = (inicioA, finA, inicioB, finB) =>
  aSegundos(inicioA) < aSegundos(finB) &&
  aSegundos(finA) > aSegundos(inicioB);

function Horarios() {
  const admin = esAdmin();

  const [horarios, setHorarios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [horarioAEliminar, setHorarioAEliminar] = useState(null);
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [exportando, setExportando] = useState(false);

  const cargarHorarios = async (filtrosAplicados) => {
    const parametros = {};

    if (filtrosAplicados.id_docente) {
      parametros.id_docente = filtrosAplicados.id_docente;
    }

    if (filtrosAplicados.id_grupo) {
      parametros.id_grupo = filtrosAplicados.id_grupo;
    }

    if (filtrosAplicados.id_periodo) {
      parametros.id_periodo = filtrosAplicados.id_periodo;
    }

    if (filtrosAplicados.id_aula) {
      parametros.id_aula = filtrosAplicados.id_aula;
    }

    if (filtrosAplicados.dia_semana) {
      parametros.dia_semana = filtrosAplicados.dia_semana;
    }

    if (filtrosAplicados.aula_pendiente !== "") {
      parametros.aula_pendiente = filtrosAplicados.aula_pendiente;
    }

    const data = await obtenerHorarios(parametros);
    return data.horarios ?? [];
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        if (admin) {
          const [
            dataHorarios,
            dataAsignaciones,
            dataAulas,
            dataDocentes,
            dataGrupos,
            dataPeriodos,
          ] = await Promise.all([
            obtenerHorarios(),
            obtenerAsignaciones(),
            obtenerAulas(),
            obtenerDocentes(),
            obtenerGrupos(),
            obtenerPeriodos(),
          ]);

          setHorarios(dataHorarios.horarios ?? []);
          setAsignaciones(dataAsignaciones.asignaciones ?? []);
          setAulas(dataAulas.aulas ?? []);
          setDocentes(dataDocentes.docentes ?? []);
          setGrupos(dataGrupos.grupos ?? []);
          setPeriodos(dataPeriodos.periodos ?? []);
        } else {
          const dataMiHorario = await obtenerMiHorario();
          setHorarios(dataMiHorario.horarios ?? []);
        }
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar los horarios.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [admin]);

  const abrirFormularioNuevo = () => {
    setHorarioSeleccionado(null);
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setFormularioAbierto(false);
    setHorarioSeleccionado(null);
    setFormulario(formularioInicial);
    setErrorFormulario("");
  };

  const cambiarCampoFormulario = (event) => {
    const { name, value } = event.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: value,
    }));
  };

  const abrirFormularioEdicion = (horario) => {
    setHorarioSeleccionado(horario);

    setFormulario({
      id_asignacion: horario.id_asignacion ?? "",
      id_aula: horario.id_aula ?? "",
      dia_semana: horario.dia_semana ?? "",
      hora_inicio: formatearHora(horario.hora_inicio),
      hora_fin: formatearHora(horario.hora_fin),
      estado: Number(horario.estado),
    });

    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const construirDatosHorario = () => {
    const idAsignacion = Number(formulario.id_asignacion);
    const dia = String(formulario.dia_semana ?? "").trim().toUpperCase();
    const horaInicio = String(formulario.hora_inicio ?? "").trim();
    const horaFin = String(formulario.hora_fin ?? "").trim();
    const estado = Number(formulario.estado);
    const idAulaTexto = String(formulario.id_aula ?? "").trim();

    if (!formulario.id_asignacion) {
      return {
        error: "Debe seleccionar una asignación.",
      };
    }

    if (!Number.isInteger(idAsignacion) || idAsignacion <= 0) {
      return {
        error: "La asignación seleccionada no es válida.",
      };
    }

    if (!DIAS.includes(dia)) {
      return {
        error: "Debe seleccionar un día de la semana válido.",
      };
    }

    if (!horaInicio || !horaFin) {
      return {
        error: "Las horas de inicio y final son obligatorias.",
      };
    }

    if (horaInicio >= horaFin) {
      return {
        error: "La hora de inicio debe ser menor que la hora final.",
      };
    }

    if (![0, 1].includes(estado)) {
      return {
        error: "El estado debe ser Activo o Inactivo.",
      };
    }

    const asignacion = asignaciones.find(
      (asignacionActual) => asignacionActual.id_asignacion === idAsignacion,
    );

    if (!asignacion) {
      return {
        error: "La asignación seleccionada no es válida.",
      };
    }

    const docente = docentes.find(
      (docenteActual) => docenteActual.id_docente === asignacion.id_docente,
    );

    const maxHoras = Number(docente?.max_horas ?? 40);

    const duracionNueva =
      (aSegundos(horaFin) - aSegundos(horaInicio)) / 3600;

    const horasActuales = horarios
      .filter(
        (horario) =>
          horario.id_docente === asignacion.id_docente &&
          horario.id_periodo === asignacion.id_periodo &&
          Number(horario.estado) === 1 &&
          horario.id_detalle !== horarioSeleccionado?.id_detalle,
      )
      .reduce(
        (total, horario) =>
          total +
          (aSegundos(horario.hora_fin) - aSegundos(horario.hora_inicio)) /
            3600,
        0,
      );

    if (horasActuales + duracionNueva > maxHoras) {
      return {
        error: `El docente superaría el máximo permitido de ${maxHoras} horas semanales.`,
      };
    }

    const idDetalleActual = horarioSeleccionado?.id_detalle;

    const duplicado = horarios.some(
      (horario) =>
        horario.id_detalle !== idDetalleActual &&
        horario.id_asignacion === idAsignacion &&
        horario.dia_semana === dia &&
        formatearHora(horario.hora_inicio) === formatearHora(horaInicio) &&
        formatearHora(horario.hora_fin) === formatearHora(horaFin),
    );

    if (duplicado) {
      return {
        error:
          "Ya existe un horario con la misma asignación, día y horas.",
      };
    }

    const cruceDocente = horarios.some(
      (horario) =>
        horario.id_detalle !== idDetalleActual &&
        horario.id_docente === asignacion.id_docente &&
        horario.id_periodo === asignacion.id_periodo &&
        horario.dia_semana === dia &&
        Number(horario.estado) === 1 &&
        seCruzan(horaInicio, horaFin, horario.hora_inicio, horario.hora_fin),
    );

    if (cruceDocente) {
      return {
        error:
          "El docente ya tiene un horario que se cruza con el rango indicado.",
      };
    }

    const cruceGrupo = horarios.some(
      (horario) =>
        horario.id_detalle !== idDetalleActual &&
        horario.id_grupo === asignacion.id_grupo &&
        horario.id_periodo === asignacion.id_periodo &&
        horario.dia_semana === dia &&
        Number(horario.estado) === 1 &&
        seCruzan(horaInicio, horaFin, horario.hora_inicio, horario.hora_fin),
    );

    if (cruceGrupo) {
      return {
        error:
          "El grupo ya tiene un horario que se cruza con el rango indicado.",
      };
    }

    const idAula =
      idAulaTexto === "" ? null : Number(idAulaTexto);

    if (idAula !== null && (!Number.isInteger(idAula) || idAula <= 0)) {
      return {
        error: "El aula seleccionada no es válida.",
      };
    }

    if (idAula !== null) {
      const cruceAula = horarios.some(
        (horario) =>
          horario.id_detalle !== idDetalleActual &&
          horario.id_aula === idAula &&
          horario.id_periodo === asignacion.id_periodo &&
          horario.dia_semana === dia &&
          Number(horario.estado) === 1 &&
          seCruzan(horaInicio, horaFin, horario.hora_inicio, horario.hora_fin),
      );

      if (cruceAula) {
        return {
          error:
            "El aula ya está ocupada en el rango de horario indicado.",
        };
      }
    }

    return {
      datos: {
        id_asignacion: idAsignacion,
        id_aula: idAula,
        dia_semana: dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado,
      },
    };
  };

  const guardarHorario = async () => {
    const { datos: datosHorario, error: errorValidacion } =
      construirDatosHorario();

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensajeExito("");

      if (horarioSeleccionado) {
        await actualizarHorario(horarioSeleccionado.id_detalle, datosHorario);
      } else {
        await crearHorario(datosHorario);
        setPagina(0);
      }

      const dataActualizada = await cargarHorarios(filtros);
      setHorarios(dataActualizada);

      setMensajeExito(
        horarioSeleccionado
          ? "Horario actualizado correctamente."
          : "Horario creado correctamente.",
      );

      setFormularioAbierto(false);
      setHorarioSeleccionado(null);
      setFormulario(formularioInicial);
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          `No fue posible ${
            horarioSeleccionado ? "actualizar" : "crear"
          } el horario.`,
      );
    } finally {
      setGuardando(false);
    }
  };

  const aplicarFiltros = async () => {
    try {
      setCargando(true);
      setError("");
      setPagina(0);

      const data = await cargarHorarios(filtros);
      setHorarios(data);
    } catch (solicitudError) {
      setError(
        solicitudError.response?.data?.mensaje ||
          "No fue posible aplicar los filtros.",
      );
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = async () => {
    setFiltros(filtrosIniciales);
    setPagina(0);

    try {
      setCargando(true);
      setError("");

      const data = await obtenerHorarios();
      setHorarios(data.horarios ?? []);
    } catch (solicitudError) {
      setError(
        solicitudError.response?.data?.mensaje ||
          "No fue posible cargar los horarios.",
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiarFiltro = (event) => {
    const { name, value } = event.target;

    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [name]: value,
    }));
  };

  const descargarExcel = async () => {
    try {
      setExportando(true);
      setError("");

      let blob;

      if (admin) {
        const parametros = {};

        if (filtros.id_docente) parametros.id_docente = filtros.id_docente;
        if (filtros.id_grupo) parametros.id_grupo = filtros.id_grupo;
        if (filtros.id_periodo) parametros.id_periodo = filtros.id_periodo;

        blob = await exportarHorarios(parametros);
      } else {
        blob = await exportarMiHorario();
      }

      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = admin ? "horarios_sgpa.xlsx" : "mi_horario.xlsx";
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      window.URL.revokeObjectURL(url);

      setMensajeExito("El archivo Excel se descargó correctamente.");
    } catch (solicitudError) {
      setError(
        solicitudError.response?.data?.mensaje ||
          "No fue posible exportar los horarios.",
      );
    } finally {
      setExportando(false);
    }
  };

  const abrirConfirmacionEliminar = (horario) => {
    setHorarioAEliminar(horario);
    setErrorEliminar("");
    setDialogoEliminarAbierto(true);
  };

  const cerrarConfirmacionEliminar = () => {
    setDialogoEliminarAbierto(false);
    setHorarioAEliminar(null);
    setErrorEliminar("");
  };

  const confirmarEliminacion = async () => {
    if (!horarioAEliminar) return;

    try {
      setGuardando(true);
      setErrorEliminar("");

      const respuesta = await eliminarHorario(horarioAEliminar.id_detalle);

      setHorarios((horariosActuales) =>
        horariosActuales.filter(
          (horario) => horario.id_detalle !== horarioAEliminar.id_detalle,
        ),
      );

      setMensajeExito(respuesta.mensaje ?? "Horario eliminado correctamente");

      cerrarConfirmacionEliminar();
    } catch (solicitudError) {
      setErrorEliminar(
        solicitudError.response?.data?.mensaje ||
          "No fue posible eliminar el horario.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const horariosVisibles = useMemo(
    () =>
      horarios.filter((horario) => {
        const sinAula = horario.id_aula === null || horario.id_aula === undefined;

        if (filtros.aula_pendiente !== "") {
          if (filtros.aula_pendiente === "true" && !sinAula) return false;
          if (filtros.aula_pendiente === "false" && sinAula) return false;
        }

        return true;
      }),
    [horarios, filtros.aula_pendiente],
  );

  const horariosPaginados = horariosVisibles.slice(
    pagina * filasPorPagina,
    pagina * filasPorPagina + filasPorPagina,
  );

  const cambiarPagina = (event, nuevaPagina) => {
    setPagina(nuevaPagina);
  };

  const cambiarFilasPorPagina = (event) => {
    setFilasPorPagina(Number(event.target.value));
    setPagina(0);
  };

  return (
    <MainLayout>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            {admin ? "Horarios" : "Mi horario"}
          </Typography>

          <Typography>
            {admin
              ? "Programación, consulta y exportación de los horarios académicos."
              : "Consulta de los horarios asignados al docente autenticado."}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {admin && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={abrirFormularioNuevo}
            >
              Nuevo horario
            </Button>
          )}

          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={descargarExcel}
            disabled={exportando}
          >
            {exportando ? "Exportando..." : "Exportar a Excel"}
          </Button>
        </Box>
      </Box>

      {mensajeExito && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {mensajeExito}
        </Alert>
      )}

      {admin && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FilterAltOutlinedIcon color="action" />
            <Typography variant="h6" fontWeight={700}>
              Filtros de consulta
            </Typography>
          </Box>

          <Box sx={{ px: 2.5, pb: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filtro-docente-label">Docente</InputLabel>

                  <Select
                    labelId="filtro-docente-label"
                    name="id_docente"
                    value={filtros.id_docente}
                    label="Docente"
                    onChange={cambiarFiltro}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {docentes.map((docente) => (
                      <MenuItem key={docente.id_docente} value={docente.id_docente}>
                        {docente.nombres} {docente.apellidos}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filtro-grupo-label">Grupo</InputLabel>

                  <Select
                    labelId="filtro-grupo-label"
                    name="id_grupo"
                    value={filtros.id_grupo}
                    label="Grupo"
                    onChange={cambiarFiltro}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {grupos.map((grupo) => (
                      <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                        {grupo.cod_grupo} - {grupo.nombre_materia}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filtro-periodo-label">Período</InputLabel>

                  <Select
                    labelId="filtro-periodo-label"
                    name="id_periodo"
                    value={filtros.id_periodo}
                    label="Período"
                    onChange={cambiarFiltro}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {periodos.map((periodo) => (
                      <MenuItem key={periodo.id_periodo} value={periodo.id_periodo}>
                        {periodo.nombre_periodo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filtro-aula-label">Aula</InputLabel>

                  <Select
                    labelId="filtro-aula-label"
                    name="id_aula"
                    value={filtros.id_aula}
                    label="Aula"
                    onChange={cambiarFiltro}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {aulas.map((aula) => (
                      <MenuItem key={aula.id_aula} value={aula.id_aula}>
                        {aula.codigo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filtro-dia-label">Día</InputLabel>

                  <Select
                    labelId="filtro-dia-label"
                    name="dia_semana"
                    value={filtros.dia_semana}
                    label="Día"
                    onChange={cambiarFiltro}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {DIAS.map((dia) => (
                      <MenuItem key={dia} value={dia}>
                        {dia}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filtro-pendiente-label">Aula pendiente</InputLabel>

                  <Select
                    labelId="filtro-pendiente-label"
                    name="aula_pendiente"
                    value={filtros.aula_pendiente}
                    label="Aula pendiente"
                    onChange={cambiarFiltro}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="true">Sin aula asignada</MenuItem>
                    <MenuItem value="false">Con aula asignada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1.5,
              }}
            >
              <Button variant="outlined" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>

              <Button variant="contained" onClick={aplicarFiltros}>
                Aplicar filtros
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {cargando && <CircularProgress />}

      {!cargando && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!cargando && !error && (
        <Card variant="outlined">
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Listado de horarios
            </Typography>

            <Typography variant="body2">
              {horariosVisibles.length} registro(s) encontrado(s)
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Docente</TableCell>
                  <TableCell>Materia</TableCell>
                  <TableCell>Grupo</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell>Día</TableCell>
                  <TableCell align="center">Hora</TableCell>
                  <TableCell>Aula</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  {admin && (
                    <TableCell align="center">Acciones</TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {horariosPaginados.map((horario) => (
                  <TableRow key={horario.id_detalle} hover>
                    <TableCell>
                      {horario.nombre_docente || "Sin docente"}
                    </TableCell>

                    <TableCell>
                      {horario.nombre_materia || "Sin materia"}
                    </TableCell>

                    <TableCell>{horario.cod_grupo || "Sin grupo"}</TableCell>

                    <TableCell>
                      {horario.nombre_periodo || "Sin período"}
                    </TableCell>

                    <TableCell>{horario.dia_semana || "Sin día"}</TableCell>

                    <TableCell align="center">
                      {formatearHora(horario.hora_inicio)} -{" "}
                      {formatearHora(horario.hora_fin)}
                    </TableCell>

                    <TableCell>
                      {horario.codigo_aula || (
                        <Chip label="Pendiente" color="warning" size="small" />
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={Number(horario.estado) === 1 ? "Activo" : "Inactivo"}
                        color={Number(horario.estado) === 1 ? "success" : "default"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    {admin && (
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          aria-label={`Editar horario de ${horario.nombre_docente}`}
                          onClick={() => abrirFormularioEdicion(horario)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>

                        <IconButton
                          color="error"
                          aria-label={`Eliminar horario de ${horario.nombre_docente}`}
                          onClick={() => abrirConfirmacionEliminar(horario)}
                        >
                          <DeleteOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

                {horariosPaginados.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={admin ? 9 : 8}
                      align="center"
                    >
                      No se encontraron horarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={horariosVisibles.length}
            page={pagina}
            onPageChange={cambiarPagina}
            rowsPerPage={filasPorPagina}
            onRowsPerPageChange={cambiarFilasPorPagina}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página"
          />
        </Card>
      )}

      {admin && (
        <Dialog
          open={formularioAbierto}
          onClose={guardando ? undefined : cerrarFormulario}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            {horarioSeleccionado ? "Editar horario" : "Nuevo horario"}
          </DialogTitle>

          <DialogContent>
            {errorFormulario && (
              <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                {errorFormulario}
              </Alert>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },
                gap: 2,
                pt: 1,
              }}
            >
              <FormControl required fullWidth sx={{ gridColumn: { sm: "1 / -1" } }}>
                <InputLabel id="asignacion-horario-label">Asignación</InputLabel>

                <Select
                  labelId="asignacion-horario-label"
                  name="id_asignacion"
                  value={formulario.id_asignacion}
                  label="Asignación"
                  onChange={cambiarCampoFormulario}
                >
                  {asignaciones.map((asignacion) => (
                    <MenuItem
                      key={asignacion.id_asignacion}
                      value={asignacion.id_asignacion}
                    >
                      {asignacion.nombre_docente} - {asignacion.nombre_materia} (
                      {asignacion.cod_grupo}) - {asignacion.nombre_periodo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl required fullWidth>
                <InputLabel id="dia-horario-label">Día</InputLabel>

                <Select
                  labelId="dia-horario-label"
                  name="dia_semana"
                  value={formulario.dia_semana}
                  label="Día"
                  onChange={cambiarCampoFormulario}
                >
                  {DIAS.map((dia) => (
                    <MenuItem key={dia} value={dia}>
                      {dia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="aula-horario-label">Aula (opcional)</InputLabel>

                <Select
                  labelId="aula-horario-label"
                  name="id_aula"
                  value={formulario.id_aula}
                  label="Aula (opcional)"
                  onChange={cambiarCampoFormulario}
                >
                  <MenuItem value="">Pendiente de asignar</MenuItem>
                  {aulas.map((aula) => (
                    <MenuItem key={aula.id_aula} value={aula.id_aula}>
                      {aula.codigo}
                      {aula.capacidad ? ` - ${aula.capacidad} personas` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Hora de inicio"
                name="hora_inicio"
                type="time"
                value={formulario.hora_inicio}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Hora final"
                name="hora_fin"
                type="time"
                value={formulario.hora_fin}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <FormControl required fullWidth>
                <InputLabel id="estado-horario-label">Estado</InputLabel>

                <Select
                  labelId="estado-horario-label"
                  name="estado"
                  value={formulario.estado}
                  label="Estado"
                  onChange={cambiarCampoFormulario}
                >
                  <MenuItem value={1}>Activo</MenuItem>
                  <MenuItem value={0}>Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 2 }}
            >
              El total de horas semanales de un docente no puede superar su
              máximo permitido (40 horas por defecto).
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={cerrarFormulario} disabled={guardando}>
              Cancelar
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={guardarHorario}
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : horarioSeleccionado
                  ? "Guardar cambios"
                  : "Crear horario"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {admin && (
        <Dialog
          open={dialogoEliminarAbierto}
          onClose={guardando ? undefined : cerrarConfirmacionEliminar}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Eliminar horario</DialogTitle>

          <DialogContent>
            {errorEliminar && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorEliminar}
              </Alert>
            )}

            <Typography>
              ¿Está seguro de eliminar el horario de{" "}
              <strong>{horarioAEliminar?.nombre_docente}</strong> el día{" "}
              <strong>{horarioAEliminar?.dia_semana}</strong> de{" "}
              <strong>{formatearHora(horarioAEliminar?.hora_inicio)}</strong>?
            </Typography>

            <Typography sx={{ mt: 1 }}>
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={cerrarConfirmacionEliminar} disabled={guardando}>
              Cancelar
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={confirmarEliminacion}
              disabled={guardando}
            >
              {guardando ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </MainLayout>
  );
}

export default Horarios;
