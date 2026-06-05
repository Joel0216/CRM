-- ================================================================
-- STORED PROCEDURES — crm_prospectos
-- Motor: MySQL / MariaDB 10.4  |  Base de datos: prueba1
-- Ejecutar COMPLETO en MySQL Workbench
-- ================================================================

USE prueba1;

-- ── Eliminar SPs existentes antes de recrearlos ──────────────────
DROP PROCEDURE IF EXISTS SP_Prospectos_Insert;
DROP PROCEDURE IF EXISTS SP_Prospectos_Update;
DROP PROCEDURE IF EXISTS SP_Prospectos_Select;
DROP PROCEDURE IF EXISTS SP_Prospectos_Delete;

DELIMITER $$

-- ════════════════════════════════════════════════════════════════
-- 1. SP_Prospectos_Insert
--    OUT p_nuevo_id   → ID generado (NULL si error)
--    OUT p_resultado  → 0 = OK | negativo = error
--    OUT p_mensaje    → texto descriptivo del resultado
-- ════════════════════════════════════════════════════════════════
CREATE PROCEDURE SP_Prospectos_Insert(
    -- Entradas obligatorias
    IN  p_Empresa_ID               INT,
    IN  p_Nombre_Prospecto         VARCHAR(150),
    IN  p_Nombre_Comercial_Empresa VARCHAR(150),
    -- Entradas opcionales
    IN  p_Propietario_ID           INT,
    IN  p_Fuente_ID                INT,
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
    -- Salidas
    OUT p_nuevo_id                 INT,
    OUT p_resultado                INT,
    OUT p_mensaje                  VARCHAR(500)
)
BEGIN
    -- Handler de errores SQL
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_mensaje = MESSAGE_TEXT;
        SET p_resultado = -99;
        SET p_nuevo_id  = NULL;
        SET p_mensaje   = CONCAT('Error SQL: ', p_mensaje);
    END;

    SET p_nuevo_id  = NULL;
    SET p_resultado = -99;
    SET p_mensaje   = 'Error desconocido';

    -- ── Validación: Nombre_Prospecto obligatorio ──────────────────
    IF NULLIF(TRIM(p_Nombre_Prospecto), '') IS NULL THEN
        SET p_resultado = -1;
        SET p_mensaje   = 'El Nombre del Prospecto es obligatorio.';
        LEAVE SP_Prospectos_Insert;   -- salir del bloque principal
    END IF;

    -- ── Validación: Nombre_Comercial obligatorio ──────────────────
    IF NULLIF(TRIM(p_Nombre_Comercial_Empresa), '') IS NULL THEN
        SET p_resultado = -2;
        SET p_mensaje   = 'El Nombre Comercial de la Empresa es obligatorio.';
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── Validación: Empresa_ID > 0 ────────────────────────────────
    IF IFNULL(p_Empresa_ID, 0) <= 0 THEN
        SET p_resultado = -3;
        SET p_mensaje   = 'Debe indicar un Empresa_ID válido (mayor que 0).';
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── Empresa debe existir en la tabla empresas ─────────────────
    IF NOT EXISTS (SELECT 1 FROM empresas WHERE Empresa_ID = p_Empresa_ID) THEN
        SET p_resultado = -4;
        SET p_mensaje   = CONCAT('La Empresa con ID ', p_Empresa_ID, ' no existe.');
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── Correo único si se capturó ────────────────────────────────
    IF p_Correo IS NOT NULL AND TRIM(p_Correo) != '' THEN
        IF EXISTS (
            SELECT 1 FROM crm_prospectos
            WHERE Correo = TRIM(p_Correo)
        ) THEN
            SET p_resultado = -5;
            SET p_mensaje   = CONCAT('Ya existe un prospecto con el correo: ', p_Correo);
            LEAVE SP_Prospectos_Insert;
        END IF;
    END IF;

    -- ── Estatus en catálogo permitido ─────────────────────────────
    IF p_Estatus NOT IN ('Nuevo','Contactado','Calificado','Propuesta','Negociación','Ganado','Perdido') THEN
        SET p_resultado = -6;
        SET p_mensaje   = CONCAT('El Estatus "', IFNULL(p_Estatus,'(vacío)'), '" no es válido.');
        LEAVE SP_Prospectos_Insert;
    END IF;

    -- ── INSERT ────────────────────────────────────────────────────
    INSERT INTO crm_prospectos (
        Empresa_ID, Propietario_ID, Fuente_ID,
        Nombre_Prospecto, Nombre_Comercial_Empresa,
        Correo, Telefono, Tipo_Persona, Tiene_Sucursales,
        Estatus, Tipo_Inmueble, Notas,
        Calle, Num_Ext, Num_Int, Colonia, Municipio, CP, Estado,
        Dias_Disponibles, Horario, Ruta,
        Fecha_Creacion
    )
    VALUES (
        p_Empresa_ID,
        IFNULL(p_Propietario_ID, 1),
        IFNULL(p_Fuente_ID, 1),
        TRIM(p_Nombre_Prospecto),
        TRIM(p_Nombre_Comercial_Empresa),
        NULLIF(TRIM(p_Correo), ''),
        NULLIF(TRIM(p_Telefono), ''),
        IFNULL(NULLIF(TRIM(p_Tipo_Persona),''), 'Moral'),
        IFNULL(NULLIF(TRIM(p_Tiene_Sucursales),''), 'No'),
        p_Estatus,
        NULLIF(TRIM(p_Tipo_Inmueble), ''),
        NULLIF(TRIM(p_Notas), ''),
        NULLIF(TRIM(p_Calle), ''),
        NULLIF(TRIM(p_Num_Ext), ''),
        NULLIF(TRIM(p_Num_Int), ''),
        NULLIF(TRIM(p_Colonia), ''),
        NULLIF(TRIM(p_Municipio), ''),
        NULLIF(TRIM(p_CP), ''),
        NULLIF(TRIM(p_Estado), ''),
        NULLIF(TRIM(p_Dias_Disponibles), ''),
        NULLIF(TRIM(p_Horario), ''),
        NULLIF(TRIM(p_Ruta), ''),
        NOW()
    );

    SET p_nuevo_id  = LAST_INSERT_ID();
    SET p_resultado = 0;
    SET p_mensaje   = CONCAT('Prospecto registrado correctamente. ID: ', p_nuevo_id);

END SP_Prospectos_Insert $$

-- ════════════════════════════════════════════════════════════════
-- 2. SP_Prospectos_Update
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
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_mensaje = MESSAGE_TEXT;
        SET p_resultado = -99;
        SET p_mensaje   = CONCAT('Error SQL: ', p_mensaje);
    END;

    SET p_resultado = -99;
    SET p_mensaje   = 'Error desconocido';

    -- ── Prospecto debe existir ────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM crm_prospectos WHERE Prospecto_ID = p_Prospecto_ID) THEN
        SET p_resultado = -1;
        SET p_mensaje   = CONCAT('No se encontró el Prospecto con ID: ', p_Prospecto_ID);
        LEAVE SP_Prospectos_Update;
    END IF;

    -- ── Campos obligatorios ───────────────────────────────────────
    IF NULLIF(TRIM(p_Nombre_Prospecto), '') IS NULL THEN
        SET p_resultado = -2;
        SET p_mensaje   = 'El Nombre del Prospecto es obligatorio.';
        LEAVE SP_Prospectos_Update;
    END IF;

    IF NULLIF(TRIM(p_Nombre_Comercial_Empresa), '') IS NULL THEN
        SET p_resultado = -3;
        SET p_mensaje   = 'El Nombre Comercial de la Empresa es obligatorio.';
        LEAVE SP_Prospectos_Update;
    END IF;

    -- ── Correo único excluyendo el mismo registro ─────────────────
    IF p_Correo IS NOT NULL AND TRIM(p_Correo) != '' THEN
        IF EXISTS (
            SELECT 1 FROM crm_prospectos
            WHERE Correo = TRIM(p_Correo)
              AND Prospecto_ID <> p_Prospecto_ID
        ) THEN
            SET p_resultado = -4;
            SET p_mensaje   = CONCAT('El correo "', p_Correo, '" ya está en uso por otro prospecto.');
            LEAVE SP_Prospectos_Update;
        END IF;
    END IF;

    -- ── UPDATE ────────────────────────────────────────────────────
    UPDATE crm_prospectos SET
        Nombre_Prospecto         = TRIM(p_Nombre_Prospecto),
        Nombre_Comercial_Empresa = TRIM(p_Nombre_Comercial_Empresa),
        Correo                   = NULLIF(TRIM(p_Correo), ''),
        Telefono                 = NULLIF(TRIM(p_Telefono), ''),
        Tipo_Persona             = IFNULL(NULLIF(TRIM(p_Tipo_Persona),''), 'Moral'),
        Tiene_Sucursales         = IFNULL(NULLIF(TRIM(p_Tiene_Sucursales),''), 'No'),
        Estatus                  = p_Estatus,
        Tipo_Inmueble            = NULLIF(TRIM(p_Tipo_Inmueble), ''),
        Notas                    = NULLIF(TRIM(p_Notas), ''),
        Calle                    = NULLIF(TRIM(p_Calle), ''),
        Num_Ext                  = NULLIF(TRIM(p_Num_Ext), ''),
        Num_Int                  = NULLIF(TRIM(p_Num_Int), ''),
        Colonia                  = NULLIF(TRIM(p_Colonia), ''),
        Municipio                = NULLIF(TRIM(p_Municipio), ''),
        CP                       = NULLIF(TRIM(p_CP), ''),
        Estado                   = NULLIF(TRIM(p_Estado), ''),
        Dias_Disponibles         = NULLIF(TRIM(p_Dias_Disponibles), ''),
        Horario                  = NULLIF(TRIM(p_Horario), ''),
        Ruta                     = NULLIF(TRIM(p_Ruta), '')
    WHERE Prospecto_ID = p_Prospecto_ID;

    SET p_resultado = 0;
    SET p_mensaje   = 'Prospecto actualizado correctamente.';

END SP_Prospectos_Update $$

-- ════════════════════════════════════════════════════════════════
-- 3. SP_Prospectos_Select  (lista general, por ID o por Estatus)
-- ════════════════════════════════════════════════════════════════
CREATE PROCEDURE SP_Prospectos_Select(
    IN p_Prospecto_ID INT,     -- NULL = todos
    IN p_Estatus      VARCHAR(50)  -- NULL = sin filtro
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
        p.Dias_Disponibles,
        p.Horario,
        p.Ruta,
        p.Fecha_Creacion,
        e.Nombre_Empresa,
        u.Nombre              AS Propietario,
        f.Nombre_Fuente       AS Fuente
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
-- 4. SP_Prospectos_Delete
-- ════════════════════════════════════════════════════════════════
CREATE PROCEDURE SP_Prospectos_Delete(
    IN  p_Prospecto_ID INT,
    OUT p_resultado    INT,
    OUT p_mensaje      VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_mensaje = MESSAGE_TEXT;
        SET p_resultado = -99;
        SET p_mensaje   = CONCAT('Error SQL al eliminar: ', p_mensaje);
    END;

    SET p_resultado = -99;
    SET p_mensaje   = 'Error desconocido';

    IF NOT EXISTS (SELECT 1 FROM crm_prospectos WHERE Prospecto_ID = p_Prospecto_ID) THEN
        SET p_resultado = -1;
        SET p_mensaje   = CONCAT('Prospecto con ID ', p_Prospecto_ID, ' no encontrado.');
        LEAVE SP_Prospectos_Delete;
    END IF;

    -- ON DELETE CASCADE en FK elimina sucursales y contactos automáticamente
    DELETE FROM crm_prospectos WHERE Prospecto_ID = p_Prospecto_ID;

    SET p_resultado = 0;
    SET p_mensaje   = 'Prospecto eliminado correctamente.';

END SP_Prospectos_Delete $$

DELIMITER ;

-- ── Verificar los 4 SPs creados ──────────────────────────────────
SELECT
    ROUTINE_NAME        AS Stored_Procedure,
    ROUTINE_TYPE        AS Tipo,
    CREATED             AS Creado,
    LAST_ALTERED        AS Modificado
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_NAME LIKE 'SP_Prospectos%'
ORDER BY ROUTINE_NAME;
