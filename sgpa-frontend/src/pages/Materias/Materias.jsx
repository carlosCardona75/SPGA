import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
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

import MainLayout from "../../layouts/MainLayout";
import {
  actualizarMateria,
  obtenerMaterias,
} from "../../services/materiaService";

function Materias() {
  const [materias, setMaterias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    const cargarMaterias = async () => {
      try {
        const data = await obtenerMaterias();
        setMaterias(data.materias ?? []);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar las materias.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarMaterias();
  }, []);

  const materiasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");

    if (!texto) {
      return materias;
    }

    return materias.filter((materia) =>
      [materia.codigo, materia.nombre_materia, materia.semestre].some((valor) =>
        String(valor ?? "")
          .toLocaleLowerCase("es")
          .includes(texto),
      ),
    );
  }, [busqueda, materias]);

  const materiasVisibles = materiasFiltradas.slice(
    pagina * filasPorPagina,
    pagina * filasPorPagina + filasPorPagina,
  );

  const cambiarBusqueda = (event) => {
    setBusqueda(event.target.value);
    setPagina(0);
  };

  const abrirFormularioEdicion = (materia) => {
    setMateriaSeleccionada({ ...materia });
    setFormularioAbierto(true);
    setErrorFormulario("");
  };

  const cerrarFormularioEdicion = () => {
    setFormularioAbierto(false);
    setMateriaSeleccionada(null);
    setErrorFormulario("");
  };

  const cambiarCampoFormulario = (event) => {
    const { name, value } = event.target;

    setMateriaSeleccionada((materiaActual) => ({
      ...materiaActual,
      [name]: value,
    }));
  };

  const guardarCambiosMateria = async () => {
    const codigo = materiaSeleccionada.codigo?.trim();
    const nombreMateria = materiaSeleccionada.nombre_materia?.trim();

    if (!codigo || !nombreMateria) {
      setErrorFormulario(
        "El código y el nombre de la materia son obligatorios.",
      );
      return;
    }

    const convertirNumeroOpcional = (valor) => {
      return valor === "" || valor === null ? null : Number(valor);
    };

    const datosMateria = {
      codigo,
      nombre_materia: nombreMateria,
      semestre: convertirNumeroOpcional(materiaSeleccionada.semestre),
      creditos: convertirNumeroOpcional(materiaSeleccionada.creditos),
      horas_semanales: convertirNumeroOpcional(
        materiaSeleccionada.horas_semanales,
      ),
      estado: Number(materiaSeleccionada.estado),
    };

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensajeExito("");

      const respuesta = await actualizarMateria(
        materiaSeleccionada.id_materia,
        datosMateria,
      );

      setMaterias((materiasActuales) =>
        materiasActuales.map((materia) =>
          materia.id_materia === materiaSeleccionada.id_materia
            ? { ...materia, ...datosMateria }
            : materia,
        ),
      );

      setMensajeExito(
        respuesta.mensaje || "Materia actualizada correctamente.",
      );

      cerrarFormularioEdicion();
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          "No fue posible actualizar la materia.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPagina = (event, nuevaPagina) => {
    setPagina(nuevaPagina);
  };

  const cambiarFilasPorPagina = (event) => {
    setFilasPorPagina(Number(event.target.value));
    setPagina(0);
  };

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Materias
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Consulta de las materias registradas en el SGPA.
        </Typography>

        {cargando && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!cargando && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {mensajeExito && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {mensajeExito}
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
              <Dialog
                open={formularioAbierto}
                onClose={cerrarFormularioEdicion}
                fullWidth
                maxWidth="sm"
              >
                <DialogTitle>Editar materia</DialogTitle>

                <DialogContent>
                  {errorFormulario && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errorFormulario}
                    </Alert>
                  )}
                  {materiaSeleccionada && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                        pt: 1,
                      }}
                    >
                      <TextField
                        label="Código"
                        name="codigo"
                        value={materiaSeleccionada.codigo ?? ""}
                        onChange={cambiarCampoFormulario}
                        required
                        fullWidth
                      />

                      <TextField
                        label="Nombre de la materia"
                        name="nombre_materia"
                        value={materiaSeleccionada.nombre_materia ?? ""}
                        onChange={cambiarCampoFormulario}
                        required
                        fullWidth
                      />

                      <TextField
                        label="Semestre"
                        name="semestre"
                        type="number"
                        value={materiaSeleccionada.semestre ?? ""}
                        onChange={cambiarCampoFormulario}
                        fullWidth
                      />

                      <TextField
                        label="Créditos"
                        name="creditos"
                        type="number"
                        value={materiaSeleccionada.creditos ?? ""}
                        onChange={cambiarCampoFormulario}
                        fullWidth
                      />

                      <TextField
                        label="Horas semanales"
                        name="horas_semanales"
                        type="number"
                        value={materiaSeleccionada.horas_semanales ?? ""}
                        onChange={cambiarCampoFormulario}
                        fullWidth
                      />

                      <TextField
                        select
                        label="Estado"
                        name="estado"
                        value={Number(materiaSeleccionada.estado)}
                        onChange={cambiarCampoFormulario}
                        required
                        fullWidth
                      >
                        <MenuItem value={1}>Activo</MenuItem>
                        <MenuItem value={0}>Inactivo</MenuItem>
                      </TextField>
                    </Box>
                  )}
                </DialogContent>

                <DialogActions>
                  <Button onClick={cerrarFormularioEdicion}>Cancelar</Button>

                  <Button
                    variant="contained"
                    onClick={guardarCambiosMateria}
                    disabled={guardando}
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </DialogActions>
              </Dialog>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Listado de materias
                </Typography>

                <Typography variant="body2">
                  {materiasFiltradas.length} registro(s) encontrado(s)
                </Typography>
              </Box>

              <TextField
                value={busqueda}
                onChange={cambiarBusqueda}
                placeholder="Buscar por código, nombre o semestre"
                size="small"
                sx={{ width: { xs: "100%", sm: 390 } }}
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
                    <TableCell>Materia</TableCell>
                    <TableCell align="center">Semestre</TableCell>
                    <TableCell align="center">Créditos</TableCell>
                    <TableCell align="center">Horas semanales</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {materiasVisibles.map((materia) => (
                    <TableRow key={materia.id_materia} hover>
                      <TableCell>{materia.codigo}</TableCell>
                      <TableCell>{materia.nombre_materia}</TableCell>
                      <TableCell align="center">{materia.semestre}</TableCell>
                      <TableCell align="center">{materia.creditos}</TableCell>
                      <TableCell align="center">
                        {materia.horas_semanales}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            Number(materia.estado) === 1 ? "Activo" : "Inactivo"
                          }
                          color={
                            Number(materia.estado) === 1 ? "success" : "default"
                          }
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          aria-label={`Editar ${materia.nombre_materia}`}
                          onClick={() => abrirFormularioEdicion(materia)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {materiasVisibles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No se encontraron materias.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={materiasFiltradas.length}
              page={pagina}
              onPageChange={cambiarPagina}
              rowsPerPage={filasPorPagina}
              onRowsPerPageChange={cambiarFilasPorPagina}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Filas por página"
            />
          </Card>
        )}
      </Box>
    </MainLayout>
  );
}

export default Materias;
