import LogoutIcon from "@mui/icons-material/Logout";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const usuarioGuardado = sessionStorage.getItem("sgpa_usuario");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const cerrarSesion = () => {
    sessionStorage.removeItem("sgpa_token");
    sessionStorage.removeItem("sgpa_usuario");
    navigate("/login", { replace: true });
  };

  return (
    <header
      style={{
        height: "70px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
      }}
    >
      <Typography variant="h6">Sistema de Gestión Académica</Typography>

      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
          <Typography variant="body2" fontWeight={600}>
            {usuario?.nombre || "Usuario SGPA"}
          </Typography>
          <Chip
            label={usuario?.rol || "SIN ROL"}
            size="small"
            color={usuario?.rol === "ADMIN" ? "primary" : "default"}
          />
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={cerrarSesion}
        >
          Salir
        </Button>
      </Stack>
    </header>
  );
}

export default Header;
