-- ================================================================
--  RESET COMPLETO + RECONSTRUCCIÓN DE LA BASE DE DATOS
--  Base de datos: prueba1  |  MariaDB 10.4
--  Ejecutar COMPLETO en MySQL Workbench
-- ================================================================

USE prueba1;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. ELIMINAR TODAS LAS TABLAS EXISTENTES ───────────────────
DROP TABLE IF EXISTS `crm_cotizaciones_borradores`;
DROP TABLE IF EXISTS `crm_prospecto_archivos`;
DROP TABLE IF EXISTS `crm_tareas_seguimiento`;
DROP TABLE IF EXISTS `tareas_seguimiento`;
DROP TABLE IF EXISTS `crm_agenda_eventos`;
DROP TABLE IF EXISTS `crm_encuestas_satisfaccion`;
DROP TABLE IF EXISTS `crm_servicios_cotizados`;
DROP TABLE IF EXISTS `crm_tratos`;
DROP TABLE IF EXISTS `oportunidades_negocio`;
DROP TABLE IF EXISTS `prospecto_necesidades`;
DROP TABLE IF EXISTS `interacciones`;
DROP TABLE IF EXISTS `crm_prospecto_sucursales`;
DROP TABLE IF EXISTS `crm_prospecto_contactos`;
DROP TABLE IF EXISTS `crm_prospectos`;
DROP TABLE IF EXISTS `prospectos`;
DROP TABLE IF EXISTS `clientes`;
DROP TABLE IF EXISTS `empresas`;
DROP TABLE IF EXISTS `crm_fuentes_prospecto`;
DROP TABLE IF EXISTS `crm_fases_trato`;
DROP TABLE IF EXISTS `permisos`;
DROP TABLE IF EXISTS `usuarios_roles`;
DROP TABLE IF EXISTS `sesiones`;
DROP TABLE IF EXISTS `auditoria`;
DROP TABLE IF EXISTS `servicios_ambientales`;
DROP TABLE IF EXISTS `configuraciones`;
DROP TABLE IF EXISTS `acciones`;
DROP TABLE IF EXISTS `modulos`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `perfiles`;
DROP TABLE IF EXISTS `departamentos`;
DROP TABLE IF EXISTS `sucursales`;
DROP TABLE IF EXISTS `usuarios`;

SET FOREIGN_KEY_CHECKS = 1;

-- ── 2. TABLAS BASE (sin dependencias) ─────────────────────────

CREATE TABLE `crm_fuentes_prospecto` (
  `Fuente_ID`     int(11)      NOT NULL AUTO_INCREMENT,
  `Nombre_Fuente` varchar(50)  NOT NULL,
  PRIMARY KEY (`Fuente_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `crm_fuentes_prospecto` VALUES
  (1,'Web Download'),(2,'Cold Call'),(3,'Online Store'),
  (4,'Advertisement'),(5,'Partner'),(6,'Seminar Partner'),(7,'External Referral');

-- ────────────────────────────────────────────────────────────────
CREATE TABLE `crm_fases_trato` (
  `Fase_ID`                int(11)     NOT NULL AUTO_INCREMENT,
  `Nombre_Fase`            varchar(50) NOT NULL,
  `Afecta_Ingreso_Estimado` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`Fase_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `crm_fases_trato` VALUES
  (1,'Qualification',1),(2,'Needs Analysis',1),(3,'Value Proposition',1),
  (4,'Negotiation/Review',1),(5,'Closed Won',1),(6,'Closed Lost',0);

-- ────────────────────────────────────────────────────────────────
CREATE TABLE `departamentos` (
  `Depto_ID`     int(11)      NOT NULL AUTO_INCREMENT,
  `Nombre_Depto` varchar(100) NOT NULL,
  PRIMARY KEY (`Depto_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `departamentos` VALUES (1,'Ventas'),(2,'Operaciones'),(3,'Administración');

-- ────────────────────────────────────────────────────────────────
CREATE TABLE `perfiles` (
  `Perfil_ID`    int(11)     NOT NULL AUTO_INCREMENT,
  `Nombre_Perfil` varchar(50) NOT NULL,
  PRIMARY KEY (`Perfil_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `perfiles` VALUES (1,'Administrador'),(2,'Vendedor'),(3,'Solo Lectura');

-- ────────────────────────────────────────────────────────────────
CREATE TABLE `roles` (
  `Rol_ID`    int(11)     NOT NULL AUTO_INCREMENT,
  `Nombre_Rol` varchar(50) NOT NULL,
  PRIMARY KEY (`Rol_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` VALUES (1,'admin'),(2,'vendedor'),(3,'viewer');

-- ────────────────────────────────────────────────────────────────
CREATE TABLE `sucursales` (
  `Sucursal_ID`    int(11)      NOT NULL AUTO_INCREMENT,
  `Nombre_Sucursal` varchar(100) NOT NULL,
  `Ciudad`          varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Sucursal_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sucursales` VALUES (1,'Mérida','Mérida, Yucatán');

-- ────────────────────────────────────────────────────────────────
CREATE TABLE `servicios_ambientales` (
  `Servicio_ID`   int(11)        NOT NULL AUTO_INCREMENT,
  `Nombre`        varchar(150)   NOT NULL,
  `Descripcion`   text           DEFAULT NULL,
  `Precio_Base`   decimal(12,2)  NOT NULL DEFAULT 0.00,
  `Activo`        tinyint(1)     DEFAULT 1,
  PRIMARY KEY (`Servicio_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `servicios_ambientales` VALUES
  (1,'Recolección Residuos Sólidos',NULL,1500.00,1),
  (2,'Tratamiento de Aguas Residuales',NULL,3500.00,1),
  (3,'Consultoría Ambiental',NULL,5000.00,1);

-- ────────────────────────────────────────────────────────────────
CREATE TABLE `configuraciones` (
  `Config_ID` int(11)      NOT NULL AUTO_INCREMENT,
  `Clave`     varchar(100) DEFAULT NULL,
  `Valor`     text         DEFAULT NULL,
  PRIMARY KEY (`Config_ID`),
  UNIQUE KEY `UQ_Config_Clave` (`Clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. USUARIOS ───────────────────────────────────────────────
CREATE TABLE `usuarios` (
  `Usuario_ID`     int(11)      NOT NULL AUTO_INCREMENT,
  `Nombre`         varchar(150) NOT NULL,
  `Apellido`       varchar(150) DEFAULT NULL,
  `Correo`         varchar(150) NOT NULL,
  `Password_Hash`  varchar(255) NOT NULL,
  `Rol`            varchar(50)  DEFAULT 'vendedor',
  `Activo`         tinyint(1)   DEFAULT 1,
  `Fecha_Creacion` datetime     DEFAULT current_timestamp(),
  PRIMARY KEY (`Usuario_ID`),
  UNIQUE KEY `UQ_Usuario_Correo` (`Correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` VALUES
  (1,'Administrador','Sistema','admin@cicloambiental.mx',
   '$2b$10$placeholder_hash_admin','admin',1,NOW());

-- ── 4. EMPRESAS ───────────────────────────────────────────────
CREATE TABLE `empresas` (
  `Empresa_ID`     int(11)      NOT NULL AUTO_INCREMENT,
  `Nombre_Empresa` varchar(150) NOT NULL,
  `RFC`            varchar(20)  DEFAULT NULL,
  `Activo`         tinyint(1)   DEFAULT 1,
  `Fecha_Creacion` datetime     DEFAULT current_timestamp(),
  PRIMARY KEY (`Empresa_ID`),
  UNIQUE KEY `UQ_Empresa_RFC` (`RFC`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `empresas` VALUES
  (1,'EcoSales CRM','ECO001',1,NOW()),
  (2,'GreenTech Solutions','GRE002',1,NOW());

-- ── 5. CLIENTES ───────────────────────────────────────────────
CREATE TABLE `clientes` (
  `Cliente_ID` int(11)      NOT NULL AUTO_INCREMENT,
  `Empresa_ID` int(11)      NOT NULL,
  `Nombre`     varchar(150) NOT NULL,
  `Correo`     varchar(150) DEFAULT NULL,
  `Telefono`   varchar(30)  DEFAULT NULL,
  `Activo`     tinyint(1)   DEFAULT 1,
  PRIMARY KEY (`Cliente_ID`),
  KEY `FK_Clientes_Empresa` (`Empresa_ID`),
  CONSTRAINT `FK_Clientes_Empresa`
    FOREIGN KEY (`Empresa_ID`) REFERENCES `empresas` (`Empresa_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `clientes` VALUES
  (1,1,'Cliente Uno','cliente1@mail.com','9991112233',1),
  (2,2,'Cliente Dos','cliente2@mail.com','9992223344',1),
  (3,1,'Cliente Tres','cliente3@mail.com','9993334455',1),
  (4,1,'Cliente Cuatro','cliente4@mail.com','9994445566',1),
  (5,2,'Cliente Cinco','cliente5@mail.com','5551112233',1);

-- ── 6. CRM_PROSPECTOS (con TODOS los campos del frontend) ─────
CREATE TABLE `crm_prospectos` (
  `Prospecto_ID`            int(11)       NOT NULL AUTO_INCREMENT,
  `Empresa_ID`              int(11)       NOT NULL,
  `Propietario_ID`          int(11)       NOT NULL DEFAULT 1,
  `Fuente_ID`               int(11)       DEFAULT 1,
  -- Datos de contacto
  `Nombre_Prospecto`        varchar(150)  NOT NULL,
  `Nombre_Comercial_Empresa` varchar(150) NOT NULL,
  `Correo`                  varchar(150)  DEFAULT NULL,
  `Telefono`                varchar(30)   DEFAULT NULL,
  -- Clasificación
  `Tipo_Persona`            varchar(50)   DEFAULT 'Moral',
  `Tiene_Sucursales`        varchar(20)   DEFAULT 'No',
  `Estatus`                 varchar(50)   NOT NULL DEFAULT 'Nuevo',
  `Tipo_Inmueble`           varchar(50)   DEFAULT NULL
                            COMMENT 'Casa / Condominio Público / Condominio Privado / Oficinas / Local',
  `Notas`                   text          DEFAULT NULL,
  -- Dirección
  `Calle`                   varchar(150)  DEFAULT NULL,
  `Num_Ext`                 varchar(20)   DEFAULT NULL,
  `Num_Int`                 varchar(20)   DEFAULT NULL,
  `Colonia`                 varchar(100)  DEFAULT NULL,
  `Municipio`               varchar(100)  DEFAULT NULL,
  `CP`                      varchar(10)   DEFAULT NULL,
  `Estado`                  varchar(100)  DEFAULT NULL,
  -- Coordenadas
  `Lat`                     decimal(10,8) DEFAULT NULL,
  `Lng`                     decimal(11,8) DEFAULT NULL,
  `Coordenadas_Manuales`    tinyint(1)    NOT NULL DEFAULT 0,
  -- Operaciones
  `Dias_Disponibles`        varchar(150)  DEFAULT NULL,
  `Horario`                 varchar(100)  DEFAULT NULL,
  `Ruta`                    varchar(100)  DEFAULT NULL,
  -- Fotos
  `Foto_Comprobante`        LONGBLOB      DEFAULT NULL,
  `Foto_Fachada`            LONGBLOB      DEFAULT NULL,
  -- Timestamps
  `Fecha_Creacion`          datetime      DEFAULT current_timestamp(),
  PRIMARY KEY (`Prospecto_ID`),
  KEY `KEY_CRM_Prospectos_Empresa`     (`Empresa_ID`),
  KEY `KEY_CRM_Prospectos_Propietario` (`Propietario_ID`),
  KEY `KEY_CRM_Prospectos_Fuente`      (`Fuente_ID`),
  CONSTRAINT `FK_CRM_Prospectos_Empresa`
    FOREIGN KEY (`Empresa_ID`) REFERENCES `empresas` (`Empresa_ID`) ON UPDATE CASCADE,
  CONSTRAINT `FK_CRM_Prospectos_Fuente`
    FOREIGN KEY (`Fuente_ID`) REFERENCES `crm_fuentes_prospecto` (`Fuente_ID`) ON DELETE SET NULL,
  CONSTRAINT `FK_CRM_Prospectos_Propietario`
    FOREIGN KEY (`Propietario_ID`) REFERENCES `usuarios` (`Usuario_ID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6.1 SUCURSALES Y CONTACTOS ────────────────────────────────
CREATE TABLE `crm_prospecto_sucursales` (
  `Sucursal_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Prospecto_ID` INT NOT NULL,
  `Nombre_Sucursal` VARCHAR(150) NOT NULL,
  `Correo_Electronico` VARCHAR(150) NOT NULL,
  `Telefono_Sucursal` VARCHAR(50) NOT NULL,
  `Nombre_Responsable` VARCHAR(150) NOT NULL,
  -- Dirección
  `Calle` VARCHAR(150) DEFAULT NULL,
  `Num_Ext` VARCHAR(20) DEFAULT NULL,
  `Num_Int` VARCHAR(20) DEFAULT NULL,
  `Colonia` VARCHAR(100) DEFAULT NULL,
  `Municipio` VARCHAR(100) DEFAULT NULL,
  `CP` VARCHAR(10) DEFAULT NULL,
  `Estado` VARCHAR(100) DEFAULT NULL,
  `Lat` DECIMAL(10,8) DEFAULT NULL,
  `Lng` DECIMAL(11,8) DEFAULT NULL,
  -- Fotos
  `Foto_Comprobante` LONGBLOB DEFAULT NULL,
  `Foto_Fachada` LONGBLOB DEFAULT NULL,
  FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos`(`Prospecto_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `crm_prospecto_contactos` (
  `Contacto_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Prospecto_ID` INT NOT NULL,
  `Nombre_Contacto` VARCHAR(150) NOT NULL,
  `Correo` VARCHAR(150),
  `Representante_Legal` VARCHAR(150),
  `Telefono` VARCHAR(50),
  FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos`(`Prospecto_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. ARCHIVOS (BLOB) por prospecto ──────────────────────────
CREATE TABLE `crm_prospecto_archivos` (
  `Archivo_ID`      int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `Prospecto_ID`    int(11)          NOT NULL,
  `archivo_binario` MEDIUMBLOB       NOT NULL,
  `archivo_nombre`  varchar(255)     NOT NULL,
  `archivo_peso`    int(11) UNSIGNED NOT NULL DEFAULT 0,
  `archivo_tipo`    varchar(100)     NOT NULL DEFAULT 'application/octet-stream',
  `Fecha_Subida`    datetime         DEFAULT current_timestamp(),
  PRIMARY KEY (`Archivo_ID`),
  KEY `idx_archivos_prospecto` (`Prospecto_ID`),
  CONSTRAINT `FK_Archivos_Prospecto`
    FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos` (`Prospecto_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. CRM_TRATOS ─────────────────────────────────────────────
CREATE TABLE `crm_tratos` (
  `Trato_ID`             int(11)       NOT NULL AUTO_INCREMENT,
  `Prospecto_ID`         int(11)       DEFAULT NULL,
  `Cliente_ID`           int(11)       DEFAULT NULL,
  `Propietario_ID`       int(11)       NOT NULL DEFAULT 1,
  `Nombre_Trato`         varchar(150)  NOT NULL,
  `Importe`              decimal(12,2) NOT NULL DEFAULT 0.00,
  `Fase_ID`              int(11)       NOT NULL DEFAULT 1,
  `Fecha_Cierre_Estimada` date         NOT NULL DEFAULT (CURDATE()),
  `Promesa_Pago_Cobranza` tinyint(1)  DEFAULT 0,
  `Fecha_Creacion`       datetime      DEFAULT current_timestamp(),
  `Fecha_Modificacion`   datetime      DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`Trato_ID`),
  KEY `KEY_CRM_Tratos_Prospecto` (`Prospecto_ID`),
  KEY `KEY_CRM_Tratos_Cliente`   (`Cliente_ID`),
  KEY `KEY_CRM_Tratos_Fase`      (`Fase_ID`),
  CONSTRAINT `FK_CRM_Tratos_Cliente`
    FOREIGN KEY (`Cliente_ID`) REFERENCES `clientes` (`Cliente_ID`) ON DELETE SET NULL,
  CONSTRAINT `FK_CRM_Tratos_Fase`
    FOREIGN KEY (`Fase_ID`) REFERENCES `crm_fases_trato` (`Fase_ID`) ON UPDATE CASCADE,
  CONSTRAINT `FK_CRM_Tratos_Prospecto`
    FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos` (`Prospecto_ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. INTERACCIONES / SEGUIMIENTO ────────────────────────────
CREATE TABLE `interacciones` (
  `Interaccion_ID`   bigint(20)  NOT NULL AUTO_INCREMENT,
  `Prospecto_ID`     int(11)     NOT NULL,
  `Usuario_ID`       int(11)     NOT NULL DEFAULT 1,
  `Tipo`             enum('Llamada','Correo','Reunión Presencial','Videollamada','WhatsApp') NOT NULL,
  `Detalle_Notas`    text        NOT NULL,
  `Fecha_Interaccion` datetime   DEFAULT current_timestamp(),
  PRIMARY KEY (`Interaccion_ID`),
  KEY `FK_Inter_Prospecto` (`Prospecto_ID`),
  CONSTRAINT `FK_Inter_Prospecto`
    FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos` (`Prospecto_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. SERVICIOS COTIZADOS ──────────────────────────────────────
CREATE TABLE `crm_servicios_cotizados` (
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

-- ── 11. BORRADORES DE COTIZACIÓN ───────────────────────────────
CREATE TABLE `crm_cotizaciones_borradores` (
  `Borrador_ID`          int(11)       NOT NULL AUTO_INCREMENT,
  `Prospecto_ID`         int(11)       NOT NULL,
  `Datos_Borrador`       LONGTEXT      NOT NULL,
  `Fecha_Creacion`       datetime      DEFAULT current_timestamp(),
  PRIMARY KEY (`Borrador_ID`),
  KEY `FK_Borrador_Prospecto` (`Prospecto_ID`),
  CONSTRAINT `FK_Borrador_Prospecto` FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos` (`Prospecto_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12. VERIFICAR RESULTADO ───────────────────────────────────
SELECT
  TABLE_NAME,
  TABLE_ROWS,
  ENGINE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;
