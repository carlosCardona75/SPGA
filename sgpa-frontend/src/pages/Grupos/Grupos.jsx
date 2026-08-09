import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Card,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import MainLayout from "../../layouts/MainLayout";
import {
  actualizarGrupo,
  crearGrupo,
  eliminarGrupo,
  obtenerGrupos,
} from "../../services/grupoService";

import { obtenerMaterias } from "../../services/materiaService";

const formularioInicial = {
  cod_grupo: "",
  descripcion: "",
  id_materia: "",
  estado: 1,
};

function Grupos() {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [materias, setMaterias] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [grupoAEliminar, setGrupoAEliminar] = useState(null);
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const [dataGrupos, dataMaterias] = await Promise.all([
          obtenerGrupos(),
          obtenerMaterias(),
        ]);

        setGrupos(dataGrupos.grupos ?? []);
        setMaterias(dataMaterias.materias ?? []);
      } catch (errorSolicitud) {
        setError(
          errorSolicitud.response?.data?.mensaje ||
            "No fue posible cargar los grupos.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarGrupos();
  }, []);

  const abrirFormularioNuevo = () => {
    setGrupoSeleccionado(null);
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setFormularioAbierto(false);
    setGrupoSeleccionado(null);
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

  const abrirFormularioEdicion = (grupo) => {
    setGrupoSeleccionado(grupo);

    setFormulario({
      cod_grupo: grupo.cod_grupo ?? "",
      descripcion: grupo.descripcion ?? "",
      id_materia: grupo.id_materia ?? "",
      estado: Number(grupo.estado),
    });

    setErrorFormulario("");
    setFormularioAbierto(true);
  };

  const construirDatosGrupo = () => {
    const codGrupo = String(formulario.cod_grupo ?? "").trim();
    const descripcion = String(formulario.descripcion ?? "").trim();
    const idMateria = Number(formulario.id_materia);
    const estado = Number(formulario.estado);

    if (!codGrupo || !descripcion || !formulario.id_materia) {
      return {
        error:
          "El código del grupo, la descripción y la materia son obligatorios.",
      };
    }

    if (!Number.isInteger(idMateria) || idMateria <= 0) {
      return {
        error: "Debe seleccionar una materia válida.",
      };
    }

    if (![0, 1].includes(estado)) {
      return {
        error: "El estado debe ser Activo o Inactivo.",
      };
    }

    return {
      datos: {
        cod_grupo: codGrupo,
        descripcion,
        id_materia: idMateria,
        estado,
      },
    };
  };

  const guardarGrupo = async () => {
    const { datos: datosGrupo, error: errorValidacion } = construirDatosGrupo();

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensajeExito("");

      let respuesta;

      if (grupoSeleccionado) {
        respuesta = await actualizarGrupo(
          grupoSeleccionado.id_grupo,
          datosGrupo,
        );
      } else {
        respuesta = await crearGrupo(datosGrupo);
        setPagina(0);
      }

      const dataActualizada = await obtenerGrupos();
      setGrupos(dataActualizada.grupos ?? []);

      setMensajeExito(
        respuesta.mensaje ||
          (grupoSeleccionado
            ? "Grupo actualizado correctamente."
            : "Grupo creado correctamente."),
      );

      setFormularioAbierto(false);
      setGrupoSeleccionado(null);
      setFormulario(formularioInicial);
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          `No fue posible ${
            grupoSeleccionado ? "actualizar" : "crear"
          } el grupo.`,
      );
    } finally {
      setGuardando(false);
    }
  };

  const textoBusqueda = busqueda.trim().toLowerCase();

  const gruposVisibles = grupos.filter((grupo) =>
    [
      grupo.cod_grupo,
      grupo.descripcion,
      grupo.codigo_materia,
      grupo.nombre_materia,
    ].some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda),
    ),
  );

  const gruposPaginados = gruposVisibles.slice(
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

  const abrirConfirmacionEliminar = (grupo) => {
    setGrupoAEliminar(grupo);
    setErrorEliminar("");
    setDialogoEliminarAbierto(true);
  };

  const cerrarConfirmacionEliminar = () => {
    setDialogoEliminarAbierto(false);
    setGrupoAEliminar(null);
    setErrorEliminar("");
  };

  const confirmarEliminacion = async () => {
    if (!grupoAEliminar) return;

    try {
      setGuardando(true);
      setErrorEliminar("");

      const respuesta = await eliminarGrupo(grupoAEliminar.id_grupo);

      setGrupos((gruposActuales) =>
        gruposActuales.filter(
          (grupo) => grupo.id_grupo !== grupoAEliminar.id_grupo,
        ),
      );

      setMensajeExito(respuesta.mensaje ?? "Grupo eliminado correctamente");

      cerrarConfirmacionEliminar();
    } catch (solicitudError) {
      setErrorEliminar(
        solicitudError.response?.data?.mensaje ||
          "No fue posible eliminar el grupo.",
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
            Grupos
          </Typography>

          <Typography>
            Consulta y administración de los grupos registrados en el SGPA.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={abrirFormularioNuevo}
        >
          Nuevo grupo
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
                Listado de grupos
              </Typography>

              <Typography variant="body2">
                {gruposVisibles.length} registro(s) encontrado(s)
              </Typography>
            </Box>

            <TextField
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Buscar por grupo, descripción o materia"
              size="small"
              sx={{ width: { xs: "100%", md: 390 } }}
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
                  <TableCell>Código del grupo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Código materia</TableCell>
                  <TableCell>Materia</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {gruposPaginados.map((grupo) => (
                  <TableRow key={grupo.id_grupo} hover>
                    <TableCell>{grupo.cod_grupo || "Sin código"}</TableCell>

                    <TableCell>
                      {grupo.descripcion || "Sin descripción"}
                    </TableCell>

                    <TableCell>
                      {grupo.codigo_materia || "Sin código"}
                    </TableCell>

                    <TableCell>
                      {grupo.nombre_materia || "Sin materia"}
                    </TableCell>

                    <TableCell align="center">
                      <IconButton
                        color="error"
                        aria-label={`Eliminar grupo ${grupo.cod_grupo}`}
                        onClick={() => abrirConfirmacionEliminar(grupo)}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                      <Chip
                        label={
                          Number(grupo.estado) === 1 ? "Activo" : "Inactivo"
                        }
                        color={
                          Number(grupo.estado) === 1 ? "success" : "default"
                        }
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        aria-label={`Editar grupo ${grupo.cod_grupo}`}
                        onClick={() => abrirFormularioEdicion(grupo)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {gruposPaginados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No se encontraron grupos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={gruposVisibles.length}
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
          {grupoSeleccionado ? "Editar grupo" : "Nuevo grupo"}
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
              label="Código del grupo"
              name="cod_grupo"
              value={formulario.cod_grupo}
              onChange={cambiarCampoFormulario}
              required
              fullWidth
            />

            <FormControl required fullWidth>
              <InputLabel id="materia-grupo-label">Materia</InputLabel>

              <Select
                labelId="materia-grupo-label"
                name="id_materia"
                value={formulario.id_materia}
                label="Materia"
                onChange={cambiarCampoFormulario}
              >
                {materias.map((materia) => (
                  <MenuItem key={materia.id_materia} value={materia.id_materia}>
                    {materia.codigo} - {materia.nombre_materia}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Descripción"
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambiarCampoFormulario}
              required
              fullWidth
              sx={{
                gridColumn: {
                  sm: "1 / -1",
                },
              }}
            />

            <FormControl required fullWidth>
              <InputLabel id="estado-grupo-label">Estado</InputLabel>

              <Select
                labelId="estado-grupo-label"
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
            onClick={guardarGrupo}
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : grupoSeleccionado
                ? "Guardar cambios"
                : "Crear grupo"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={dialogoEliminarAbierto}
        onClose={guardando ? undefined : cerrarConfirmacionEliminar}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Eliminar grupo</DialogTitle>

        <DialogContent>
          {errorEliminar && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorEliminar}
            </Alert>
          )}

          <Typography>
            ¿Está seguro de eliminar el grupo{" "}
            <strong>{grupoAEliminar?.cod_grupo}</strong>?
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

export default Grupos;
