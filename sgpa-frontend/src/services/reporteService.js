import api from "./api";

export const exportarReportes = async () => {
  const { data } = await api.get("/reportes/exportar", {
    responseType: "blob",
  });
  return data;
};
