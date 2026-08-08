import api from "./api";

export const obtenerMaterias = async () => {
  const { data } = await api.get("/materias");
  return data;
};
export const actualizarMateria = async (idMateria, datosMateria) => {
  const { data } = await api.put(`/materias/${idMateria}`, datosMateria);
  return data;
};