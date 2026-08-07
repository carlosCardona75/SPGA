import api from "./api";

export const obtenerDocentes = async () => {
  const { data } = await api.get("/docentes");
  return data;
};

export const actualizarDocente = async (idDocente, datosDocente) => {
  const { data } = await api.put(`/docentes/${idDocente}`, datosDocente);
  return data;
};
