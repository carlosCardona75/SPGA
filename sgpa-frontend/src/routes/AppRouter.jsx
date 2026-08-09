import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "../pages/Dashboard/Dashboard";
import Docentes from "../pages/Docentes/Docentes";
import Login from "../pages/Login/Login";
import Materias from "../pages/Materias/Materias";
import Grupos from "../pages/Grupos/Grupos";
import ProtectedRoute from "./ProtectedRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/docentes" element={<Docentes />} />
          <Route path="/materias" element={<Materias />} />
          <Route path="/grupos" element={<Grupos />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
