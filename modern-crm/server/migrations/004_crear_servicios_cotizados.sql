-- ============================================================
--  MIGRACIÓN 004 — Crear tabla crm_servicios_cotizados
--  Ejecutar en MySQL Workbench
-- ============================================================

USE prueba1;

CREATE TABLE IF NOT EXISTS `crm_servicios_cotizados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trato_id` int(11) NOT NULL,
  `tipo_residuo` varchar(150) DEFAULT NULL,
  `frecuencia` varchar(100) DEFAULT NULL,
  `periodicidad_pago` varchar(50) DEFAULT NULL,
  `volumen_estimado` varchar(100) DEFAULT NULL,
  `precio_unitario` decimal(12,2) DEFAULT 0.00,
  `dias_asignados` varchar(255) DEFAULT NULL,
  `porcentaje_adicional` decimal(5,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `FK_Servicios_Trato` (`trato_id`),
  CONSTRAINT `FK_Servicios_Trato` FOREIGN KEY (`trato_id`) REFERENCES `crm_tratos` (`Trato_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
