import api from "./api";

export const obtenerDocentes = async () => {
  const { data } = await api.get("/docentes");
  return data;
};

export const actualizarDocente = async (idDocente, datosDocente) => {
  const { data } = await api.put(`/docentes/${idDocente}`, datosDocente);
  return data;
};

export const crearDocente = async (datosDocente) => {
  const { data } = await api.post("/docentes", datosDocente);
  return data;
};

export const eliminarDocente = async (idDocente) => {
  const { data } = await api.delete(`/docentes/${idDocente}`);
  return data;
};

export const exportarDocentes = async () => {
  const { data } = await api.get("/docentes/exportar", {
    responseType: "blob",
  });
  return data;
};
