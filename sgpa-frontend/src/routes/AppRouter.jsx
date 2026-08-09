import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Asignaciones from "../pages/Asignaciones/Asignaciones";
import Aulas from "../pages/Aulas/Aulas";
import Dashboard from "../pages/Dashboard/Dashboard";
import Docentes from "../pages/Docentes/Docentes";
import Grupos from "../pages/Grupos/Grupos";
import Horarios from "../pages/Horarios/Horarios";
import Login from "../pages/Login/Login";
import Materias from "../pages/Materias/Materias";
import Perfil from "../pages/Perfil/Perfil";
import Periodos from "../pages/Periodos/Periodos";
import Reportes from "../pages/Reportes/Reportes";
import Usuarios from "../pages/Usuarios/Usuarios";
import ProtectedRoute from "./ProtectedRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/aulas" element={<Aulas />} />
          <Route path="/periodos" element={<Periodos />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route element={<ProtectedRoute rol="ADMIN" />}>
          <Route path="/docentes" element={<Docentes />} />
          <Route path="/materias" element={<Materias />} />
          <Route path="/grupos" element={<Grupos />} />
          <Route path="/asignaciones" element={<Asignaciones />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
