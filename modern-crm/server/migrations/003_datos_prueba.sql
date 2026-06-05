USE prueba1;
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tablas antes de insertar
TRUNCATE TABLE `crm_prospecto_sucursales`;
TRUNCATE TABLE `crm_prospecto_contactos`;
TRUNCATE TABLE `crm_prospectos`;

-- ======================================================
-- 1. PROSPECTOS DE PRUEBA
-- ======================================================

INSERT INTO `crm_prospectos` (
  `Prospecto_ID`, `Empresa_ID`, `Propietario_ID`, `Fuente_ID`,
  `Nombre_Prospecto`, `Nombre_Comercial_Empresa`, `Correo`, `Telefono`,
  `Tipo_Persona`, `Tiene_Sucursales`, `Estatus`, `Tipo_Inmueble`, `Notas`,
  `Calle`, `Num_Ext`, `Colonia`, `Municipio`, `CP`, `Estado`,
  `Lat`, `Lng`, `Coordenadas_Manuales`, `Dias_Disponibles`, `Horario`
) VALUES 
(1, 1, 1, 1, 
 'Roberto Méndez', 'Plaza Comercial Las Palmas', 'contacto@plazalaspalmas.mx', '9991234567',
 'Moral', 'Sí', 'Nuevo', 'Local', 'Requieren recolección en múltiples sucursales.',
 'Calle 60', '123', 'Centro', 'Mérida', '97000', 'Yucatán',
 20.9673, -89.6236, 1, 'Lun, Mie, Vie', '08:00 - 18:00'),

(2, 1, 1, 2, 
 'María López', 'Restaurante El Maizal', 'gerencia@elmaizal.mx', '9998887766',
 'Física', 'No', 'En seguimiento', 'Casa', 'Solo tienen un local, posible prospecto para RME.',
 'Avenida Paseo de Montejo', '456', 'Paseo de Montejo', 'Mérida', '97000', 'Yucatán',
 20.9850, -89.6180, 1, 'Mar, Jue', '10:00 - 22:00'),

(3, 1, 1, 3, 
 'Carlos Slim Helú', 'Corporativo Carso', 'contacto@carso.mx', '5551239988',
 'Moral', 'Sí', 'Cotizado', 'Oficinas', 'Cotización enviada la semana pasada.',
 'Prolongación Montejo', '789', 'Campestre', 'Mérida', '97120', 'Yucatán',
 21.0155, -89.6152, 1, 'Lun, Mar, Mie, Jue, Vie', '09:00 - 18:00');

-- ======================================================
-- 2. SUCURSALES DE PRUEBA
-- ======================================================

INSERT INTO `crm_prospecto_sucursales` (
  `Sucursal_ID`, `Prospecto_ID`, `Nombre_Sucursal`, `Correo_Electronico`, 
  `Telefono_Sucursal`, `Nombre_Responsable`, `Calle`, `Num_Ext`, `Colonia`, 
  `Municipio`, `CP`, `Estado`, `Lat`, `Lng`
) VALUES 
(1, 1, 'Sucursal Norte', 'norte@plazalaspalmas.mx', '9991112222', 'Juan Pérez',
 'Calle 50', '222', 'Altabrisa', 'Mérida', '97130', 'Yucatán', 21.0256, -89.5855),

(2, 1, 'Sucursal Poniente', 'poniente@plazalaspalmas.mx', '9993334444', 'Ana Gómez',
 'Avenida Canek', '888', 'Caucel', 'Mérida', '97314', 'Yucatán', 21.0068, -89.6702),

(3, 3, 'Torre A', 'torrea@carso.mx', '5551110000', 'Roberto Ruiz',
 'Prolongación Montejo', '789', 'Campestre', 'Mérida', '97120', 'Yucatán', 21.0155, -89.6152);

-- ======================================================
-- 3. CONTACTOS DE PRUEBA
-- ======================================================

INSERT INTO `crm_prospecto_contactos` (
  `Contacto_ID`, `Prospecto_ID`, `Nombre_Contacto`, `Correo`, 
  `Representante_Legal`, `Telefono`
) VALUES 
(1, 1, 'Luis Hernández', 'luis@plazalaspalmas.mx', 'Roberto Méndez', '9995556666'),
(2, 1, 'Carla Fernández (Contabilidad)', 'pagos@plazalaspalmas.mx', 'Roberto Méndez', '9997778888'),
(3, 3, 'Arturo Elías Ayub', 'arturo@carso.mx', 'Carlos Slim Helú', '5550001111');

SET FOREIGN_KEY_CHECKS = 1;
