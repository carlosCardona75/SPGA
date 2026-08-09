export const obtenerUsuario = () => {
  try {
    const guardado = sessionStorage.getItem("sgpa_usuario");
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
};

export const esAdmin = () => obtenerUsuario()?.rol === "ADMIN";

export const esDocente = () => obtenerUsuario()?.rol === "DOCENTE";
