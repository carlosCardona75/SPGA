import api from "./api";

export const obtenerMaterias = async () => {
  const { data } = await api.get("/materias");
  return data;
};