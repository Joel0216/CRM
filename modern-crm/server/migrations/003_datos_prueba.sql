-- ================================================================
--  DATOS DE PRUEBA — CRM Ciclo Ambiental
--  Ejecutar en MySQL Workbench DESPUÉS del 000_RESET_COMPLETO.sql
--  y DESPUÉS de reiniciar el servidor Node.js
-- ================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;
DELETE FROM `crm_cotizaciones_borradores`;
DELETE FROM `interacciones`;
DELETE FROM `crm_servicios_cotizados`;
DELETE FROM `crm_tratos`;
DELETE FROM `crm_prospectos`;
DELETE FROM `empresas`;
ALTER TABLE `empresas` AUTO_INCREMENT = 1;
ALTER TABLE `crm_prospectos` AUTO_INCREMENT = 1;
ALTER TABLE `crm_tratos` AUTO_INCREMENT = 1;
ALTER TABLE `crm_servicios_cotizados` AUTO_INCREMENT = 1;
ALTER TABLE `interacciones` AUTO_INCREMENT = 1;
ALTER TABLE `crm_cotizaciones_borradores` AUTO_INCREMENT = 1;
SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ── EMPRESAS ─────────────────────────────────────────────────
INSERT INTO `empresas` (`Nombre_Empresa`, `RFC`, `Activo`) VALUES
  ('Industrias del Norte',       'IND900201CD2', 1),
  ('Grupo Residencial Mérida',   'GRM150330AB3', 1),
  ('Constructora Peñafiel',      'CPE800512XY1', 1),
  ('Oficinas Torre Sur',         'OTS201105ZZ9', 1),
  ('Fraccionamiento Las Palmas', 'FLP190820BC4', 1),
  ('Comercial Itzimná',          'CIT880304DE5', 1);

-- ── PROSPECTOS (con todos los campos del formulario) ──────────
--  Propietario_ID = 1 (usuario admin)
--  Fuente_ID:  1=Web Download, 2=Cold Call, 3=Online Store,
--              4=Advertisement, 5=Partner, 6=Seminar Partner, 7=External Referral
INSERT INTO `crm_prospectos` (
  `Empresa_ID`, `Propietario_ID`, `Fuente_ID`,
  `Nombre_Prospecto`, `Nombre_Comercial_Empresa`,
  `Correo`, `Telefono`, `Estatus`,
  `Tipo_Inmueble`, `Periodicidad_Pago`, `Monto`, `Servicio`, `Notas`,
  `Calle`, `Num_Ext`, `Num_Int`, `Colonia`, `Municipio`, `CP`, `Estado`,
  `Lat`, `Lng`, `Coordenadas_Manuales`,
  `Dias_Disponibles`, `Horario`, `Capacidad_Disponible`, `Ruta`,
  `Fecha_Creacion`
) VALUES
-- 1. Prospecto activo — Casa — Mensual
(3, 1, 1,
 'María García', 'Constructora Peñafiel',
 'mgarcia@penafiel.mx', '9991234567', 'Nuevo',
 'Casa', 'Mensual', 2500.00, 'RSU', 'Requiere visita técnica',
 'Calle 54', '200', NULL, 'Itzimná', 'Mérida', '97100', 'Yucatán',
 20.97650000, -89.62100000, 0,
 'Lun, Mie', '08:00 - 10:00', '100%', 'Ruta 1',
 NOW() - INTERVAL 3 DAY),

-- 2. Prospecto en seguimiento — Oficinas — Trimestral
(4, 1, 3,
 'Carlos Mendoza', 'Oficinas Torre Sur',
 'cmendoza@torresur.com', '9997654321', 'En seguimiento',
 'Oficinas', 'Trimestral', 8500.00, 'RME', 'Interesado en plan anual',
 'Calle 17', '455', 'Piso 3', 'García Ginerés', 'Mérida', '97070', 'Yucatán',
 20.98450000, -89.63200000, 0,
 'Mar, Jue', '14:00 - 16:00', '80%', 'Ruta 2',
 NOW() - INTERVAL 10 DAY),

-- 3. Prospecto cotizado — Condominio Público — Semestral
(5, 1, 5,
 'Ana Villanueva', 'Fraccionamiento Las Palmas',
 'avillanueva@laspalmas.mx', '9994561234', 'Cotizado',
 'Condominio Público', 'Semestral', 15000.00, 'RME', 'Pendiente firma de contrato',
 'Periférico Poniente', '1200', NULL, 'Altabrisa', 'Mérida', '97130', 'Yucatán',
 21.01200000, -89.65400000, 0,
 'Vie', '10:00 - 11:00', '50%', 'Ruta 3',
 NOW() - INTERVAL 15 DAY),

-- 4. Prospecto nuevo — Local — Anual
(6, 1, 2,
 'Roberto Castillo', 'Comercial Itzimná',
 'rcastillo@comitzimna.mx', '9998765432', 'Nuevo',
 'Local', 'Anual', 6000.00, 'RSU', NULL,
 'Calle 21', '150', NULL, 'Itzimná', 'Mérida', '97100', 'Yucatán',
 20.97800000, -89.61900000, 0,
 'Lun, Mie, Vie', '08:00 - 12:00', '90%', 'Ruta 1',
 NOW() - INTERVAL 2 DAY),

-- 5. Prospecto nuevo — Condominio Privado — Mensual
(2, 1, 7,
 'Sofía Ramírez', 'Grupo Residencial Mérida',
 'sramirez@grm.mx', '9993216547', 'Nuevo',
 'Condominio Privado', 'Mensual', 4200.00, 'RSU', 'Referido por cliente existente',
 'Calle 60 Norte', '500', NULL, 'Montebello', 'Mérida', '97113', 'Yucatán',
 21.02100000, -89.61500000, 0,
 'Mar, Jue', '10:00 - 12:00', '100%', 'Ruta 4',
 NOW() - INTERVAL 1 DAY),

-- 6. Prospecto en seguimiento — Casa — Trimestral
(3, 1, 4,
 'Jorge Herrera', 'Constructora Peñafiel',
 'jherrera@penafiel.mx', '9996543210', 'En seguimiento',
 'Casa', 'Trimestral', 3200.00, 'RME', 'Segunda visita programada',
 'Calle 35', '318', NULL, 'García Ginerés', 'Mérida', '97070', 'Yucatán',
 20.98100000, -89.63800000, 0,
 'Sab', '14:00 - 18:00', '60%', 'Ruta 2',
 NOW() - INTERVAL 7 DAY);

-- ── TRATOS vinculados a los prospectos ───────────────────────
--  Fase_ID: 1=Qualification, 2=Needs Analysis, 3=Value Proposition,
--           4=Negotiation/Review, 5=Closed Won, 6=Closed Lost
INSERT INTO `crm_tratos` (
  `Prospecto_ID`, `Propietario_ID`, `Nombre_Trato`,
  `Importe`, `Fase_ID`, `Fecha_Cierre_Estimada`, `Fecha_Creacion`
) VALUES
-- Trato del prospecto 1 (María García)
(1, 1, 'Contrato Recolección Constructora Peñafiel',
 2500.00, 2, DATE_ADD(CURDATE(), INTERVAL 30 DAY), NOW() - INTERVAL 2 DAY),

-- Trato del prospecto 2 (Carlos Mendoza)
(2, 1, 'Tratamiento Aguas Torre Sur',
 8500.00, 3, DATE_ADD(CURDATE(), INTERVAL 15 DAY), NOW() - INTERVAL 8 DAY),

-- Trato del prospecto 3 (Ana Villanueva) — en negociación
(3, 1, 'Consultoría Ambiental Fraccionamiento',
 15000.00, 4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), NOW() - INTERVAL 14 DAY),

-- Trato del prospecto 5 (Sofía Ramírez)
(5, 1, 'Servicio Mensual Montebello',
 4200.00, 1, DATE_ADD(CURDATE(), INTERVAL 45 DAY), NOW() - INTERVAL 1 DAY),

-- Trato del prospecto 6 (Jorge Herrera)
(6, 1, 'Consultoría Trimestral García Ginerés',
 3200.00, 2, DATE_ADD(CURDATE(), INTERVAL 20 DAY), NOW() - INTERVAL 5 DAY);

-- ── INTERACCIONES / SEGUIMIENTO ───────────────────────────────
INSERT INTO `interacciones` (
  `Prospecto_ID`, `Usuario_ID`, `Tipo`, `Detalle_Notas`, `Fecha_Interaccion`
) VALUES
(1, 1, 'Llamada',         'Primera llamada de contacto. Interesada en el servicio mensual.', NOW() - INTERVAL 3 DAY),
(1, 1, 'Correo',          'Se envió propuesta de servicio por correo.',                      NOW() - INTERVAL 2 DAY),
(2, 1, 'Reunión Presencial', 'Visita a las instalaciones. Confirmaron necesidad de tratamiento.', NOW() - INTERVAL 9 DAY),
(2, 1, 'Videollamada',    'Revisión de propuesta técnica con gerente.',                      NOW() - INTERVAL 5 DAY),
(3, 1, 'Llamada',         'Llamada para seguimiento de propuesta.',                          NOW() - INTERVAL 13 DAY),
(5, 1, 'WhatsApp',        'Contacto inicial por referido. Solicitan visita.',                NOW() - INTERVAL 1 DAY);

-- ── SERVICIOS COTIZADOS ─────────────────────────────────────────
INSERT INTO `crm_servicios_cotizados` (
  `trato_id`, `tipo_residuo`, `frecuencia`, `periodicidad_pago`,
  `volumen_estimado`, `precio_unitario`, `dias_asignados`, `porcentaje_adicional`
) VALUES
(1, 'RSU', 'Semanal', 'Mensual', '1', 1500.00, 'Lunes,Miércoles', 0.00),
(2, 'RME', 'Quincenal', 'Trimestral', '2', 2500.00, 'Martes', 10.00),
(3, 'RSU', 'Mensual', 'Semestral', '1', 800.00, 'Viernes', 0.00),
(4, 'RSU', 'Semanal', 'Mensual', '3', 1200.00, 'Lunes', 5.00),
(5, 'RME', 'Bimestral', 'Trimestral', '1', 3000.00, 'Jueves', 0.00);

-- ── VERIFICACIÓN FINAL ────────────────────────────────────────
SELECT 'Empresas:'    as tabla, COUNT(*) as total FROM empresas      UNION ALL
SELECT 'Prospectos:', COUNT(*) FROM crm_prospectos                   UNION ALL
SELECT 'Tratos:',     COUNT(*) FROM crm_tratos                       UNION ALL
SELECT 'Clientes:',   COUNT(*) FROM clientes                         UNION ALL
SELECT 'Interacc.:',  COUNT(*) FROM interacciones                    UNION ALL
SELECT 'Serv. Cotiz.:', COUNT(*) FROM crm_servicios_cotizados;
