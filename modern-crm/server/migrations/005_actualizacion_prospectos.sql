USE prueba1;
SET FOREIGN_KEY_CHECKS = 0;

-- ALTER TABLE `crm_prospectos`
--   DROP COLUMN `Periodicidad_Pago`,
--   DROP COLUMN `Monto`,
--   DROP COLUMN `Servicio`,
--   DROP COLUMN `Capacidad_Disponible`;

-- Agregar nuevas columnas
ALTER TABLE `crm_prospectos`
  ADD COLUMN `Tipo_Persona` VARCHAR(50) DEFAULT 'Moral' AFTER `Telefono`,
  ADD COLUMN `Tiene_Sucursales` VARCHAR(20) DEFAULT 'No' AFTER `Tipo_Persona`;

-- Crear tabla de sucursales
DROP TABLE IF EXISTS `crm_prospecto_sucursales`;
CREATE TABLE `crm_prospecto_sucursales` (
  `Sucursal_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Prospecto_ID` INT NOT NULL,
  `Nombre_Sucursal` VARCHAR(150) NOT NULL,
  `Correo_Electronico` VARCHAR(150) NOT NULL,
  `Telefono_Sucursal` VARCHAR(50) NOT NULL,
  `Nombre_Responsable` VARCHAR(150) NOT NULL,
  FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos`(`Prospecto_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de contactos
DROP TABLE IF EXISTS `crm_prospecto_contactos`;
CREATE TABLE `crm_prospecto_contactos` (
  `Contacto_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Prospecto_ID` INT NOT NULL,
  `Nombre_Contacto` VARCHAR(150) NOT NULL,
  `Correo` VARCHAR(150),
  `Representante_Legal` VARCHAR(150),
  `Telefono` VARCHAR(50),
  FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos`(`Prospecto_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
