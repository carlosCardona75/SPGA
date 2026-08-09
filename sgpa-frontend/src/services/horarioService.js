import api from "./api";

export const obtenerHorarios = async (filtros = {}) => {
  const { data } = await api.get("/horarios", { params: filtros });
  return data;
};

export const obtenerMiHorario = async () => {
  const { data } = await api.get("/horarios/mi-horario");
  return data;
};

export const crearHorario = async (datosHorario) => {
  const { data } = await api.post("/horarios", datosHorario);
  return data;
};

export const actualizarHorario = async (idDetalle, datosHorario) => {
  const { data } = await api.put(`/horarios/${idDetalle}`, datosHorario);
  return data;
};

export const eliminarHorario = async (idDetalle) => {
  const { data } = await api.delete(`/horarios/${idDetalle}`);
  return data;
};

export const exportarHorarios = async (filtros = {}) => {
  const { data } = await api.get("/horarios/exportar", {
    params: filtros,
    responseType: "blob",
  });
  return data;
};

export const exportarMiHorario = async () => {
  const { data } = await api.get("/horarios/exportar-mi-horario", {
    responseType: "blob",
  });
  return data;
};
