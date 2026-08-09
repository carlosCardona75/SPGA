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
  actualizarAula,
  crearAula,
  eliminarAula,
  obtenerAulas,
} from "../../services/aulaService";
import { esAdmin } from "../../utils/rol";

const formularioInicial = {
  codigo: "",
  capacidad: "",
  estado: 1,
};

function Aulas() {
  const [aulas, setAulas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [aulaAEliminar, setAulaAEliminar] = useState(null);
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  const admin = esAdmin();

  useEffect(() => {
    const cargarAulas = async () => {
      try {
        const data = await obtenerAulas();
        setAulas(data.aulas ?? []);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar las aulas.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarAulas();
  }, []);

  const abrirFormularioNuevo = () => {
    setAulaSeleccionada(null);
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setFormularioAbierto(false);
    setAulaSeleccionada(null);
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

  const abrirFormularioEdicion = (aula) => {
    setAulaSeleccionada(aula);

    setFormulario({
      codigo: aula.codigo ?? "",
      capacidad: aula.capacidad ?? "",
      estado: Number(aula.estado),
    });

    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const construirDatosAula = () => {
    const codigo = String(formulario.codigo ?? "").trim();
    const capacidadTexto = String(formulario.capacidad ?? "").trim();
    const estado = Number(formulario.estado);

    if (!codigo) {
      return {
        error: "El código del aula es obligatorio.",
      };
    }

    let capacidad = null;

    if (capacidadTexto !== "") {
      capacidad = Number(capacidadTexto);

      if (!Number.isInteger(capacidad) || capacidad <= 0) {
        return {
          error: "La capacidad debe ser un número entero mayor que cero.",
        };
      }
    }

    if (![0, 1].includes(estado)) {
      return {
        error: "El estado debe ser Activo o Inactivo.",
      };
    }

    return {
      datos: {
        codigo,
        capacidad,
        estado,
      },
    };
  };

  const guardarAula = async () => {
    const { datos: datosAula, error: errorValidacion } =
      construirDatosAula();

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensajeExito("");

      if (aulaSeleccionada) {
        await actualizarAula(aulaSeleccionada.id_aula, datosAula);
      } else {
        await crearAula(datosAula);
        setPagina(0);
      }

      const dataActualizada = await obtenerAulas();
      setAulas(dataActualizada.aulas ?? []);

      setMensajeExito(
        aulaSeleccionada
          ? "Aula actualizada correctamente."
          : "Aula creada correctamente.",
      );

      setFormularioAbierto(false);
      setAulaSeleccionada(null);
      setFormulario(formularioInicial);
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          `No fue posible ${
            aulaSeleccionada ? "actualizar" : "crear"
          } el aula.`,
      );
    } finally {
      setGuardando(false);
    }
  };

  const textoBusqueda = busqueda.trim().toLowerCase();

  const aulasVisibles = aulas.filter((aula) =>
    [
      aula.codigo,
      aula.capacidad,
    ].some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda),
    ),
  );

  const aulasPaginadas = aulasVisibles.slice(
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

  const abrirConfirmacionEliminar = (aula) => {
    setAulaAEliminar(aula);
    setErrorEliminar("");
    setDialogoEliminarAbierto(true);
  };

  const cerrarConfirmacionEliminar = () => {
    setDialogoEliminarAbierto(false);
    setAulaAEliminar(null);
    setErrorEliminar("");
  };

  const confirmarEliminacion = async () => {
    if (!aulaAEliminar) return;

    try {
      setGuardando(true);
      setErrorEliminar("");

      const respuesta = await eliminarAula(aulaAEliminar.id_aula);

      setAulas((aulasActuales) =>
        aulasActuales.filter((aula) => aula.id_aula !== aulaAEliminar.id_aula),
      );

      setMensajeExito(respuesta.mensaje ?? "Aula eliminada correctamente");

      cerrarConfirmacionEliminar();
    } catch (solicitudError) {
      setErrorEliminar(
        solicitudError.response?.data?.mensaje ||
          "No fue posible eliminar el aula.",
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
            Aulas
          </Typography>

          <Typography>
            Consulta y administración de las aulas registradas en el SGPA.
          </Typography>
        </Box>

        {admin && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={abrirFormularioNuevo}
          >
            Nueva aula
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
                Listado de aulas
              </Typography>

              <Typography variant="body2">
                {aulasVisibles.length} registro(s) encontrado(s)
              </Typography>
            </Box>

            <TextField
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Buscar por código o capacidad"
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
                  <TableCell>Código</TableCell>
                  <TableCell align="center">Capacidad</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {aulasPaginadas.map((aula) => (
                  <TableRow key={aula.id_aula} hover>
                    <TableCell>{aula.codigo || "Sin código"}</TableCell>

                    <TableCell align="center">
                      {aula.capacidad ? `${aula.capacidad} personas` : "Sin definir"}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={Number(aula.estado) === 1 ? "Activo" : "Inactivo"}
                        color={Number(aula.estado) === 1 ? "success" : "default"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      {admin && (
                        <IconButton
                          color="primary"
                          aria-label={`Editar aula ${aula.codigo}`}
                          onClick={() => abrirFormularioEdicion(aula)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      )}

                      {admin && (
                        <IconButton
                          color="error"
                          aria-label={`Eliminar aula ${aula.codigo}`}
                          onClick={() => abrirConfirmacionEliminar(aula)}
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

                {aulasPaginadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No se encontraron aulas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={aulasVisibles.length}
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
            {aulaSeleccionada ? "Editar aula" : "Nueva aula"}
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
                label="Código del aula"
                name="codigo"
                value={formulario.codigo}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
              />

              <TextField
                label="Capacidad"
                name="capacidad"
                type="number"
                value={formulario.capacidad}
                onChange={cambiarCampoFormulario}
                fullWidth
                inputProps={{ min: 1 }}
              />

              <FormControl required fullWidth>
                <InputLabel id="estado-aula-label">Estado</InputLabel>

                <Select
                  labelId="estado-aula-label"
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
              onClick={guardarAula}
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : aulaSeleccionada
                  ? "Guardar cambios"
                  : "Crear aula"}
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
          <DialogTitle>Eliminar aula</DialogTitle>

          <DialogContent>
            {errorEliminar && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorEliminar}
              </Alert>
            )}

            <Typography>
              ¿Está seguro de eliminar el aula{" "}
              <strong>{aulaAEliminar?.codigo}</strong>?
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

export default Aulas;
