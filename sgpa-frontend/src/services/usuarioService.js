import api from "./api";

export const obtenerUsuarios = async () => {
  const { data } = await api.get("/usuarios");
  return data;
};

export const crearUsuario = async (datosUsuario) => {
  const { data } = await api.post("/usuarios", datosUsuario);
  return data;
};

export const restablecerPassword = async (idUsuario) => {
  const { data } = await api.patch(`/usuarios/${idUsuario}/restablecer-password`);
  return data;
};
