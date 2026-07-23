-- ============================================================
-- SGPA - Migración 001
-- Módulo de autenticación y administración de usuarios
-- Ejecutar una sola vez sobre la base horarios_docentes.
-- No contiene contraseñas, hashes, tokens ni datos personales.
-- ============================================================

USE horarios_docentes;

-- Preparar los campos fundamentales de autenticación.
ALTER TABLE usuario
    MODIFY correo VARCHAR(100) NOT NULL,
    MODIFY password VARCHAR(255) NOT NULL,
    ADD COLUMN estado TINYINT NOT NULL DEFAULT 1
        AFTER id_docente,
    ADD COLUMN creado_en TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        AFTER estado,
    ADD UNIQUE KEY uq_usuario_docente (id_docente);

-- Agregar control de contraseñas temporales y auditoría.
ALTER TABLE usuario
    ADD COLUMN debe_cambiar_password TINYINT NOT NULL DEFAULT 0
        AFTER estado,
    ADD COLUMN password_actualizada_en TIMESTAMP NULL DEFAULT NULL
        AFTER debe_cambiar_password,
    ADD COLUMN ultimo_acceso TIMESTAMP NULL DEFAULT NULL
        AFTER creado_en;

-- Verificación final de la estructura.
DESCRIBE usuario;