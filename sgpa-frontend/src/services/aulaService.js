import api from "./api";

export const obtenerAulas = async () => {
  const { data } = await api.get("/aulas");
  return data;
};

export const crearAula = async (datosAula) => {
  const { data } = await api.post("/aulas", datosAula);
  return data;
};

export const actualizarAula = async (idAula, datosAula) => {
  const { data } = await api.put(`/aulas/${idAula}`, datosAula);
  return data;
};

export const eliminarAula = async (idAula) => {
  const { data } = await api.delete(`/aulas/${idAula}`);
  return data;
};
