import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import ScheduleIcon from "@mui/icons-material/Schedule";
import {
  Avatar,
  Box,
  ButtonBase,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const opciones = [
  { texto: "Dashboard", icono: DashboardIcon, ruta: "/dashboard" },
  { texto: "Docentes", icono: PeopleIcon, ruta: "/docentes" },
  { texto: "Materias", icono: MenuBookIcon, ruta: "/materias" },
  { texto: "Grupos", icono: GroupsIcon },
  { texto: "Aulas", icono: MeetingRoomIcon },
  { texto: "Períodos académicos", icono: CalendarMonthIcon },
  { texto: "Asignaciones", icono: AssignmentIndIcon },
  { texto: "Horarios", icono: ScheduleIcon },
  { texto: "Reportes", icono: BarChartIcon },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuarioGuardado = sessionStorage.getItem("sgpa_usuario");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(" ")
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
    : "SG";

  return (
    <Box
      component="aside"
      sx={{
        width: 260,
        minHeight: "100vh",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        flexShrink: 0,
        bgcolor: "#1E3D14",
        color: "common.white",
      }}
    >
      <Stack alignItems="center" spacing={1} sx={{ px: 3, py: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            display: "grid",
            placeItems: "center",
            borderRadius: 3,
            bgcolor: "primary.main",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          A
        </Box>
        <Typography variant="h6">SGPA</Typography>
        <Typography
          variant="caption"
          textAlign="center"
          sx={{ color: "rgba(255,255,255,0.55)" }}
        >
          Programa de Fisioterapia
        </Typography>
      </Stack>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <Box component="nav" sx={{ flex: 1, px: 1.5, py: 2 }}>
        <Typography
          variant="overline"
          sx={{ px: 1.5, color: "rgba(255,255,255,0.35)" }}
        >
          Módulos
        </Typography>

        <Stack spacing={0.5} mt={1}>
          {opciones.map(({ texto, icono: Icono, ruta }) => {
            const activa = location.pathname === ruta;
            const habilitada = Boolean(ruta);

            return (
            <ButtonBase
              key={texto}
              disabled={!habilitada}
              onClick={() => navigate(ruta)}
              sx={{
                width: "100%",
                justifyContent: "flex-start",
                gap: 1.5,
                px: 1.5,
                py: 1.15,
                borderRadius: 2.5,
                bgcolor: activa ? "primary.main" : "transparent",
                color: activa
                  ? "common.white"
                  : "rgba(255,255,255,0.55)",
                opacity: 1,
                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.45)",
                },
              }}
            >
              <Icono fontSize="small" />
              <Typography variant="body2" fontWeight={activa ? 600 : 400}>
                {texto}
              </Typography>
            </ButtonBase>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            p: 1.25,
            borderRadius: 2.5,
            bgcolor: "rgba(255,255,255,0.07)",
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: "secondary.main" }}>
            {iniciales}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {usuario?.nombre || "Usuario SGPA"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.5)" }}
            >
              {usuario?.rol || "SIN ROL"}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default Sidebar;
