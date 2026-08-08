import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
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
import { obtenerMaterias } from "../../services/materiaService";

function Materias() {
  const [materias, setMaterias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
                        {Number(materia.estado) === 1 ? "Activo" : "Inactivo"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {materiasVisibles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
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
