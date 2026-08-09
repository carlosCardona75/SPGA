import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { iniciarSesion } from "../../services/authService";

function Login() {
  const navigate = useNavigate();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [correo, setCorreo] = useState(
    () => localStorage.getItem("sgpa_correo_recordado") || "",
  );
  const [password, setPassword] = useState("");
  const [recordarCorreo, setRecordarCorreo] = useState(
    () => Boolean(localStorage.getItem("sgpa_correo_recordado")),
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await iniciarSesion({
        correo: correo.trim(),
        password,
      });

      sessionStorage.setItem("sgpa_token", respuesta.token);
      sessionStorage.setItem(
        "sgpa_usuario",
        JSON.stringify(respuesta.usuario),
      );

      if (recordarCorreo) {
        localStorage.setItem("sgpa_correo_recordado", correo.trim());
      } else {
        localStorage.removeItem("sgpa_correo_recordado");
      }

      if (respuesta.usuario?.debe_cambiar_password === 1) {
        navigate("/perfil", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (solicitudError) {
      const mensaje =
        solicitudError.response?.data?.mensaje ||
        "No fue posible conectar con el servidor. Intenta nuevamente.";

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

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

      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          px: 3,
          py: 6,
        }}
      >
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
              <LockOutlinedIcon />
            </Box>

            <Typography variant="h4" textAlign="center">
              Iniciar sesión
            </Typography>
            <Typography color="text.secondary" textAlign="center">
              Ingresa tus credenciales para acceder al SGPA.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={manejarEnvio} noValidate>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}

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
                name="password"
                label="Contraseña"
                type={mostrarPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={cargando}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            mostrarPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          onClick={() => setMostrarPassword((valor) => !valor)}
                          edge="end"
                        >
                          {mostrarPassword ? (
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

              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={recordarCorreo}
                      onChange={(event) =>
                        setRecordarCorreo(event.target.checked)
                      }
                      disabled={cargando}
                    />
                  }
                  label="Recordar correo"
                />
                <Link component={RouterLink} to="/login" underline="hover">
                  ¿Olvidaste tu contraseña?
                </Link>
              </Stack>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={cargando || !correo.trim() || !password}
              >
                {cargando ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Ingresar"
                )}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            textAlign="center"
            mt={4}
          >
            Acceso exclusivo para personal autorizado.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default Login;
