import { Navigate, Outlet, useLocation } from "react-router-dom";
import { obtenerUsuario } from "../utils/rol";

function ProtectedRoute({ rol }) {
  const location = useLocation();
  const token = sessionStorage.getItem("sgpa_token");
  const usuario = obtenerUsuario();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: location.pathname }}
      />
    );
  }

  if (rol && usuario?.rol !== rol) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
