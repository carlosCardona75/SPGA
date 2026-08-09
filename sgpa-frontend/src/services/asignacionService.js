import api from "./api";

export const obtenerAsignaciones = async () => {
  const { data } = await api.get("/asignaciones");
  return data;
};

export const crearAsignacion = async (datosAsignacion) => {
  const { data } = await api.post("/asignaciones", datosAsignacion);
  return data;
};

export const actualizarAsignacion = async (idAsignacion, datosAsignacion) => {
  const { data } = await api.put(
    `/asignaciones/${idAsignacion}`,
    datosAsignacion,
  );
  return data;
};

export const eliminarAsignacion = async (idAsignacion) => {
  const { data } = await api.delete(`/asignaciones/${idAsignacion}`);
  return data;
};
