-- ============================================================
--  MIGRACIÓN 002 — Tabla de archivos por prospecto (BLOB)
--  Ejecutar en MySQL Workbench DESPUÉS de la migración 001
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_prospecto_archivos (
  Archivo_ID      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  Prospecto_ID    INT(11)         NOT NULL,
  archivo_binario MEDIUMBLOB      NOT NULL,
  archivo_nombre  VARCHAR(255)    NOT NULL,
  archivo_peso    INT UNSIGNED    NOT NULL DEFAULT 0,
  archivo_tipo    VARCHAR(100)    NOT NULL DEFAULT 'application/octet-stream',
  Fecha_Subida    DATETIME        DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Archivo_ID),
  INDEX idx_prospecto (Prospecto_ID),
  CONSTRAINT fk_archivo_prospecto
    FOREIGN KEY (Prospecto_ID)
    REFERENCES crm_prospectos(Prospecto_ID)
    ON DELETE CASCADE
);

-- Verificar
SELECT 'Tabla crm_prospecto_archivos creada correctamente' AS resultado;
