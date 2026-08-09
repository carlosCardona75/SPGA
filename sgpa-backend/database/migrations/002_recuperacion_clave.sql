-- ============================================================
-- SGPA - Migración 002
-- Recuperación de contraseña sin correo (validación correo + cédula)
-- Ejecutar una sola vez sobre la base horarios_docentes.
-- Almacena tokens temporales de restablecimiento de contraseña.
-- ============================================================

USE horarios_docentes;

CREATE TABLE IF NOT EXISTS recuperacion_clave (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(64) NOT NULL,
    expira_en DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_recuperacion_token (token),
    CONSTRAINT fk_recuperacion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verificación final de la estructura.
DESCRIBE recuperacion_clave;
