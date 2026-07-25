import api from "./api";

export const iniciarSesion = async (credenciales) => {
  const { data } = await api.post("/auth/login", credenciales);
  return data;
};
