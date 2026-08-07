import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

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
  IconButton,
  InputAdornment,
  MenuItem,
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
  actualizarDocente,
  obtenerDocentes,
} from "../../services/docenteService";

function Docentes() {
  const [docentes, setDocentes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        const data = await obtenerDocentes();
        setDocentes(data.docentes ?? []);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar los docentes.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDocentes();
  }, []);

  const docentesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");

    if (!texto) return docentes;

    return docentes.filter((docente) =>
      [
        docente.cedula,
        docente.id_banner,
        docente.nombres,
        docente.apellidos,
        docente.correo,
      ].some((valor) =>
        String(valor ?? "")
          .toLocaleLowerCase("es")
          .includes(texto),
      ),
    );
  }, [busqueda, docentes]);

  const docentesVisibles = docentesFiltrados.slice(
    pagina * filasPorPagina,
    pagina * filasPorPagina + filasPorPagina,
  );

  const cambiarBusqueda = (event) => {
    setBusqueda(event.target.value);
    setPagina(0);
  };

  const abrirFormularioEdicion = (docente) => {
    setDocenteSeleccionado({ ...docente });
    setErrorFormulario("");
    setMensajeExito("");
    setFormularioAbierto(true);
  };

  const cerrarFormularioEdicion = () => {
    setFormularioAbierto(false);
    setDocenteSeleccionado(null);
    setErrorFormulario("");
  };

  const cambiarCampoFormulario = (event) => {
    const { name, value } = event.target;

    setDocenteSeleccionado((docenteActual) => ({
      ...docenteActual,
      [name]: value,
    }));
  };
  const guardarCambiosDocente = async () => {
    if (!docenteSeleccionado) return;

    const maxHoras = Number(docenteSeleccionado.max_horas);

    if (!Number.isInteger(maxHoras) || maxHoras < 1 || maxHoras > 40) {
      setErrorFormulario(
        "El máximo de horas debe ser un número entero entre 1 y 40.",
      );
      return;
    }

    setGuardando(true);
    setErrorFormulario("");

    try {
      const datosActualizados = {
        ...docenteSeleccionado,
        max_horas: maxHoras,
        estado: Number(docenteSeleccionado.estado),
      };

      await actualizarDocente(
        docenteSeleccionado.id_docente,
        datosActualizados,
      );

      setMensajeExito("Docente actualizado correctamente.");

      setDocentes((docentesActuales) =>
        docentesActuales.map((docente) =>
          docente.id_docente === docenteSeleccionado.id_docente
            ? datosActualizados
            : docente,
        ),
      );

      cerrarFormularioEdicion();
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          "No es posible actualizar el docente.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <MainLayout>
      <Box mb={3}>
        <Typography variant="h4">Docentes</Typography>
        <Typography color="text.secondary">
          Consulta del personal docente registrado en el SGPA.
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            gap: 2,
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box>
            <Typography variant="h6">Listado de docentes</Typography>
            <Typography variant="body2" color="text.secondary">
              {docentesFiltrados.length} registro(s) encontrado(s)
            </Typography>
          </Box>

          <TextField
            value={busqueda}
            onChange={cambiarBusqueda}
            placeholder="Buscar por nombre, cédula, Banner o correo"
            size="small"
            sx={{ width: { xs: "100%", sm: 390 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {cargando && (
          <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2.5 }}>
            {error}
          </Alert>
        )}

        {mensajeExito && (
          <Alert severity="success" sx={{ m: 2.5 }}>
            {mensajeExito}
          </Alert>
        )}

        {!cargando && !error && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F4F7F3" }}>
                    <TableCell>Docente</TableCell>
                    <TableCell>Cédula</TableCell>
                    <TableCell>Banner</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell align="center">Máx. horas</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docentesVisibles.map((docente) => (
                    <TableRow hover key={docente.id_docente}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {docente.nombres} {docente.apellidos}
                        </Typography>
                      </TableCell>
                      <TableCell>{docente.cedula}</TableCell>
                      <TableCell>{docente.id_banner}</TableCell>
                      <TableCell>{docente.correo}</TableCell>
                      <TableCell align="center">{docente.max_horas}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={docente.estado === 1 ? "Activo" : "Inactivo"}
                          color={docente.estado === 1 ? "success" : "default"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          aria-label={`Editar a ${docente.nombres} ${docente.apellidos}`}
                          onClick={() => abrirFormularioEdicion(docente)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {docentesVisibles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        No se encontraron docentes con ese criterio.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={docentesFiltrados.length}
              page={pagina}
              onPageChange={(_, nuevaPagina) => setPagina(nuevaPagina)}
              rowsPerPage={filasPorPagina}
              onRowsPerPageChange={(event) => {
                setFilasPorPagina(Number(event.target.value));
                setPagina(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count}`
              }
            />
          </>
        )}
      </Card>
      <Dialog
        open={formularioAbierto}
        onClose={cerrarFormularioEdicion}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar docente</DialogTitle>

        <DialogContent>
          {errorFormulario && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorFormulario}
            </Alert>
          )}
          {docenteSeleccionado && (
            <Box
              sx={{
                mt: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Cédula"
                name="cedula"
                value={docenteSeleccionado.cedula ?? ""}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
              />

              <TextField
                label="ID Banner"
                name="id_banner"
                value={docenteSeleccionado.id_banner ?? ""}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
              />

              <TextField
                label="Nombres"
                name="nombres"
                value={docenteSeleccionado.nombres ?? ""}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
              />

              <TextField
                label="Apellidos"
                name="apellidos"
                value={docenteSeleccionado.apellidos ?? ""}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
              />

              <TextField
                label="Correo"
                name="correo"
                type="email"
                value={docenteSeleccionado.correo ?? ""}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
              />

              <TextField
                label="Teléfono"
                name="telefono"
                value={docenteSeleccionado.telefono ?? ""}
                onChange={cambiarCampoFormulario}
                fullWidth
              />
              <TextField
                label="Máximo de horas"
                name="max_horas"
                type="number"
                value={docenteSeleccionado.max_horas ?? 40}
                onChange={cambiarCampoFormulario}
                required
                fullWidth
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: 40,
                  },
                }}
              />

              <TextField
                label="Estado"
                name="estado"
                value={docenteSeleccionado.estado ?? 1}
                onChange={cambiarCampoFormulario}
                select
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
          <Button onClick={cerrarFormularioEdicion} disabled={guardando}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={guardarCambiosDocente}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}

export default Docentes;
