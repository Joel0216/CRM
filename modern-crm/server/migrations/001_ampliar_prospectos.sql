-- ============================================================
--  MIGRACIÓN 001 — Ampliar crm_prospectos
--  Ejecutar en MySQL Workbench / phpMyAdmin / CLI
-- ============================================================

USE prueba1;

-- 1. Convertir Estatus de ENUM rígido a VARCHAR flexible
--    para admitir: Nuevo, En seguimiento, Cotizado, Adeudo, Inactivo
ALTER TABLE crm_prospectos
  MODIFY COLUMN Estatus VARCHAR(50) NOT NULL DEFAULT 'Nuevo';

-- 2. Agregar columnas faltantes (campos del formulario del frontend)
ALTER TABLE crm_prospectos
  ADD COLUMN Tipo_Inmueble   VARCHAR(50)      NULL COMMENT 'Casa / Condominio Público / Condominio Privado / Oficinas / Local',
  ADD COLUMN Periodicidad_Pago VARCHAR(20)    NULL COMMENT 'Mensual / Trimestral / Semestral / Anual',
  ADD COLUMN Monto           DECIMAL(12,2)    NOT NULL DEFAULT 0.00 COMMENT 'Monto estimado en MXN',
  ADD COLUMN Servicio        VARCHAR(255)     NULL,
  ADD COLUMN Notas           TEXT             NULL,
  ADD COLUMN Calle           VARCHAR(150)     NULL,
  ADD COLUMN Num_Ext         VARCHAR(20)      NULL,
  ADD COLUMN Num_Int         VARCHAR(20)      NULL,
  ADD COLUMN Colonia         VARCHAR(100)     NULL,
  ADD COLUMN Municipio       VARCHAR(100)     NULL,
  ADD COLUMN CP              VARCHAR(10)      NULL,
  ADD COLUMN Estado          VARCHAR(100)     NULL,
  ADD COLUMN Lat             DECIMAL(10,8)    NULL,
  ADD COLUMN Lng             DECIMAL(11,8)    NULL,
  ADD COLUMN Coordenadas_Manuales TINYINT(1)  NOT NULL DEFAULT 0,
  ADD COLUMN Dias_Disponibles VARCHAR(150)    NULL,
  ADD COLUMN Horario         VARCHAR(100)     NULL,
  ADD COLUMN Capacidad_Disponible VARCHAR(100) NULL,
  ADD COLUMN Ruta            VARCHAR(100)     NULL,
  ADD COLUMN Foto_Comprobante LONGTEXT        NULL,
  ADD COLUMN Foto_Fachada    LONGTEXT         NULL;

-- 3. Verificar resultado
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_NAME = 'crm_prospectos'
ORDER BY ORDINAL_POSITION;
