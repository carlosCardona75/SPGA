import api from "./api";

export const obtenerPeriodos = async () => {
  const { data } = await api.get("/periodos");
  return data;
};

export const crearPeriodo = async (datosPeriodo) => {
  const { data } = await api.post("/periodos", datosPeriodo);
  return data;
};

export const actualizarPeriodo = async (idPeriodo, datosPeriodo) => {
  const { data } = await api.put(`/periodos/${idPeriodo}`, datosPeriodo);
  return data;
};

export const eliminarPeriodo = async (idPeriodo) => {
  const { data } = await api.delete(`/periodos/${idPeriodo}`);
  return data;
};
