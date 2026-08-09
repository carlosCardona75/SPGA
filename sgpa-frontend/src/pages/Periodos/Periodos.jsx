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
  actualizarPeriodo,
  crearPeriodo,
  eliminarPeriodo,
  obtenerPeriodos,
} from "../../services/periodoService";
import { esAdmin } from "../../utils/rol";

const formularioInicial = {
  nombre_periodo: "",
  fecha_inicio: "",
  fecha_final: "",
  estado: 1,
};

function Periodos() {
  const [periodos, setPeriodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [periodoAEliminar, setPeriodoAEliminar] = useState(null);
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  const admin = esAdmin();

  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const data = await obtenerPeriodos();
        setPeriodos(data.periodos ?? []);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar los períodos académicos.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarPeriodos();
  }, []);

  const abrirFormularioNuevo = () => {
    setPeriodoSeleccionado(null);
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setFormularioAbierto(false);
    setPeriodoSeleccionado(null);
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

  const abrirFormularioEdicion = (periodo) => {
    setPeriodoSeleccionado(periodo);

    setFormulario({
      nombre_periodo: periodo.nombre_periodo ?? "",
      fecha_inicio: periodo.fecha_inicio ?? "",
      fecha_final: periodo.fecha_final ?? "",
      estado: Number(periodo.estado),
    });

    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    const partes = String(fecha).split("-");

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return fecha;
  };

  const construirDatosPeriodo = () => {
    const nombre = String(formulario.nombre_periodo ?? "").trim();
    const fechaInicio = String(formulario.fecha_inicio ?? "").trim();
    const fechaFinal = String(formulario.fecha_final ?? "").trim();
    const estado = Number(formulario.estado);

    if (!nombre) {
      return {
        error: "El nombre del período es obligatorio.",
      };
    }

    if (nombre.length > 30) {
      return {
        error: "El nombre del período no puede superar 30 caracteres.",
      };
    }

    if (!fechaInicio || !fechaFinal) {
      return {
        error: "Las fechas de inicio y final son obligatorias.",
      };
    }

    if (fechaInicio >= fechaFinal) {
      return {
        error: "La fecha final debe ser posterior a la fecha de inicio.",
      };
    }

    if (![0, 1].includes(estado)) {
      return {
        error: "El estado debe ser Activo o Inactivo.",
      };
    }

    return {
      datos: {
        nombre_periodo: nombre,
        fecha_inicio: fechaInicio,
        fecha_final: fechaFinal,
        estado,
      },
    };
  };

  const guardarPeriodo = async () => {
    const { datos: datosPeriodo, error: errorValidacion } =
      construirDatosPeriodo();

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensajeExito("");

      if (periodoSeleccionado) {
        await actualizarPeriodo(periodoSeleccionado.id_periodo, datosPeriodo);
      } else {
        await crearPeriodo(datosPeriodo);
        setPagina(0);
      }

      const dataActualizada = await obtenerPeriodos();
      setPeriodos(dataActualizada.periodos ?? []);

      setMensajeExito(
        periodoSeleccionado
          ? "Período actualizado correctamente."
          : "Período creado correctamente.",
      );

      setFormularioAbierto(false);
      setPeriodoSeleccionado(null);
      setFormulario(formularioInicial);
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          `No fue posible ${
            periodoSeleccionado ? "actualizar" : "crear"
          } el período.`,
      );
    } finally {
      setGuardando(false);
    }
  };

  const textoBusqueda = busqueda.trim().toLowerCase();

  const periodosVisibles = periodos.filter((periodo) =>
    [
      periodo.nombre_periodo,
      periodo.fecha_inicio,
      periodo.fecha_final,
    ].some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda),
    ),
  );

  const periodosPaginados = periodosVisibles.slice(
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

  const abrirConfirmacionEliminar = (periodo) => {
    setPeriodoAEliminar(periodo);
    setErrorEliminar("");
    setDialogoEliminarAbierto(true);
  };

  const cerrarConfirmacionEliminar = () => {
    setDialogoEliminarAbierto(false);
    setPeriodoAEliminar(null);
    setErrorEliminar("");
  };

  const confirmarEliminacion = async () => {
    if (!periodoAEliminar) return;

    try {
      setGuardando(true);
      setErrorEliminar("");

      const respuesta = await eliminarPeriodo(periodoAEliminar.id_periodo);

      setPeriodos((periodosActuales) =>
        periodosActuales.filter(
          (periodo) => periodo.id_periodo !== periodoAEliminar.id_periodo,
        ),
      );

      setMensajeExito(
        respuesta.mensaje ?? "Período eliminado correctamente",
      );

      cerrarConfirmacionEliminar();
    } catch (solicitudError) {
      setErrorEliminar(
        solicitudError.response?.data?.mensaje ||
          "No fue posible eliminar el período.",
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
            Períodos académicos
          </Typography>

          <Typography>
            Consulta y administración de los períodos académicos del SGPA.
          </Typography>
        </Box>

        {admin && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={abrirFormularioNuevo}
          >
            Nuevo período
          </Button>
        )}
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
                Listado de períodos
              </Typography>

              <Typography variant="body2">
                {periodosVisibles.length} registro(s) encontrado(s)
              </Typography>
            </Box>

            <TextField
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Buscar por nombre o fecha"
              size="small"
              sx={{ width: { xs: "100%", md: 360 } }}
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
                  <TableCell>Nombre del período</TableCell>
                  <TableCell>Fecha de inicio</TableCell>
                  <TableCell>Fecha final</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {periodosPaginados.map((periodo) => (
                  <TableRow key={periodo.id_periodo} hover>
                    <TableCell>
                      {periodo.nombre_periodo || "Sin nombre"}
                    </TableCell>

                    <TableCell>{formatearFecha(periodo.fecha_inicio)}</TableCell>

                    <TableCell>{formatearFecha(periodo.fecha_final)}</TableCell>

                    <TableCell align="center">
                      <Chip
                        label={Number(periodo.estado) === 1 ? "Activo" : "Inactivo"}
                        color={Number(periodo.estado) === 1 ? "success" : "default"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      {admin && (
                        <IconButton
                          color="primary"
                          aria-label={`Editar período ${periodo.nombre_periodo}`}
                          onClick={() => abrirFormularioEdicion(periodo)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      )}

                      {admin && (
                        <IconButton
                          color="error"
                          aria-label={`Eliminar período ${periodo.nombre_periodo}`}
                          onClick={() => abrirConfirmacionEliminar(periodo)}
                        >
                          <DeleteOutlinedIcon />
                        </IconButton>
                      )}

                      {!admin && (
                        <Typography variant="body2" color="text.secondary">
                          Solo lectura
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {periodosPaginados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No se encontraron períodos académicos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={periodosVisibles.length}
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
            {periodoSeleccionado
              ? "Editar período académico"
              : "Nuevo período académico"}
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
              <TextField
                label="Nombre del período"
                name="nombre_periodo"
                value={formulario.nombre_periodo}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
                sx={{
                  gridColumn: {
                    sm: "1 / -1",
                  },
                }}
              />

              <TextField
                label="Fecha de inicio"
                name="fecha_inicio"
                type="date"
                value={formulario.fecha_inicio}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Fecha final"
                name="fecha_final"
                type="date"
                value={formulario.fecha_final}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <FormControl required fullWidth>
                <InputLabel id="estado-periodo-label">Estado</InputLabel>

                <Select
                  labelId="estado-periodo-label"
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
          </DialogContent>

          <DialogActions>
            <Button onClick={cerrarFormulario} disabled={guardando}>
              Cancelar
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={guardarPeriodo}
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : periodoSeleccionado
                  ? "Guardar cambios"
                  : "Crear período"}
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
          <DialogTitle>Eliminar período académico</DialogTitle>

          <DialogContent>
            {errorEliminar && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorEliminar}
              </Alert>
            )}

            <Typography>
              ¿Está seguro de eliminar el período{" "}
              <strong>{periodoAEliminar?.nombre_periodo}</strong>?
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

export default Periodos;
