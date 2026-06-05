-- ================================================================
-- MIGRACIÓN 006 — Stored Procedures para crm_prospectos
-- Motor : MySQL / MariaDB 10.4
-- Base  : prueba1
-- Ejecutar COMPLETO en MySQL Workbench
--
-- Tablas involucradas (del RESET_COMPLETO / migraciones 000-005):
--   crm_prospectos            → tabla principal
--   crm_prospecto_sucursales  → sucursales del prospecto
--   crm_prospecto_contactos   → contactos del prospecto
--   empresas                  → FK Empresa_ID
--   usuarios                  → FK Propietario_ID
--   crm_fuentes_prospecto     → FK Fuente_ID
--
-- Campos con NOT NULL / obligatorios detectados del esquema:
--   Nombre_Prospecto        VARCHAR(150)  NOT NULL
--   Nombre_Comercial_Empresa VARCHAR(150) NOT NULL
--   Empresa_ID              INT           NOT NULL (FK)
--   Propietario_ID          INT           NOT NULL DEFAULT 1
--   Estatus                 VARCHAR(50)   NOT NULL DEFAULT 'Nuevo'
--   Coordenadas_Manuales    TINYINT(1)    NOT NULL DEFAULT 0
--
-- Campos opcionales (DEFAULT NULL):
--   Correo, Telefono, Tipo_Persona, Tiene_Sucursales,
--   Tipo_Inmueble, Notas, Calle, Num_Ext, Num_Int,
--   Colonia, Municipio, CP, Estado, Lat, Lng,
--   Dias_Disponibles, Horario, Ruta,
--   Foto_Comprobante (LONGBLOB), Foto_Fachada (LONGBLOB)
--
-- Catálogos de Estatus válidos (usados en el frontend):
--   'Nuevo', 'En seguimiento', 'Cotizado', 'Adeudo', 'Inactivo'
-- ================================================================

USE prueba1;

-- ── Eliminar SPs anteriores (recreación limpia) ──────────────────
DROP PROCEDURE IF EXISTS SP_Prospectos_Insert;
DROP PROCEDURE IF EXISTS SP_Prospectos_Update;
DROP PROCEDURE IF EXISTS SP_Prospectos_Select;
DROP PROCEDURE IF EXISTS SP_Prospectos_Delete;

DELIMITER $$

-- ════════════════════════════════════════════════════════════════
-- SP 1: SP_Prospectos_Insert
--
-- Parámetros OUT:
--   p_nuevo_id  → Prospecto_ID generado (NULL si hubo error)
--   p_resultado → 0=OK | código negativo=error
--   p_mensaje   → texto legible del resultado o del error
--
-- Códigos de error:
--   -1  Nombre_Prospecto vacío
--   -2  Nombre_Comercial_Empresa vacío
--   -3  Empresa_ID inválido (0 o NULL)
--   -4  Empresa no existe en la tabla empresas
--   -5  Correo duplicado en crm_prospectos
--   -6  Estatus fuera del catálogo permitido
--   -99 Error SQL inesperado (SQLEXCEPTION)
-- ════════════════════════════════════════════════════════════════
CREATE PROCEDURE SP_Prospectos_Insert(
    IN  p_Empresa_ID               INT,
    IN  p_Propietario_ID           INT,
    IN  p_Fuente_ID                INT,
    IN  p_Nombre_Prospecto         VARCHAR(150),
    IN  p_Nombre_Comercial_Empresa VARCHAR(150),
    IN  p_Correo                   VARCHAR(150),
    IN  p_Telefono                 VARCHAR(30),
    IN  p_Tipo_Persona             VARCHAR(50),
    IN  p_Tiene_Sucursales         VARCHAR(20),
    IN  p_Estatus                  VARCHAR(50),
    IN  p_Tipo_Inmueble            VARCHAR(50),
    IN  p_Notas                    TEXT,
    IN  p_Calle                    VARCHAR(150),
    IN  p_Num_Ext                  VARCHAR(20),
    IN  p_Num_Int                  VARCHAR(20),
    IN  p_Colonia                  VARCHAR(100),
    IN  p_Municipio                VARCHAR(100),
    IN  p_CP                       VARCHAR(10),
    IN  p_Estado                   VARCHAR(100),
    IN  p_Dias_Disponibles         VARCHAR(150),
    IN  p_Horario                  VARCHAR(100),
    IN  p_Ruta                     VARCHAR(100),
    OUT p_nuevo_id                 INT,
    OUT p_resultado                INT,
    OUT p_mensaje                  VARCHAR(500)
)
SP_Prospectos_Insert: BEGIN

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_mensaje = MESSAGE_TEXT;
        SET p_resultado = -99;
        SET p_nuevo_id  = NULL;
        SET p_mensaje   = CONCAT('Error SQL inesperado: ', IFNULL(p_mensaje, 'desconocido'));
    END;

    -- Valores por defecto de las salidas
    SET p_nuevo_id  = NULL;
    SET p_resultado = -99;
    SET p_mensaje   = 'Sin procesar';

    -- ── VALIDACIÓN 1: Nombre_Prospecto obligatorio ────────────────
    IF NULLIF(TRIM(IFNULL(p_Nombre_Prospecto,'')), '') IS NULL THEN
        SET p_resultado = -1;
        SET p_mensaje   = 'El Nombre del Prospecto es obligatorio y no puede estar vacío.';
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── VALIDACIÓN 2: Nombre_Comercial_Empresa obligatorio ────────
    IF NULLIF(TRIM(IFNULL(p_Nombre_Comercial_Empresa,'')), '') IS NULL THEN
        SET p_resultado = -2;
        SET p_mensaje   = 'El Nombre Comercial de la Empresa es obligatorio.';
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── VALIDACIÓN 3: Empresa_ID debe ser > 0 ─────────────────────
    IF IFNULL(p_Empresa_ID, 0) <= 0 THEN
        SET p_resultado = -3;
        SET p_mensaje   = 'Debe indicar un Empresa_ID válido (número mayor que 0).';
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── VALIDACIÓN 4: La empresa debe existir ─────────────────────
    IF NOT EXISTS (SELECT 1 FROM empresas WHERE Empresa_ID = p_Empresa_ID LIMIT 1) THEN
        SET p_resultado = -4;
        SET p_mensaje   = CONCAT('La Empresa con ID ', p_Empresa_ID, ' no existe en el sistema.');
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── VALIDACIÓN 5: Correo único (si se capturó) ────────────────
    IF p_Correo IS NOT NULL AND TRIM(p_Correo) != '' THEN
        IF EXISTS (
            SELECT 1 FROM crm_prospectos
            WHERE Correo = TRIM(p_Correo) LIMIT 1
        ) THEN
            SET p_resultado = -5;
            SET p_mensaje   = CONCAT('Ya existe un prospecto registrado con el correo: ', TRIM(p_Correo));
            LEAVE SP_Prospectos_Insert;
        END IF;
    END IF;

    -- ── VALIDACIÓN 6: Estatus en catálogo ─────────────────────────
    IF p_Estatus IS NOT NULL AND p_Estatus NOT IN (
        'Nuevo','En seguimiento','Cotizado','Adeudo','Inactivo'
    ) THEN
        SET p_resultado = -6;
        SET p_mensaje   = CONCAT('El Estatus "', IFNULL(p_Estatus,'(vacío)'), '" no es válido. Use: Nuevo, En seguimiento, Cotizado, Adeudo, Inactivo.');
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── INSERT ────────────────────────────────────────────────────
    INSERT INTO crm_prospectos (
        Empresa_ID,
        Propietario_ID,
        Fuente_ID,
        Nombre_Prospecto,
        Nombre_Comercial_Empresa,
        Correo,
        Telefono,
        Tipo_Persona,
        Tiene_Sucursales,
        Estatus,
        Tipo_Inmueble,
        Notas,
        Calle,
        Num_Ext,
        Num_Int,
        Colonia,
        Municipio,
        CP,
        Estado,
        Dias_Disponibles,
        Horario,
        Ruta,
        Coordenadas_Manuales,
        Fecha_Creacion
    )
    VALUES (
        p_Empresa_ID,
        IFNULL(p_Propietario_ID, 1),
        IFNULL(p_Fuente_ID, 1),
        TRIM(p_Nombre_Prospecto),
        TRIM(p_Nombre_Comercial_Empresa),
        NULLIF(TRIM(IFNULL(p_Correo,'')), ''),
        NULLIF(TRIM(IFNULL(p_Telefono,'')), ''),
        IFNULL(NULLIF(TRIM(IFNULL(p_Tipo_Persona,'')),''), 'Moral'),
        IFNULL(NULLIF(TRIM(IFNULL(p_Tiene_Sucursales,'')),''), 'No'),
        IFNULL(NULLIF(TRIM(IFNULL(p_Estatus,'')),''), 'Nuevo'),
        NULLIF(TRIM(IFNULL(p_Tipo_Inmueble,'')), ''),
        NULLIF(TRIM(IFNULL(p_Notas,'')), ''),
        NULLIF(TRIM(IFNULL(p_Calle,'')), ''),
        NULLIF(TRIM(IFNULL(p_Num_Ext,'')), ''),
        NULLIF(TRIM(IFNULL(p_Num_Int,'')), ''),
        NULLIF(TRIM(IFNULL(p_Colonia,'')), ''),
        NULLIF(TRIM(IFNULL(p_Municipio,'')), ''),
        NULLIF(TRIM(IFNULL(p_CP,'')), ''),
        NULLIF(TRIM(IFNULL(p_Estado,'')), ''),
        NULLIF(TRIM(IFNULL(p_Dias_Disponibles,'')), ''),
        NULLIF(TRIM(IFNULL(p_Horario,'')), ''),
        NULLIF(TRIM(IFNULL(p_Ruta,'')), ''),
        0,           -- Coordenadas_Manuales default
        NOW()
    );

    SET p_nuevo_id  = LAST_INSERT_ID();
    SET p_resultado = 0;
    SET p_mensaje   = CONCAT('Prospecto registrado correctamente. ID asignado: ', p_nuevo_id);

END SP_Prospectos_Insert $$


-- ════════════════════════════════════════════════════════════════
-- SP 2: SP_Prospectos_Update
--
-- Códigos de error:
--   -1  Prospecto_ID no existe
--   -2  Nombre_Prospecto vacío
--   -3  Nombre_Comercial_Empresa vacío
--   -4  Correo duplicado en otro registro
--   -99 Error SQL inesperado
-- ════════════════════════════════════════════════════════════════
CREATE PROCEDURE SP_Prospectos_Update(
    IN  p_Prospecto_ID             INT,
    IN  p_Nombre_Prospecto         VARCHAR(150),
    IN  p_Nombre_Comercial_Empresa VARCHAR(150),
    IN  p_Correo                   VARCHAR(150),
    IN  p_Telefono                 VARCHAR(30),
    IN  p_Tipo_Persona             VARCHAR(50),
    IN  p_Tiene_Sucursales         VARCHAR(20),
    IN  p_Estatus                  VARCHAR(50),
    IN  p_Tipo_Inmueble            VARCHAR(50),
    IN  p_Notas                    TEXT,
    IN  p_Calle                    VARCHAR(150),
    IN  p_Num_Ext                  VARCHAR(20),
    IN  p_Num_Int                  VARCHAR(20),
    IN  p_Colonia                  VARCHAR(100),
    IN  p_Municipio                VARCHAR(100),
    IN  p_CP                       VARCHAR(10),
    IN  p_Estado                   VARCHAR(100),
    IN  p_Dias_Disponibles         VARCHAR(150),
    IN  p_Horario                  VARCHAR(100),
    IN  p_Ruta                     VARCHAR(100),
    OUT p_resultado                INT,
    OUT p_mensaje                  VARCHAR(500)
)
SP_Prospectos_Update: BEGIN

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_mensaje = MESSAGE_TEXT;
        SET p_resultado = -99;
        SET p_mensaje   = CONCAT('Error SQL inesperado: ', IFNULL(p_mensaje, 'desconocido'));
    END;

    SET p_resultado = -99;
    SET p_mensaje   = 'Sin procesar';

    -- ── Prospecto debe existir ────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM crm_prospectos WHERE Prospecto_ID = p_Prospecto_ID LIMIT 1) THEN
        SET p_resultado = -1;
        SET p_mensaje   = CONCAT('No se encontró ningún prospecto con ID: ', p_Prospecto_ID);
        LEAVE SP_Prospectos_Update;
    END IF;

    -- ── Campos obligatorios ───────────────────────────────────────
    IF NULLIF(TRIM(IFNULL(p_Nombre_Prospecto,'')), '') IS NULL THEN
        SET p_resultado = -2;
        SET p_mensaje   = 'El Nombre del Prospecto es obligatorio.';
        LEAVE SP_Prospectos_Update;
    END IF;

    IF NULLIF(TRIM(IFNULL(p_Nombre_Comercial_Empresa,'')), '') IS NULL THEN
        SET p_resultado = -3;
        SET p_mensaje   = 'El Nombre Comercial de la Empresa es obligatorio.';
        LEAVE SP_Prospectos_Update;
    END IF;

    -- ── Correo único (excluyendo el propio registro) ──────────────
    IF p_Correo IS NOT NULL AND TRIM(p_Correo) != '' THEN
        IF EXISTS (
            SELECT 1 FROM crm_prospectos
            WHERE Correo = TRIM(p_Correo)
              AND Prospecto_ID <> p_Prospecto_ID
            LIMIT 1
        ) THEN
            SET p_resultado = -4;
            SET p_mensaje   = CONCAT('El correo "', TRIM(p_Correo), '" ya está registrado por otro prospecto.');
            LEAVE SP_Prospectos_Update;
        END IF;
    END IF;

    -- ── UPDATE ────────────────────────────────────────────────────
    UPDATE crm_prospectos SET
        Nombre_Prospecto         = TRIM(p_Nombre_Prospecto),
        Nombre_Comercial_Empresa = TRIM(p_Nombre_Comercial_Empresa),
        Correo                   = NULLIF(TRIM(IFNULL(p_Correo,'')), ''),
        Telefono                 = NULLIF(TRIM(IFNULL(p_Telefono,'')), ''),
        Tipo_Persona             = IFNULL(NULLIF(TRIM(IFNULL(p_Tipo_Persona,'')),''), 'Moral'),
        Tiene_Sucursales         = IFNULL(NULLIF(TRIM(IFNULL(p_Tiene_Sucursales,'')),''), 'No'),
        Estatus                  = IFNULL(NULLIF(TRIM(IFNULL(p_Estatus,'')),''), 'Nuevo'),
        Tipo_Inmueble            = NULLIF(TRIM(IFNULL(p_Tipo_Inmueble,'')), ''),
        Notas                    = NULLIF(TRIM(IFNULL(p_Notas,'')), ''),
        Calle                    = NULLIF(TRIM(IFNULL(p_Calle,'')), ''),
        Num_Ext                  = NULLIF(TRIM(IFNULL(p_Num_Ext,'')), ''),
        Num_Int                  = NULLIF(TRIM(IFNULL(p_Num_Int,'')), ''),
        Colonia                  = NULLIF(TRIM(IFNULL(p_Colonia,'')), ''),
        Municipio                = NULLIF(TRIM(IFNULL(p_Municipio,'')), ''),
        CP                       = NULLIF(TRIM(IFNULL(p_CP,'')), ''),
        Estado                   = NULLIF(TRIM(IFNULL(p_Estado,'')), ''),
        Dias_Disponibles         = NULLIF(TRIM(IFNULL(p_Dias_Disponibles,'')), ''),
        Horario                  = NULLIF(TRIM(IFNULL(p_Horario,'')), ''),
        Ruta                     = NULLIF(TRIM(IFNULL(p_Ruta,'')), '')
    WHERE Prospecto_ID = p_Prospecto_ID;

    SET p_resultado = 0;
    SET p_mensaje   = 'Prospecto actualizado correctamente.';

END SP_Prospectos_Update $$


-- ════════════════════════════════════════════════════════════════
-- SP 3: SP_Prospectos_Select
--   p_Prospecto_ID = NULL  → devuelve todos
--   p_Estatus      = NULL  → sin filtro de estatus
-- ════════════════════════════════════════════════════════════════
CREATE PROCEDURE SP_Prospectos_Select(
    IN p_Prospecto_ID INT,
    IN p_Estatus      VARCHAR(50)
)
BEGIN
    SELECT
        p.Prospecto_ID,
        p.Nombre_Prospecto,
        p.Nombre_Comercial_Empresa,
        p.Correo,
        p.Telefono,
        p.Tipo_Persona,
        p.Tiene_Sucursales,
        p.Estatus,
        p.Tipo_Inmueble,
        p.Notas,
        p.Calle,
        p.Num_Ext,
        p.Num_Int,
        p.Colonia,
        p.Municipio,
        p.CP,
        p.Estado,
        p.Lat,
        p.Lng,
        p.Coordenadas_Manuales,
        p.Dias_Disponibles,
        p.Horario,
        p.Ruta,
        p.Fecha_Creacion,
        -- Joins
        e.Nombre_Empresa,
        u.Nombre              AS Propietario,
        f.Nombre_Fuente       AS Fuente,
        -- Conteo de sucursales y contactos relacionados
        (SELECT COUNT(*) FROM crm_prospecto_sucursales s WHERE s.Prospecto_ID = p.Prospecto_ID) AS Total_Sucursales,
        (SELECT COUNT(*) FROM crm_prospecto_contactos  c WHERE c.Prospecto_ID = p.Prospecto_ID) AS Total_Contactos
    FROM  crm_prospectos            p
    INNER JOIN empresas             e ON e.Empresa_ID  = p.Empresa_ID
    INNER JOIN usuarios             u ON u.Usuario_ID  = p.Propietario_ID
    LEFT  JOIN crm_fuentes_prospecto f ON f.Fuente_ID  = p.Fuente_ID
    WHERE
        (p_Prospecto_ID IS NULL OR p.Prospecto_ID = p_Prospecto_ID)
        AND (p_Estatus  IS NULL OR p.Estatus       = p_Estatus)
    ORDER BY p.Fecha_Creacion DESC;
END $$


-- ════════════════════════════════════════════════════════════════
-- SP 4: SP_Prospectos_Delete
--   El ON DELETE CASCADE de las FK elimina automáticamente:
--   - crm_prospecto_sucursales
--   - crm_prospecto_contactos
--   - crm_prospecto_archivos
--   - crm_cotizaciones_borradores
--
-- Códigos de error:
--   -1  Prospecto no existe
--   -99 Error SQL inesperado
-- ════════════════════════════════════════════════════════════════
CREATE PROCEDURE SP_Prospectos_Delete(
    IN  p_Prospecto_ID INT,
    OUT p_resultado    INT,
    OUT p_mensaje      VARCHAR(500)
)
SP_Prospectos_Delete: BEGIN

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_mensaje = MESSAGE_TEXT;
        SET p_resultado = -99;
        SET p_mensaje   = CONCAT('Error SQL al eliminar: ', IFNULL(p_mensaje, 'desconocido'));
    END;

    SET p_resultado = -99;
    SET p_mensaje   = 'Sin procesar';

    IF NOT EXISTS (SELECT 1 FROM crm_prospectos WHERE Prospecto_ID = p_Prospecto_ID LIMIT 1) THEN
        SET p_resultado = -1;
        SET p_mensaje   = CONCAT('No se encontró el prospecto con ID: ', p_Prospecto_ID);
        LEAVE SP_Prospectos_Delete;
    END IF;

    -- Las FK ON DELETE CASCADE eliminan registros hijos automáticamente
    DELETE FROM crm_prospectos WHERE Prospecto_ID = p_Prospecto_ID;

    SET p_resultado = 0;
    SET p_mensaje   = CONCAT('Prospecto ID ', p_Prospecto_ID, ' eliminado correctamente.');

END SP_Prospectos_Delete $$

DELIMITER ;

-- ── Verificar que los 4 SPs quedaron creados ─────────────────────
SELECT
    ROUTINE_NAME        AS `Stored Procedure`,
    ROUTINE_TYPE        AS `Tipo`,
    CREATED             AS `Creado`,
    LAST_ALTERED        AS `Modificado`
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'prueba1'
  AND ROUTINE_NAME LIKE 'SP_Prospectos%'
ORDER BY ROUTINE_NAME;

-- ── Prueba rápida del SP de consulta ─────────────────────────────
-- CALL SP_Prospectos_Select(NULL, NULL);        -- todos
-- CALL SP_Prospectos_Select(1, NULL);           -- por ID
-- CALL SP_Prospectos_Select(NULL, 'Nuevo');     -- por estatus
