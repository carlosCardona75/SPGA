import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { recuperarClave, restablecerClave } from "../../services/authService";

function RecuperarClave() {
  const [paso, setPaso] = useState(1);
  const [token, setToken] = useState("");
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState({
    password_nueva: false,
    confirmar_password: false,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const alternarVisibilidad = (campo) => {
    setMostrarPassword((estado) => ({
      ...estado,
      [campo]: !estado[campo],
    }));
  };

  const verificarIdentidad = async (event) => {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await recuperarClave({
        correo: correo.trim(),
        cedula: cedula.trim(),
      });

      setToken(respuesta.token);
      setPaso(2);
    } catch (solicitudError) {
      setError(
        solicitudError.response?.data?.mensaje ||
          "No fue posible verificar la identidad. Intenta nuevamente.",
      );
    } finally {
      setCargando(false);
    }
  };

  const guardarNuevaPassword = async (event) => {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      await restablecerClave({
        token,
        password_nueva: passwordNueva,
        confirmar_password: confirmarPassword,
      });

      setExito(true);
    } catch (solicitudError) {
      setError(
        solicitudError.response?.data?.mensaje ||
          "No fue posible restablecer la contraseña.",
      );
    } finally {
      setCargando(false);
    }
  };

  const campoPassword = (campo, etiqueta) => (
    <TextField
      fullWidth
      required
      name={campo}
      label={etiqueta}
      type={mostrarPassword[campo] ? "text" : "password"}
      autoComplete="new-password"
      value={campo === "password_nueva" ? passwordNueva : confirmarPassword}
      onChange={(event) =>
        campo === "password_nueva"
          ? setPasswordNueva(event.target.value)
          : setConfirmarPassword(event.target.value)
      }
      disabled={cargando}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={
                  mostrarPassword[campo] ? "Ocultar" : "Mostrar"
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
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(320px, 44%) 1fr" },
        backgroundColor: "background.default",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 6, lg: 8 },
          color: "common.white",
          background:
            "linear-gradient(145deg, #1E3D14 0%, #2A5A1D 52%, #3D7A2A 100%)",
        }}
      >
        <Stack spacing={1.5}>
          <Box
            sx={{
              width: 64,
              height: 64,
              display: "grid",
              placeItems: "center",
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.14)",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            A
          </Box>

          <Typography variant="h4">SGPA</Typography>
          <Typography sx={{ maxWidth: 420, color: "rgba(255,255,255,0.76)" }}>
            Sistema de Gestión de Programación Académica del programa de
            Fisioterapia.
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
          Fundación Universitaria del Área Andina
        </Typography>
      </Box>

      <Box sx={{ display: "grid", placeItems: "center", px: 3, py: 6 }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 440,
            p: { xs: 3, sm: 5 },
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={1} alignItems="center" mb={4}>
            <Box
              sx={{
                width: 52,
                height: 52,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: "primary.light",
                color: "primary.main",
              }}
            >
              <LockResetOutlinedIcon />
            </Box>

            <Typography variant="h4" textAlign="center">
              Recuperar contraseña
            </Typography>

            <Typography color="text.secondary" textAlign="center">
              {paso === 1
                ? "Verifica tu identidad con tu correo institucional y tu cédula."
                : "Define tu nueva contraseña."}
            </Typography>
          </Stack>

          {exito ? (
            <Stack spacing={2.5}>
              <Alert severity="success">
                Contraseña actualizada correctamente. Ya puedes iniciar sesión
                con tu nueva contraseña.
              </Alert>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
              >
                Ir al inicio de sesión
              </Button>
            </Stack>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

              {paso === 1 ? (
                <Box component="form" onSubmit={verificarIdentidad} noValidate>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      name="correo"
                      label="Correo institucional"
                      autoComplete="email"
                      value={correo}
                      onChange={(event) => setCorreo(event.target.value)}
                      disabled={cargando}
                    />

                    <TextField
                      fullWidth
                      required
                      name="cedula"
                      label="Cédula"
                      value={cedula}
                      onChange={(event) => setCedula(event.target.value)}
                      disabled={cargando}
                    />

                    <Typography variant="caption" color="text.secondary">
                      Los datos deben coincidir con tu registro como docente del
                      SGPA.
                    </Typography>

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={cargando || !correo.trim() || !cedula.trim()}
                    >
                      {cargando ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Verificar identidad"
                      )}
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box
                  component="form"
                  onSubmit={guardarNuevaPassword}
                  noValidate
                >
                  <Stack spacing={2.5}>
                    {campoPassword("password_nueva", "Nueva contraseña")}
                    {campoPassword(
                      "confirmar_password",
                      "Confirmar contraseña",
                    )}

                    <Typography variant="caption" color="text.secondary">
                      La contraseña debe tener al menos 8 caracteres e incluir
                      mayúscula, minúscula y número.
                    </Typography>

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={
                        cargando ||
                        !passwordNueva ||
                        !confirmarPassword
                      }
                    >
                      {cargando ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Guardar nueva contraseña"
                      )}
                    </Button>
                  </Stack>
                </Box>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mt={3}
              >
                <Link component={RouterLink} to="/login" underline="hover">
                  Volver al inicio de sesión
                </Link>
              </Typography>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default RecuperarClave;
