import api from "./api";

export const obtenerPerfil = async () => {
  const { data } = await api.get("/auth/perfil");
  return data;
};

export const cambiarPassword = async (datosPassword) => {
  const { data } = await api.patch("/auth/cambiar-password", datosPassword);
  return data;
};

export const obtenerMiPerfilDocente = async () => {
  const { data } = await api.get("/docentes/mi-perfil");
  return data;
};
