import { useEffect, useState } from "react";

import ApartmentIcon from "@mui/icons-material/Apartment";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import ScheduleIcon from "@mui/icons-material/Schedule";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import MainLayout from "../../layouts/MainLayout";
import { obtenerResumenDashboard } from "../../services/dashboardService";

const tarjetas = [
  {
    clave: "docentes",
    etiqueta: "Docentes",
    icono: PeopleIcon,
    color: "#3D7A2A",
    fondo: "#DFF2D8",
  },
  {
    clave: "materias",
    etiqueta: "Materias",
    icono: MenuBookIcon,
    color: "#0D6EFD",
    fondo: "#E7F0FF",
  },
  {
    clave: "grupos",
    etiqueta: "Grupos",
    icono: GroupsIcon,
    color: "#7C3AED",
    fondo: "#EDE9FE",
  },
  {
    clave: "aulas",
    etiqueta: "Aulas",
    icono: MeetingRoomIcon,
    color: "#6C757D",
    fondo: "#E9ECEF",
  },
  {
    clave: "periodos",
    etiqueta: "Períodos académicos",
    icono: CalendarMonthIcon,
    color: "#F59E0B",
    fondo: "#FEF3C7",
  },
  {
    clave: "asignaciones",
    etiqueta: "Asignaciones",
    icono: AssignmentIndIcon,
    color: "#198754",
    fondo: "#D1E7DD",
  },
  {
    clave: "horarios",
    etiqueta: "Horarios programados",
    icono: ScheduleIcon,
    color: "#0369A1",
    fondo: "#E0F2FE",
  },
  {
    clave: "aulasPendientes",
    etiqueta: "Horarios sin aula",
    icono: ApartmentIcon,
    color: "#DC3545",
    fondo: "#F8D7DA",
  },
];

function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const datos = await obtenerResumenDashboard();
        setResumen(datos);
      } catch (solicitudError) {
        setError(
          solicitudError.response?.data?.mensaje ||
            "No fue posible cargar la información del dashboard.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarResumen();
  }, []);

  return (
    <MainLayout>
      <Stack spacing={0.5} mb={3.5}>
        <Typography variant="h4">Dashboard</Typography>
        <Typography color="text.secondary">
          Resumen general de la programación académica de Fisioterapia.
        </Typography>
      </Stack>

      {cargando && (
        <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {resumen && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2.5,
          }}
        >
          {tarjetas.map(
            ({ clave, etiqueta, icono: Icono, color, fondo }) => (
              <Card
                key={clave}
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "transform 160ms ease, box-shadow 160ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 30px rgba(30,61,20,0.09)",
                  },
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        {etiqueta}
                      </Typography>
                      <Typography variant="h4" mt={1}>
                        {resumen[clave]}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 3,
                        color,
                        bgcolor: fondo,
                      }}
                    >
                      <Icono />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ),
          )}
        </Box>
      )}
    </MainLayout>
  );
}

export default Dashboard;
