import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();
  const token = sessionStorage.getItem("sgpa_token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
