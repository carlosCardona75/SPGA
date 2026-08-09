import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
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

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import MainLayout from "../../layouts/MainLayout";
import {
  actualizarAsignacion,
  crearAsignacion,
  eliminarAsignacion,
  obtenerAsignaciones,
} from "../../services/asignacionService";
import { obtenerDocentes } from "../../services/docenteService";
import { obtenerGrupos } from "../../services/grupoService";
import { obtenerPeriodos } from "../../services/periodoService";

const formularioInicial = {
  id_docente: "",
  id_grupo: "",
  id_periodo: "",
  estado: 1,
};

function Asignaciones() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [asignacionAEliminar, setAsignacionAEliminar] = useState(null);
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  useEffect(() => {
    const cargarAsignaciones = async () => {
      try {
        const [dataAsignaciones, dataDocentes, dataGrupos, dataPeriodos] =
          await Promise.all([
            obtenerAsignaciones(),
            obtenerDocentes(),
            obtenerGrupos(),
            obtenerPeriodos(),
          ]);

        setAsignaciones(dataAsignaciones.asignaciones ?? []);
        setDocentes(dataDocentes.docentes ?? []);
        setGrupos(dataGrupos.grupos ?? []);
        setPeriodos(dataPeriodos.periodos ?? []);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar las asignaciones.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarAsignaciones();
  }, []);

  const abrirFormularioNuevo = () => {
    setAsignacionSeleccionada(null);
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setFormularioAbierto(false);
    setAsignacionSeleccionada(null);
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

  const abrirFormularioEdicion = (asignacion) => {
    setAsignacionSeleccionada(asignacion);

    setFormulario({
      id_docente: asignacion.id_docente ?? "",
      id_grupo: asignacion.id_grupo ?? "",
      id_periodo: asignacion.id_periodo ?? "",
      estado: Number(asignacion.estado),
    });

    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const construirDatosAsignacion = () => {
    const idDocente = Number(formulario.id_docente);
    const idGrupo = Number(formulario.id_grupo);
    const idPeriodo = Number(formulario.id_periodo);
    const estado = Number(formulario.estado);

    if (!formulario.id_docente || !formulario.id_grupo || !formulario.id_periodo) {
      return {
        error:
          "Debe seleccionar un docente, un grupo y un período académico.",
      };
    }

    if (
      !Number.isInteger(idDocente) ||
      idDocente <= 0 ||
      !Number.isInteger(idGrupo) ||
      idGrupo <= 0 ||
      !Number.isInteger(idPeriodo) ||
      idPeriodo <= 0
    ) {
      return {
        error: "Debe seleccionar docente, grupo y período válidos.",
      };
    }

    if (![0, 1].includes(estado)) {
      return {
        error: "El estado debe ser Activo o Inactivo.",
      };
    }

    const duplicada = asignaciones.some(
      (asignacion) =>
        asignacion.id_asignacion !== asignacionSeleccionada?.id_asignacion &&
        asignacion.id_docente === idDocente &&
        asignacion.id_grupo === idGrupo &&
        asignacion.id_periodo === idPeriodo,
    );

    if (duplicada) {
      return {
        error:
          "El docente ya está asignado a ese grupo en el período indicado.",
      };
    }

    return {
      datos: {
        id_docente: idDocente,
        id_grupo: idGrupo,
        id_periodo: idPeriodo,
        estado,
      },
    };
  };

  const guardarAsignacion = async () => {
    const { datos: datosAsignacion, error: errorValidacion } =
      construirDatosAsignacion();

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensajeExito("");

      if (asignacionSeleccionada) {
        await actualizarAsignacion(
          asignacionSeleccionada.id_asignacion,
          datosAsignacion,
        );
      } else {
        await crearAsignacion(datosAsignacion);
        setPagina(0);
      }

      const dataActualizada = await obtenerAsignaciones();
      setAsignaciones(dataActualizada.asignaciones ?? []);

      setMensajeExito(
        asignacionSeleccionada
          ? "Asignación actualizada correctamente."
          : "Asignación creada correctamente.",
      );

      setFormularioAbierto(false);
      setAsignacionSeleccionada(null);
      setFormulario(formularioInicial);
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          `No fue posible ${
            asignacionSeleccionada ? "actualizar" : "crear"
          } la asignación.`,
      );
    } finally {
      setGuardando(false);
    }
  };

  const textoBusqueda = busqueda.trim().toLowerCase();

  const asignacionesVisibles = asignaciones.filter((asignacion) =>
    [
      asignacion.cedula,
      asignacion.nombre_docente,
      asignacion.cod_grupo,
      asignacion.descripcion_grupo,
      asignacion.codigo_materia,
      asignacion.nombre_materia,
      asignacion.nombre_periodo,
    ].some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda),
    ),
  );

  const asignacionesPaginadas = asignacionesVisibles.slice(
    pagina * filasPorPagina,
    pagina * filasPorPagina + filasPorPagina,
  );

  const cambiarBusqueda = (event) => {
    setBusqueda(event.target.value);
    setPagina(0);
  };

  const cambiarPagina = (event, nuevaPagina) => {
    setPagina(nuevaPagina);
  };

  const cambiarFilasPorPagina = (event) => {
    setFilasPorPagina(Number(event.target.value));
    setPagina(0);
  };

  const abrirConfirmacionEliminar = (asignacion) => {
    setAsignacionAEliminar(asignacion);
    setErrorEliminar("");
    setDialogoEliminarAbierto(true);
  };

  const cerrarConfirmacionEliminar = () => {
    setDialogoEliminarAbierto(false);
    setAsignacionAEliminar(null);
    setErrorEliminar("");
  };

  const confirmarEliminacion = async () => {
    if (!asignacionAEliminar) return;

    try {
      setGuardando(true);
      setErrorEliminar("");

      const respuesta = await eliminarAsignacion(
        asignacionAEliminar.id_asignacion,
      );

      setAsignaciones((asignacionesActuales) =>
        asignacionesActuales.filter(
          (asignacion) =>
            asignacion.id_asignacion !== asignacionAEliminar.id_asignacion,
        ),
      );

      setMensajeExito(
        respuesta.mensaje ?? "Asignación eliminada correctamente",
      );

      cerrarConfirmacionEliminar();
    } catch (solicitudError) {
      setErrorEliminar(
        solicitudError.response?.data?.mensaje ||
          "No fue posible eliminar la asignación.",
      );
    } finally {
      setGuardando(false);
    }
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
            Asignaciones
          </Typography>

          <Typography>
            Asignación de docentes a grupos académicos en un período.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={abrirFormularioNuevo}
        >
          Nueva asignación
        </Button>
      </Box>

      {mensajeExito && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {mensajeExito}
        </Alert>
      )}

      {cargando && <CircularProgress />}

      {!cargando && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!cargando && !error && (
        <Card variant="outlined">
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Listado de asignaciones
              </Typography>

              <Typography variant="body2">
                {asignacionesVisibles.length} registro(s) encontrado(s)
              </Typography>
            </Box>

            <TextField
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Buscar por docente, grupo, materia o período"
              size="small"
              sx={{ width: { xs: "100%", md: 420 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Docente</TableCell>
                  <TableCell>Cédula</TableCell>
                  <TableCell>Grupo</TableCell>
                  <TableCell>Materia</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {asignacionesPaginadas.map((asignacion) => (
                  <TableRow key={asignacion.id_asignacion} hover>
                    <TableCell>
                      {asignacion.nombre_docente || "Sin docente"}
                    </TableCell>

                    <TableCell>{asignacion.cedula || "Sin cédula"}</TableCell>

                    <TableCell>
                      {asignacion.cod_grupo || "Sin grupo"}
                    </TableCell>

                    <TableCell>
                      {asignacion.nombre_materia || "Sin materia"}
                    </TableCell>

                    <TableCell>
                      {asignacion.nombre_periodo || "Sin período"}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={
                          Number(asignacion.estado) === 1 ? "Activo" : "Inactivo"
                        }
                        color={
                          Number(asignacion.estado) === 1 ? "success" : "default"
                        }
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        aria-label={`Editar asignación de ${asignacion.nombre_docente}`}
                        onClick={() => abrirFormularioEdicion(asignacion)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>

                      <IconButton
                        color="error"
                        aria-label={`Eliminar asignación de ${asignacion.nombre_docente}`}
                        onClick={() => abrirConfirmacionEliminar(asignacion)}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {asignacionesPaginadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No se encontraron asignaciones.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={asignacionesVisibles.length}
            page={pagina}
            onPageChange={cambiarPagina}
            rowsPerPage={filasPorPagina}
            onRowsPerPageChange={cambiarFilasPorPagina}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página"
          />
        </Card>
      )}

      <Dialog
        open={formularioAbierto}
        onClose={guardando ? undefined : cerrarFormulario}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {asignacionSeleccionada
            ? "Editar asignación"
            : "Nueva asignación"}
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
            <FormControl required fullWidth>
              <InputLabel id="docente-asignacion-label">Docente</InputLabel>

              <Select
                labelId="docente-asignacion-label"
                name="id_docente"
                value={formulario.id_docente}
                label="Docente"
                onChange={cambiarCampoFormulario}
              >
                {docentes.map((docente) => (
                  <MenuItem key={docente.id_docente} value={docente.id_docente}>
                    {docente.nombres} {docente.apellidos} - {docente.cedula}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl required fullWidth>
              <InputLabel id="periodo-asignacion-label">
                Período académico
              </InputLabel>

              <Select
                labelId="periodo-asignacion-label"
                name="id_periodo"
                value={formulario.id_periodo}
                label="Período académico"
                onChange={cambiarCampoFormulario}
              >
                {periodos.map((periodo) => (
                  <MenuItem key={periodo.id_periodo} value={periodo.id_periodo}>
                    {periodo.nombre_periodo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl required fullWidth>
              <InputLabel id="grupo-asignacion-label">Grupo</InputLabel>

              <Select
                labelId="grupo-asignacion-label"
                name="id_grupo"
                value={formulario.id_grupo}
                label="Grupo"
                onChange={cambiarCampoFormulario}
              >
                {grupos.map((grupo) => (
                  <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                    {grupo.cod_grupo} - {grupo.nombre_materia}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

              <FormControl required fullWidth>
                <InputLabel id="estado-asignacion-label">Estado</InputLabel>

                <Select
                  labelId="estado-asignacion-label"
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
              No se permite asignar el mismo docente al mismo grupo en el
              mismo período académico.
            </Typography>
          </DialogContent>

        <DialogActions>
          <Button onClick={cerrarFormulario} disabled={guardando}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={guardarAsignacion}
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : asignacionSeleccionada
                ? "Guardar cambios"
                : "Crear asignación"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogoEliminarAbierto}
        onClose={guardando ? undefined : cerrarConfirmacionEliminar}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Eliminar asignación</DialogTitle>

        <DialogContent>
          {errorEliminar && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorEliminar}
            </Alert>
          )}

          <Typography>
            ¿Está seguro de eliminar la asignación de{" "}
            <strong>{asignacionAEliminar?.nombre_docente}</strong> al grupo{" "}
            <strong>{asignacionAEliminar?.cod_grupo}</strong>?
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
    </MainLayout>
  );
}

export default Asignaciones;
