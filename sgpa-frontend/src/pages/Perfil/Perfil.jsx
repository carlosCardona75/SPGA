import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import MainLayout from "../../layouts/MainLayout";
import {
  cambiarPassword,
  obtenerMiPerfilDocente,
  obtenerPerfil,
} from "../../services/perfilService";
import { obtenerUsuario } from "../../utils/rol";

const formularioInicial = {
  password_actual: "",
  password_nueva: "",
  confirmar_password: "",
};

function Perfil() {
  const [usuario, setUsuario] = useState(() => obtenerUsuario());
  const [perfilDocente, setPerfilDocente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mostrarPassword, setMostrarPassword] = useState({
    password_actual: false,
    password_nueva: false,
    confirmar_password: false,
  });
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const debeCambiarPassword = Number(usuario?.debe_cambiar_password) === 1;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [dataPerfil, dataDocente] = await Promise.allSettled([
          obtenerPerfil(),
          obtenerMiPerfilDocente(),
        ]);

        if (dataPerfil.status === "fulfilled") {
          setUsuario((actual) => ({
            ...(actual ?? {}),
            ...(dataPerfil.value.usuario ?? {}),
          }));
        }

        if (dataDocente.status === "fulfilled") {
          setPerfilDocente(dataDocente.value.docente ?? null);
        }
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar el perfil.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const cambiarCampoFormulario = (event) => {
    const { name, value } = event.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: value,
    }));
  };

  const alternarVisibilidad = (campo) => {
    setMostrarPassword((estado) => ({
      ...estado,
      [campo]: !estado[campo],
    }));
  };

  const construirDatosPassword = () => {
    const passwordActual = String(formulario.password_actual ?? "");
    const passwordNueva = String(formulario.password_nueva ?? "");
    const confirmarPassword = String(formulario.confirmar_password ?? "");

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      return {
        error: "Todos los campos de contraseña son obligatorios.",
      };
    }

    if (passwordNueva !== confirmarPassword) {
      return {
        error: "La nueva contraseña y su confirmación no coinciden.",
      };
    }

    if (passwordNueva.length < 8) {
      return {
        error: "La nueva contraseña debe tener al menos 8 caracteres.",
      };
    }

    if (
      !/[A-Z]/.test(passwordNueva) ||
      !/[a-z]/.test(passwordNueva) ||
      !/[0-9]/.test(passwordNueva)
    ) {
      return {
        error:
          "La nueva contraseña debe incluir mayúscula, minúscula y número.",
      };
    }

    return {
      datos: {
        password_actual: passwordActual,
        password_nueva: passwordNueva,
        confirmar_password: confirmarPassword,
      },
    };
  };

  const guardarPassword = async () => {
    const { datos: datosPassword, error: errorValidacion } =
      construirDatosPassword();

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensajeExito("");

      const respuesta = await cambiarPassword(datosPassword);

      setMensajeExito(
        respuesta.mensaje ?? "Contraseña actualizada correctamente.",
      );

      setFormulario(formularioInicial);

      setUsuario((actual) => ({
        ...(actual ?? {}),
        debe_cambiar_password: 0,
      }));

      sessionStorage.setItem(
        "sgpa_usuario",
        JSON.stringify({
          ...usuario,
          debe_cambiar_password: 0,
        }),
      );
    } catch (solicitudError) {
      setErrorFormulario(
        solicitudError.response?.data?.mensaje ||
          "No fue posible cambiar la contraseña.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const campoPassword = (campo, etiqueta) => (
    <TextField
      label={etiqueta}
      name={campo}
      type={mostrarPassword[campo] ? "text" : "password"}
      value={formulario[campo]}
      onChange={cambiarCampoFormulario}
      disabled={guardando}
      fullWidth
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={
                  mostrarPassword[campo]
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                onClick={() => alternarVisibilidad(campo)}
                edge="end"
              >
                {mostrarPassword[campo] ? (
                  <VisibilityOffIcon />
                ) : (
                  <VisibilityIcon />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );

  return (
    <MainLayout>
      <Stack spacing={0.5} mb={3.5}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Mi perfil
        </Typography>

        <Typography color="text.secondary">
          Información del usuario autenticado y gestión de la contraseña.
        </Typography>
      </Stack>

      {debeCambiarPassword && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Debe cambiar la contraseña temporal antes de continuar utilizando el
          sistema.
        </Alert>
      )}

      {cargando && (
        <Box sx={{ minHeight: 200, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {!cargando && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!cargando && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Datos del usuario
              </Typography>

              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PersonOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nombre
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {usuario?.nombre || "Sin información"}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <EmailOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Correo
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {usuario?.correo || "Sin información"}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <VerifiedUserOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Rol
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {usuario?.rol || "Sin información"}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              {perfilDocente && (
                <>
                  <Divider sx={{ my: 2.5 }} />

                  <Typography variant="h6" fontWeight={700} mb={2}>
                    Datos del docente
                  </Typography>

                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <BadgeOutlinedIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Cédula
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {perfilDocente.cedula || "Sin información"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <BadgeOutlinedIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Código Banner
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {perfilDocente.id_banner || "Sin información"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <PersonOutlinedIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Nombre completo
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {perfilDocente.nombres || ""}{" "}
                          {perfilDocente.apellidos || ""}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <EmailOutlinedIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Correo
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {perfilDocente.correo || "Sin información"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Cambiar contraseña
              </Typography>

              {mensajeExito && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {mensajeExito}
                </Alert>
              )}

              {errorFormulario && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorFormulario}
                </Alert>
              )}

              <Stack spacing={2}>
                {campoPassword("password_actual", "Contraseña actual")}
                {campoPassword("password_nueva", "Nueva contraseña")}
                {campoPassword("confirmar_password", "Confirmar contraseña")}

                <Stack direction="row" alignItems="center" spacing={1}>
                  <LockOutlinedIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    La contraseña debe tener al menos 8 caracteres e incluir
                    mayúscula, minúscula y número.
                  </Typography>
                </Stack>

                <Button
                  variant="contained"
                  color="success"
                  onClick={guardarPassword}
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Actualizar contraseña"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}
    </MainLayout>
  );
}

export default Perfil;
