import api from "./api";

export const obtenerGrupos = async () => {
  const { data } = await api.get("/grupos");
  return data;
};

export const crearGrupo = async (datosGrupo) => {
  const { data } = await api.post("/grupos", datosGrupo);
  return data;
};

export const actualizarGrupo = async (idGrupo, datosGrupo) => {
  const { data } = await api.put(`/grupos/${idGrupo}`, datosGrupo);
  return data;
};

export const eliminarGrupo = async (idGrupo) => {
  const { data } = await api.delete(`/grupos/${idGrupo}`);
  return data;
};

