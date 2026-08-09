/**
 * Plan de estudios FISIOTERAPIA 2026
 * Fuente: "nuevo ecap.pdf" (formato EAC-AP-I01-F01, ampliación de cupos).
 * 160 créditos, 7 680 horas, 65 asignaturas.
 *
 * periodos: 1 = I, 2 = II, ... 8 = VIII
 * tipologia: T (teórica), TP (teórico-práctica), P (práctica)
 */

const PLAN_FISIOTERAPIA_2026 = {
  programa: "FISIOTERAPIA",
  periodo: "202670",
  fechaInicio: "2027-01-15",
  fechaFinal: "2027-06-30",
  creditosTotales: 160,
  asignaturas: [
    // ---------------- Profesional Específica ----------------
    { area: "Profesional Específica", periodo: 1, nombre: "INTRODUCCIÓN A LA FISIOTERAPIA", tipologia: "T", creditos: 2 },
    { area: "Profesional Específica", periodo: 1, nombre: "MORFOFISIOLOGÍA OSTEOMUSCULAR", tipologia: "TP", creditos: 4 },
    { area: "Profesional Específica", periodo: 1, nombre: "MORFOFISIOLOGÍA NEUROMUSCULAR", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 2, nombre: "MORFOFISIOLOGÍA CARDIOVASCULAR Y RESPIRATORIA", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 2, nombre: "BIOMECÁNICA ARTICULAR Y DE TEJIDOS", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 2, nombre: "PATOKINESIOLOGÍA", tipologia: "T", creditos: 2 },
    { area: "Profesional Específica", periodo: 3, nombre: "PATOKINESIOLOGÍA OSTEOMUSCULAR", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 3, nombre: "PATOKINESIOLOGÍA NEUROMUSCULAR", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 3, nombre: "EVALUACIÓN ARTICULAR Y MUSCULAR", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 3, nombre: "APRENDIZAJE Y CONTROL MOTOR", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 3, nombre: "FISIOLOGÍA DEL EJERCICIO", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 4, nombre: "PATOKINESIOLOGÍA CARDIOVASCULAR Y RESPIRATORIA", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 4, nombre: "EJERCICIO TERAPÉUTICO I", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 4, nombre: "TÉCNICAS EN FISIOTERAPIA CARDIORRESPIRATORIA I", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 4, nombre: "AGENTES BIOFÍSICOS", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 4, nombre: "FARMACOLOGÍA EN FISIOTERAPIA", tipologia: "T", creditos: 2 },
    { area: "Profesional Específica", periodo: 5, nombre: "PRECLÍNICA", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 5, nombre: "EJERCICIO TERAPÉUTICO II", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 5, nombre: "TÉCNICAS DE TERAPIA MANUAL", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 5, nombre: "ENTRENAMIENTO DE LA FUNCIÓN MOTORA", tipologia: "TP", creditos: 3 },
    { area: "Profesional Específica", periodo: 5, nombre: "TÉCNICAS EN FISIOTERAPIA CARDIORRESPIRATORIA II", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 6, nombre: "PRÁCTICA FISIOTERAPÉUTICA I", tipologia: "P", creditos: 8 },
    { area: "Profesional Específica", periodo: 6, nombre: "THERAPEUTIC EXERCISE III", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 7, nombre: "PRÁCTICA FISIOTERAPÉUTICA II", tipologia: "P", creditos: 8 },
    { area: "Profesional Específica", periodo: 7, nombre: "ACTIVIDAD FÍSICA PARA TODOS", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 7, nombre: "ADMINISTRACIÓN EN FISIOTERAPIA", tipologia: "T", creditos: 2 },
    { area: "Profesional Específica", periodo: 7, nombre: "DISCAPACIDAD Y REHABILITACIÓN", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 7, nombre: "LÍNEA DE PROFUNDIZACIÓN I", tipologia: "T", creditos: 2 },
    { area: "Profesional Específica", periodo: 8, nombre: "PRÁCTICA FISIOTERAPÉUTICA III", tipologia: "P", creditos: 8 },
    { area: "Profesional Específica", periodo: 8, nombre: "FISIOTERAPIA EN ATENCIÓN PRIMARIA EN SALUD", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 8, nombre: "SALUD Y TRABAJO", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 8, nombre: "TELESALUD", tipologia: "TP", creditos: 2 },
    { area: "Profesional Específica", periodo: 8, nombre: "LÍNEA DE PROFUNDIZACIÓN II", tipologia: "T", creditos: 2 },

    // ---------------- Profesional Común ----------------
    { area: "Profesional Común", periodo: 1, nombre: "PENSAMIENTO COMPUTACIONAL PARA LA SALUD Y EL DEPORTE", tipologia: "TP", creditos: 2 },
    { area: "Profesional Común", periodo: 1, nombre: "BIOLOGÍA", tipologia: "TP", creditos: 3 },
    { area: "Profesional Común", periodo: 1, nombre: "MATEMÁTICA BÁSICA", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 2, nombre: "BIOESTADÍSTICA", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 2, nombre: "BIOFÍSICA", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 2, nombre: "ATENCIÓN EN SALUD", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 2, nombre: "BIOQUÍMICA", tipologia: "TP", creditos: 3 },
    { area: "Profesional Común", periodo: 3, nombre: "LECTURA CRÍTICA DE TEXTOS CIENTÍFICOS", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 4, nombre: "EPIDEMIOLOGÍA", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 4, nombre: "CULTURA Y SALUD", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 4, nombre: "ATENCIÓN PRIMARIA EN SALUD I", tipologia: "TP", creditos: 2 },
    { area: "Profesional Común", periodo: 5, nombre: "INVESTIGACIÓN I", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 5, nombre: "COMPORTAMIENTO HUMANO Y SALUD", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 6, nombre: "INVESTIGACIÓN II", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 6, nombre: "BIOÉTICA", tipologia: "T", creditos: 2 },
    { area: "Profesional Común", periodo: 6, nombre: "ATENCIÓN PRIMARIA EN SALUD II", tipologia: "TP", creditos: 2 },
    { area: "Profesional Común", periodo: 7, nombre: "CONSTITUCIÓN Y SALUD", tipologia: "T", creditos: 2 },

    // ---------------- Transversal ----------------
    { area: "Transversal", periodo: 1, nombre: "CÁTEDRA PABLO OLIVEROS MARMOLEJO", tipologia: "T", creditos: 2 },
    { area: "Transversal", periodo: 1, nombre: "INGLÉS I", tipologia: "TP", creditos: 2 },
    { area: "Transversal", periodo: 2, nombre: "SER (BE IT)", tipologia: "T", creditos: 2 },
    { area: "Transversal", periodo: 2, nombre: "INGLÉS II", tipologia: "TP", creditos: 2 },
    { area: "Transversal", periodo: 3, nombre: "SABER CONVIVIR (LIVE IT)", tipologia: "T", creditos: 2 },
    { area: "Transversal", periodo: 3, nombre: "INGLÉS III", tipologia: "TP", creditos: 2 },
    { area: "Transversal", periodo: 4, nombre: "SABER HACER (DO IT)", tipologia: "T", creditos: 2 },
    { area: "Transversal", periodo: 4, nombre: "INGLÉS IV", tipologia: "TP", creditos: 2 },
    { area: "Transversal", periodo: 5, nombre: "SABER CONOCER (KNOW IT)", tipologia: "T", creditos: 2 },
    { area: "Transversal", periodo: 5, nombre: "INGLÉS V", tipologia: "TP", creditos: 2 },
    { area: "Transversal", periodo: 6, nombre: "ESPÍRITU EMPRENDEDOR", tipologia: "T", creditos: 2 },
    { area: "Transversal", periodo: 6, nombre: "INGLÉS VI", tipologia: "TP", creditos: 2 },

    // ---------------- Libre Elección ----------------
    { area: "Libre Elección", periodo: 7, nombre: "ELECTIVA I", tipologia: "T", creditos: 2 },
    { area: "Libre Elección", periodo: 8, nombre: "ELECTIVA II", tipologia: "T", creditos: 2 },
    { area: "Libre Elección", periodo: 8, nombre: "ELECTIVA III", tipologia: "T", creditos: 2 },
  ],
};

module.exports = { PLAN_FISIOTERAPIA_2026 };
