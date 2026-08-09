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
  FormHelperText,
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

import AddIcon from "@mui/icons-material/Add";
import LockResetIcon from "@mui/icons-material/LockReset";
import SearchIcon from "@mui/icons-material/Search";

import MainLayout from "../../layouts/MainLayout";
import {
  crearUsuario,
  obtenerUsuarios,
  restablecerPassword,
} from "../../services/usuarioService";
import { obtenerDocentes } from "../../services/docenteService";

const formularioInicial = {
  id_docente: "",
  rol: "DOCENTE",
};

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const [dialogoNuevoAbierto, setDialogoNuevoAbierto] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [credencialTemporal, setCredencialTemporal] = useState(null);

  const [usuarioAReiniciar, setUsuarioAReiniciar] = useState(null);
  const [dialogoReinicioAbierto, setDialogoReinicioAbierto] = useState(false);
  const [guardandoReinicio, setGuardandoReinicio] = useState(false);
  const [errorReinicio, setErrorReinicio] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [dataUsuarios, dataDocentes] = await Promise.all([
          obtenerUsuarios(),
          obtenerDocentes(),
        ]);

        setUsuarios(dataUsuarios.usuarios ?? []);
        setDocentes(dataDocentes.docentes ?? []);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar los usuarios.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const docentesConCuenta = useMemo(
    () =>
      new Set(
        usuarios
          .map((usuario) => usuario.id_docente)
          .filter((id) => id !== null && id !== undefined),
      ),
    [usuarios],
  );

  const docentesDisponibles = useMemo(
    () =>
      docentes.filter((docente) => !docentesConCuenta.has(docente.id_docente)),
    [docentes, docentesConCuenta],
  );

  const docenteSeleccionado = useMemo(
    () =>
      docentes.find(
        (docente) => docente.id_docente === Number(formulario.id_docente),
      ) ?? null,
    [docentes, formulario.id_docente],
  );

  const avisosDocente = useMemo(() => {
    if (!docenteSeleccionado) return [];

    const avisos = [];

    if (!String(docenteSeleccionado.correo ?? "").endsWith("@areandina.edu.co")) {
      avisos.push(
        "El docente no tiene correo institucional @areandina.edu.co; el sistema rechazará la cuenta. Actualice el correo en el módulo Docentes.",
      );
    }

    if (
      formulario.rol === "DOCENTE" &&
      Number(docenteSeleccionado.estado) !== 1
    ) {
      avisos.push(
        "El docente está inactivo; no se podrá crear una cuenta DOCENTE hasta reactivarlo.",
      );
    }

    return avisos;
  }, [docenteSeleccionado, formulario.rol]);

  const abrirDialogoNuevo = () => {
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setCredencialTemporal(null);
    setDialogoNuevoAbierto(true);
  };

  const cerrarDialogoNuevo = () => {
    if (guardando) return;

    setDialogoNuevoAbierto(false);
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setCredencialTemporal(null);
  };

  const cambiarCampoFormulario = (event) => {
    const { name, value } = event.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: value,
    }));
  };

  const guardarUsuario = async () => {
    if (!formulario.id_docente) {
      setErrorFormulario("Debe seleccionar un docente.");
      return;
    }

    if (avisosDocente.some((aviso) => aviso.includes("rechazará"))) {
      setErrorFormulario(
        "El docente debe tener correo institucional @areandina.edu.co para crear la cuenta.",
      );
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setCredencialTemporal(null);

      const respuesta = await crearUsuario({
        id_docente: Number(formulario.id_docente),
        rol: formulario.rol,
      });

      setCredencialTemporal({
        correo: respuesta.usuario?.correo,
        password: respuesta.password_temporal,
        advertencia: respuesta.advertencia,
      });

      const dataUsuarios = await obtenerUsuarios();
      setUsuarios(dataUsuarios.usuarios ?? []);
      setPagina(0);
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          "No fue posible crear la cuenta de usuario.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirConfirmacionReinicio = (usuario) => {
    setUsuarioAReiniciar(usuario);
    setErrorReinicio("");
    setDialogoReinicioAbierto(true);
  };

  const cerrarConfirmacionReinicio = () => {
    if (guardandoReinicio) return;

    setDialogoReinicioAbierto(false);
    setUsuarioAReiniciar(null);
    setErrorReinicio("");
  };

  const confirmarReinicio = async () => {
    if (!usuarioAReiniciar) return;

    try {
      setGuardandoReinicio(true);
      setErrorReinicio("");

      const respuesta = await restablecerPassword(usuarioAReiniciar.id_usuario);

      setCredencialTemporal({
        correo: respuesta.usuario?.correo,
        password: respuesta.password_temporal,
        advertencia: respuesta.advertencia,
      });

      const dataUsuarios = await obtenerUsuarios();
      setUsuarios(dataUsuarios.usuarios ?? []);

      cerrarConfirmacionReinicio();
    } catch (solicitudError) {
      setErrorReinicio(
        solicitudError.response?.data?.mensaje ||
          "No fue posible restablecer la contraseña.",
      );
    } finally {
      setGuardandoReinicio(false);
    }
  };

  const textoBusqueda = busqueda.trim().toLowerCase();

  const usuariosVisibles = usuarios.filter((usuario) =>
    [usuario.nombre, usuario.correo, usuario.rol].some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda),
    ),
  );

  const usuariosPaginados = usuariosVisibles.slice(
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
            Usuarios
          </Typography>

          <Typography>
            Cuentas de acceso de docentes y administradores del SGPA.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={abrirDialogoNuevo}
        >
          Nueva cuenta
        </Button>
      </Box>

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
                Listado de usuarios
              </Typography>

              <Typography variant="body2">
                {usuariosVisibles.length} registro(s) encontrado(s)
              </Typography>
            </Box>

            <TextField
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Buscar por nombre, correo o rol"
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
                  <TableCell>Usuario</TableCell>
                  <TableCell align="center">Rol</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Contraseña temporal</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {usuariosPaginados.map((usuario) => (
                  <TableRow key={usuario.id_usuario} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {usuario.nombre || "Sin nombre"}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {usuario.correo}
                        {usuario.id_docente
                          ? ` · Docente #${usuario.id_docente}`
                          : " · Sin docente vinculado"}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={usuario.rol}
                        color={usuario.rol === "ADMIN" ? "primary" : "default"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={Number(usuario.estado) === 1 ? "Activo" : "Inactivo"}
                        color={Number(usuario.estado) === 1 ? "success" : "error"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      {Number(usuario.debe_cambiar_password) === 1 ? (
                        <Chip
                          label="Por cambiar"
                          color="warning"
                          variant="outlined"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Ya cambiada"
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        color="primary"
                        variant="outlined"
                        startIcon={<LockResetIcon />}
                        onClick={() => abrirConfirmacionReinicio(usuario)}
                      >
                        Asignar clave temporal
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {usuariosPaginados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={usuariosVisibles.length}
            page={pagina}
            onPageChange={cambiarPagina}
            rowsPerPage={filasPorPagina}
            onRowsPerPageChange={cambiarFilasPorPagina}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página"
          />
        </Card>
      )}

      {credencialTemporal && (
        <Alert
          severity="info"
          sx={{ mt: 2 }}
          onClose={() => setCredencialTemporal(null)}
        >
          <Typography variant="body2" fontWeight={700} mb={0.5}>
            Contraseña temporal generada (se muestra una sola vez)
          </Typography>

          <Typography variant="body2">
            Correo: <strong>{credencialTemporal.correo}</strong>
          </Typography>

          <Typography variant="body2">
            Contraseña temporal: <strong>{credencialTemporal.password}</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {credencialTemporal.advertencia}
          </Typography>
        </Alert>
      )}

      <Dialog
        open={dialogoNuevoAbierto}
        onClose={guardando ? undefined : cerrarDialogoNuevo}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nueva cuenta de usuario</DialogTitle>

        <DialogContent>
          {errorFormulario && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {errorFormulario}
            </Alert>
          )}

          <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
            <FormControl required fullWidth>
              <InputLabel id="docente-usuario-label">Docente</InputLabel>

              <Select
                labelId="docente-usuario-label"
                name="id_docente"
                value={formulario.id_docente}
                label="Docente"
                onChange={cambiarCampoFormulario}
              >
                {docentesDisponibles.map((docente) => (
                  <MenuItem
                    key={docente.id_docente}
                    value={docente.id_docente}
                  >
                    {`${docente.nombres} ${docente.apellidos} (${docente.correo})`}
                  </MenuItem>
                ))}
              </Select>

              {docentesDisponibles.length === 0 && (
                <FormHelperText>
                  No hay docentes sin cuenta de usuario para asignar.
                </FormHelperText>
              )}
            </FormControl>

            <FormControl required fullWidth>
              <InputLabel id="rol-usuario-label">Rol</InputLabel>

              <Select
                labelId="rol-usuario-label"
                name="rol"
                value={formulario.rol}
                label="Rol"
                onChange={cambiarCampoFormulario}
              >
                <MenuItem value="DOCENTE">DOCENTE</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
            </FormControl>

            {avisosDocente.length > 0 && (
              <Alert severity="warning">
                {avisosDocente.map((aviso) => (
                  <Typography key={aviso} variant="body2">
                    {aviso}
                  </Typography>
                ))}
              </Alert>
            )}

            <Typography variant="caption" color="text.secondary">
              El nombre y el correo se toman del docente seleccionado. El
              sistema generará una contraseña temporal que debe entregar al
              docente; se muestra una sola vez.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrarDialogoNuevo} disabled={guardando}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={guardarUsuario}
            disabled={guardando}
          >
            {guardando ? "Creando..." : "Crear cuenta"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogoReinicioAbierto}
        onClose={guardandoReinicio ? undefined : cerrarConfirmacionReinicio}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Asignar clave temporal</DialogTitle>

        <DialogContent>
          {errorReinicio && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorReinicio}
            </Alert>
          )}

          <Typography>
            ¿Asignar una nueva clave temporal al usuario{" "}
            <strong>{usuarioAReiniciar?.nombre}</strong> (
            {usuarioAReiniciar?.correo})?
          </Typography>

          <Typography sx={{ mt: 1 }}>
            Se generará una nueva contraseña temporal que deberá entregar al
            docente; se muestra una sola vez y deberá cambiarla al ingresar.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={cerrarConfirmacionReinicio}
            disabled={guardandoReinicio}
          >
            Cancelar
          </Button>

          <Button
            color="primary"
            variant="contained"
            onClick={confirmarReinicio}
            disabled={guardandoReinicio}
          >
            {guardandoReinicio ? "Asignando..." : "Asignar clave temporal"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}

export default Usuarios;
