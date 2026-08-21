-- =========================================================
-- SGPA - Esquema completo de base de datos
-- Sistema de Gestión de Programación Académica
-- Este archivo contiene únicamente estructura.
-- No contiene usuarios, contraseñas ni datos personales.
-- =========================================================

CREATE DATABASE IF NOT EXISTS horarios_docentes
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

USE horarios_docentes;

SET NAMES utf8mb4;

-- =========================================================
-- Tabla: docente
-- =========================================================

CREATE TABLE IF NOT EXISTS docente (
    id_docente INT NOT NULL AUTO_INCREMENT,
    cedula VARCHAR(20) NOT NULL,
    id_banner VARCHAR(25) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) DEFAULT NULL,
    max_horas INT DEFAULT 40,
    estado TINYINT DEFAULT 1,

    PRIMARY KEY (id_docente),
    UNIQUE KEY uq_docente_cedula (cedula),
    UNIQUE KEY uq_docente_banner (id_banner),
    UNIQUE KEY uq_docente_correo (correo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Tabla: materia
-- =========================================================

CREATE TABLE IF NOT EXISTS materia (
    id_materia INT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(20) DEFAULT NULL,
    nombre_materia VARCHAR(200) DEFAULT NULL,
    semestre INT DEFAULT NULL,
    creditos INT DEFAULT NULL,
    horas_semanales INT DEFAULT NULL,
    estado TINYINT DEFAULT 1,

    PRIMARY KEY (id_materia),
    UNIQUE KEY uq_materia_codigo (codigo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Tabla: periodo_academico
-- =========================================================

CREATE TABLE IF NOT EXISTS periodo_academico (
    id_periodo INT NOT NULL AUTO_INCREMENT,
    nombre_periodo VARCHAR(30) DEFAULT NULL,
    fecha_inicio DATE DEFAULT NULL,
    fecha_final DATE DEFAULT NULL,
    estado TINYINT DEFAULT 1,

    PRIMARY KEY (id_periodo),
    UNIQUE KEY uq_periodo_nombre (nombre_periodo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Tabla: aula
-- =========================================================

CREATE TABLE IF NOT EXISTS aula (
    id_aula INT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(20) DEFAULT NULL,
    capacidad INT DEFAULT NULL,
    estado TINYINT DEFAULT 1,

    PRIMARY KEY (id_aula),
    UNIQUE KEY uq_aula_codigo (codigo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
  
-- =========================================================
-- Tabla: usuario
-- =========================================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'DOCENTE') NOT NULL,
    id_docente INT DEFAULT NULL,
    estado TINYINT NOT NULL DEFAULT 1,
    debe_cambiar_password TINYINT NOT NULL DEFAULT 0,
    password_actualizada_en TIMESTAMP NULL DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuario_correo (correo),
    UNIQUE KEY uq_usuario_docente (id_docente),

    CONSTRAINT fk_usuario_docente
        FOREIGN KEY (id_docente)
        REFERENCES docente (id_docente)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Tabla: recuperacion_clave
-- =========================================================

CREATE TABLE IF NOT EXISTS recuperacion_clave (
    id INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token VARCHAR(64) NOT NULL,
    expira_en DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_recuperacion_token (token),

    CONSTRAINT fk_recuperacion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Tabla: grupo
-- =========================================================

CREATE TABLE IF NOT EXISTS grupo (
    id_grupo INT NOT NULL AUTO_INCREMENT,
    cod_grupo VARCHAR(20) DEFAULT NULL,
    descripcion VARCHAR(100) DEFAULT NULL,
    id_materia INT NOT NULL,
    estado TINYINT DEFAULT 1,

    PRIMARY KEY (id_grupo),
    KEY idx_grupo_materia (id_materia),

    CONSTRAINT fk_grupo_materia
        FOREIGN KEY (id_materia)
        REFERENCES materia (id_materia)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Tabla: asignacion
-- =========================================================

CREATE TABLE IF NOT EXISTS asignacion (
    id_asignacion INT NOT NULL AUTO_INCREMENT,
    id_docente INT NOT NULL,
    id_grupo INT NOT NULL,
    id_periodo INT NOT NULL,
    estado TINYINT DEFAULT 1,

    PRIMARY KEY (id_asignacion),
    KEY idx_asignacion_docente (id_docente),
    KEY idx_asignacion_grupo (id_grupo),
    KEY idx_asignacion_periodo (id_periodo),

    CONSTRAINT fk_asignacion_docente
        FOREIGN KEY (id_docente)
        REFERENCES docente (id_docente),

    CONSTRAINT fk_asignacion_grupo
        FOREIGN KEY (id_grupo)
        REFERENCES grupo (id_grupo),

    CONSTRAINT fk_asignacion_periodo
        FOREIGN KEY (id_periodo)
        REFERENCES periodo_academico (id_periodo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Tabla: detalle_horario
-- =========================================================

CREATE TABLE IF NOT EXISTS detalle_horario (
    id_detalle INT NOT NULL AUTO_INCREMENT,
    id_asignacion INT NOT NULL,
    id_aula INT DEFAULT NULL,
    dia_semana ENUM(
        'LUNES',
        'MARTES',
        'MIERCOLES',
        'JUEVES',
        'VIERNES',
        'SABADO'
    ) DEFAULT NULL,
    hora_inicio TIME DEFAULT NULL,
    hora_fin TIME DEFAULT NULL,
    estado TINYINT DEFAULT 1,

    PRIMARY KEY (id_detalle),
    KEY idx_horario_asignacion (id_asignacion),
    KEY idx_horario_aula (id_aula),

    CONSTRAINT fk_horario_asignacion
        FOREIGN KEY (id_asignacion)
        REFERENCES asignacion (id_asignacion),

    CONSTRAINT fk_horario_aula
        FOREIGN KEY (id_aula)
        REFERENCES aula (id_aula)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Fin del esquema SGPA
-- =========================================================


