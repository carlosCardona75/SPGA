import api from "./api";

const obtenerTotal = async (ruta) => {
  const { data } = await api.get(ruta);
  return Number(data.total ?? 0);
};

export const obtenerResumenDashboard = async () => {
  const [
    docentes,
    materias,
    grupos,
    aulas,
    periodos,
    asignaciones,
    horarios,
    aulasPendientes,
  ] = await Promise.all([
    obtenerTotal("/docentes"),
    obtenerTotal("/materias"),
    obtenerTotal("/grupos"),
    obtenerTotal("/aulas"),
    obtenerTotal("/periodos"),
    obtenerTotal("/asignaciones"),
    obtenerTotal("/horarios"),
    obtenerTotal("/horarios?aula_pendiente=true"),
  ]);

  return {
    docentes,
    materias,
    grupos,
    aulas,
    periodos,
    asignaciones,
    horarios,
    aulasPendientes,
  };
};
