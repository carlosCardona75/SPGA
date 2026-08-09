import api from "./api";

export const iniciarSesion = async (credenciales) => {
  const { data } = await api.post("/auth/login", credenciales);
  return data;
};

export const recuperarClave = async (datos) => {
  const { data } = await api.post("/auth/recuperar-clave", datos);
  return data;
};

export const restablecerClave = async (datos) => {
  const { data } = await api.post("/auth/restablecer-clave", datos);
  return data;
};
