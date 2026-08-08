import api from "./api";

export const obtenerMaterias = async () => {
  const { data } = await api.get("/materias");
  return data;
};

export const crearMateria = async (datosMateria) => {
  const { data } = await api.post("/materias", datosMateria);
  return data;
};
export const actualizarMateria = async (idMateria, datosMateria) => {
  const { data } = await api.put(`/materias/${idMateria}`, datosMateria);
  return data;
};

export const eliminarMateria = async (idMateria) => {
  const { data } = await api.delete(`/materias/${idMateria}`);
  return data;
};
