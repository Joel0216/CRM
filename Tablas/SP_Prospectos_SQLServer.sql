-- ================================================================
-- STORED PROCEDURES — crm_prospectos
-- Motor: SQL Server (T-SQL) | Proyecto: CRMCiclo
-- Ejecutar en la base de datos: CRMCiclo
-- ================================================================

USE CRMCiclo;
GO

-- ────────────────────────────────────────────────────────────────
-- 1. SP_Prospectos_Insert
--    Parámetros OUTPUT: @Nuevo_ID, @Resultado (0=OK / neg=error), @Mensaje
-- ────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE [dbo].[SP_Prospectos_Insert]
    @Empresa_ID               INT,
    @Propietario_ID           INT            = 1,
    @Fuente_ID                INT            = 1,
    @Nombre_Prospecto         NVARCHAR(150),
    @Nombre_Comercial_Empresa NVARCHAR(150),
    @Correo                   NVARCHAR(150)  = NULL,
    @Telefono                 NVARCHAR(30)   = NULL,
    @Tipo_Persona             NVARCHAR(50)   = 'Moral',
    @Tiene_Sucursales         NVARCHAR(20)   = 'No',
    @Estatus                  NVARCHAR(50)   = 'Nuevo',
    @Tipo_Inmueble            NVARCHAR(50)   = NULL,
    @Notas                    NVARCHAR(MAX)  = NULL,
    @Calle                    NVARCHAR(150)  = NULL,
    @Num_Ext                  NVARCHAR(20)   = NULL,
    @Num_Int                  NVARCHAR(20)   = NULL,
    @Colonia                  NVARCHAR(100)  = NULL,
    @Municipio                NVARCHAR(100)  = NULL,
    @CP                       NVARCHAR(10)   = NULL,
    @Estado                   NVARCHAR(100)  = NULL,
    @Dias_Disponibles         NVARCHAR(150)  = NULL,
    @Horario                  NVARCHAR(100)  = NULL,
    @Ruta                     NVARCHAR(100)  = NULL,
    -- Salidas
    @Nuevo_ID   INT           OUTPUT,
    @Resultado  INT           OUTPUT,
    @Mensaje    NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Nuevo_ID = NULL;

    -- ── Validaciones de campos obligatorios ───────────────────────
    IF NULLIF(LTRIM(RTRIM(@Nombre_Prospecto)), '') IS NULL
    BEGIN
        SET @Resultado = -1;
        SET @Mensaje   = 'El Nombre del Prospecto es obligatorio.';
        RETURN;
    END

    IF NULLIF(LTRIM(RTRIM(@Nombre_Comercial_Empresa)), '') IS NULL
    BEGIN
        SET @Resultado = -2;
        SET @Mensaje   = 'El Nombre Comercial de la Empresa es obligatorio.';
        RETURN;
    END

    IF ISNULL(@Empresa_ID, 0) <= 0
    BEGIN
        SET @Resultado = -3;
        SET @Mensaje   = 'Debe indicar un Empresa_ID válido.';
        RETURN;
    END

    -- ── Empresa debe existir ──────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM empresas WHERE Empresa_ID = @Empresa_ID)
    BEGIN
        SET @Resultado = -4;
        SET @Mensaje   = 'La Empresa con ID ' + CAST(@Empresa_ID AS NVARCHAR) + ' no existe.';
        RETURN;
    END

    -- ── Correo único (si se captura) ─────────────────────────────
    IF @Correo IS NOT NULL
       AND EXISTS (SELECT 1 FROM crm_prospectos WHERE Correo = LTRIM(RTRIM(@Correo)))
    BEGIN
        SET @Resultado = -5;
        SET @Mensaje   = 'Ya existe un prospecto registrado con el correo: ' + @Correo;
        RETURN;
    END

    -- ── Estatus en catálogo ───────────────────────────────────────
    IF @Estatus NOT IN ('Nuevo','Contactado','Calificado','Propuesta','Negociación','Ganado','Perdido')
    BEGIN
        SET @Resultado = -6;
        SET @Mensaje   = 'El Estatus "' + ISNULL(@Estatus,'(vacío)') + '" no es válido.';
        RETURN;
    END

    -- ── INSERT ────────────────────────────────────────────────────
    BEGIN TRY
        INSERT INTO crm_prospectos (
            Empresa_ID, Propietario_ID, Fuente_ID,
            Nombre_Prospecto, Nombre_Comercial_Empresa,
            Correo, Telefono, Tipo_Persona, Tiene_Sucursales,
            Estatus, Tipo_Inmueble, Notas,
            Calle, Num_Ext, Num_Int, Colonia, Municipio, CP, Estado,
            Dias_Disponibles, Horario, Ruta, Fecha_Creacion
        )
        VALUES (
            @Empresa_ID, @Propietario_ID, @Fuente_ID,
            LTRIM(RTRIM(@Nombre_Prospecto)),
            LTRIM(RTRIM(@Nombre_Comercial_Empresa)),
            NULLIF(LTRIM(RTRIM(@Correo)),''),
            NULLIF(LTRIM(RTRIM(@Telefono)),''),
            @Tipo_Persona, @Tiene_Sucursales,
            @Estatus,
            NULLIF(LTRIM(RTRIM(@Tipo_Inmueble)),''),
            NULLIF(LTRIM(RTRIM(@Notas)),''),
            NULLIF(LTRIM(RTRIM(@Calle)),''),
            NULLIF(LTRIM(RTRIM(@Num_Ext)),''),
            NULLIF(LTRIM(RTRIM(@Num_Int)),''),
            NULLIF(LTRIM(RTRIM(@Colonia)),''),
            NULLIF(LTRIM(RTRIM(@Municipio)),''),
            NULLIF(LTRIM(RTRIM(@CP)),''),
            NULLIF(LTRIM(RTRIM(@Estado)),''),
            NULLIF(LTRIM(RTRIM(@Dias_Disponibles)),''),
            NULLIF(LTRIM(RTRIM(@Horario)),''),
            NULLIF(LTRIM(RTRIM(@Ruta)),''),
            GETDATE()
        );

        SET @Nuevo_ID  = SCOPE_IDENTITY();
        SET @Resultado = 0;
        SET @Mensaje   = 'Prospecto registrado correctamente. ID: ' + CAST(@Nuevo_ID AS NVARCHAR);
    END TRY
    BEGIN CATCH
        SET @Nuevo_ID  = NULL;
        SET @Resultado = -99;
        SET @Mensaje   = 'Error SQL: ' + ERROR_MESSAGE()
                       + ' | Línea: ' + CAST(ERROR_LINE() AS NVARCHAR);
    END CATCH
END
GO

-- ────────────────────────────────────────────────────────────────
-- 2. SP_Prospectos_Update
-- ────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE [dbo].[SP_Prospectos_Update]
    @Prospecto_ID             INT,
    @Nombre_Prospecto         NVARCHAR(150),
    @Nombre_Comercial_Empresa NVARCHAR(150),
    @Correo                   NVARCHAR(150)  = NULL,
    @Telefono                 NVARCHAR(30)   = NULL,
    @Tipo_Persona             NVARCHAR(50)   = 'Moral',
    @Tiene_Sucursales         NVARCHAR(20)   = 'No',
    @Estatus                  NVARCHAR(50)   = 'Nuevo',
    @Tipo_Inmueble            NVARCHAR(50)   = NULL,
    @Notas                    NVARCHAR(MAX)  = NULL,
    @Calle                    NVARCHAR(150)  = NULL,
    @Num_Ext                  NVARCHAR(20)   = NULL,
    @Num_Int                  NVARCHAR(20)   = NULL,
    @Colonia                  NVARCHAR(100)  = NULL,
    @Municipio                NVARCHAR(100)  = NULL,
    @CP                       NVARCHAR(10)   = NULL,
    @Estado                   NVARCHAR(100)  = NULL,
    @Dias_Disponibles         NVARCHAR(150)  = NULL,
    @Horario                  NVARCHAR(100)  = NULL,
    @Ruta                     NVARCHAR(100)  = NULL,
    @Resultado  INT           OUTPUT,
    @Mensaje    NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Existe el registro ────────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM crm_prospectos WHERE Prospecto_ID = @Prospecto_ID)
    BEGIN
        SET @Resultado = -1;
        SET @Mensaje   = 'No se encontró el Prospecto con ID: ' + CAST(@Prospecto_ID AS NVARCHAR);
        RETURN;
    END

    -- ── Campos obligatorios ───────────────────────────────────────
    IF NULLIF(LTRIM(RTRIM(@Nombre_Prospecto)), '') IS NULL
    BEGIN
        SET @Resultado = -2;
        SET @Mensaje   = 'El Nombre del Prospecto es obligatorio.';
        RETURN;
    END

    IF NULLIF(LTRIM(RTRIM(@Nombre_Comercial_Empresa)), '') IS NULL
    BEGIN
        SET @Resultado = -3;
        SET @Mensaje   = 'El Nombre Comercial de la Empresa es obligatorio.';
        RETURN;
    END

    -- ── Correo único excluyendo el propio registro ────────────────
    IF @Correo IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM crm_prospectos
           WHERE Correo = LTRIM(RTRIM(@Correo))
             AND Prospecto_ID <> @Prospecto_ID
       )
    BEGIN
        SET @Resultado = -4;
        SET @Mensaje   = 'El correo "' + @Correo + '" ya está en uso por otro prospecto.';
        RETURN;
    END

    -- ── UPDATE ────────────────────────────────────────────────────
    BEGIN TRY
        UPDATE crm_prospectos SET
            Nombre_Prospecto         = LTRIM(RTRIM(@Nombre_Prospecto)),
            Nombre_Comercial_Empresa = LTRIM(RTRIM(@Nombre_Comercial_Empresa)),
            Correo                   = NULLIF(LTRIM(RTRIM(@Correo)),''),
            Telefono                 = NULLIF(LTRIM(RTRIM(@Telefono)),''),
            Tipo_Persona             = @Tipo_Persona,
            Tiene_Sucursales         = @Tiene_Sucursales,
            Estatus                  = @Estatus,
            Tipo_Inmueble            = NULLIF(LTRIM(RTRIM(@Tipo_Inmueble)),''),
            Notas                    = NULLIF(LTRIM(RTRIM(@Notas)),''),
            Calle                    = NULLIF(LTRIM(RTRIM(@Calle)),''),
            Num_Ext                  = NULLIF(LTRIM(RTRIM(@Num_Ext)),''),
            Num_Int                  = NULLIF(LTRIM(RTRIM(@Num_Int)),''),
            Colonia                  = NULLIF(LTRIM(RTRIM(@Colonia)),''),
            Municipio                = NULLIF(LTRIM(RTRIM(@Municipio)),''),
            CP                       = NULLIF(LTRIM(RTRIM(@CP)),''),
            Estado                   = NULLIF(LTRIM(RTRIM(@Estado)),''),
            Dias_Disponibles         = NULLIF(LTRIM(RTRIM(@Dias_Disponibles)),''),
            Horario                  = NULLIF(LTRIM(RTRIM(@Horario)),''),
            Ruta                     = NULLIF(LTRIM(RTRIM(@Ruta)),'')
        WHERE Prospecto_ID = @Prospecto_ID;

        SET @Resultado = 0;
        SET @Mensaje   = 'Prospecto actualizado correctamente.';
    END TRY
    BEGIN CATCH
        SET @Resultado = -99;
        SET @Mensaje   = 'Error SQL: ' + ERROR_MESSAGE();
    END CATCH
END
GO

-- ────────────────────────────────────────────────────────────────
-- 3. SP_Prospectos_Select  (lista general o por ID/Estatus)
-- ────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE [dbo].[SP_Prospectos_Select]
    @Prospecto_ID INT          = NULL,  -- NULL = todos
    @Estatus      NVARCHAR(50) = NULL   -- NULL = sin filtro
AS
BEGIN
    SET NOCOUNT ON;

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
        u.Nombre          AS Propietario,
        f.Nombre_Fuente   AS Fuente
    FROM  crm_prospectos          p
    INNER JOIN empresas           e ON e.Empresa_ID    = p.Empresa_ID
    INNER JOIN usuarios           u ON u.Usuario_ID    = p.Propietario_ID
    LEFT  JOIN crm_fuentes_prospecto f ON f.Fuente_ID  = p.Fuente_ID
    WHERE
        (@Prospecto_ID IS NULL OR p.Prospecto_ID = @Prospecto_ID)
        AND (@Estatus  IS NULL OR p.Estatus       = @Estatus)
    ORDER BY p.Fecha_Creacion DESC;
END
GO

-- ────────────────────────────────────────────────────────────────
-- 4. SP_Prospectos_Delete  (eliminación lógica o física)
-- ────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE [dbo].[SP_Prospectos_Delete]
    @Prospecto_ID INT,
    @Resultado    INT           OUTPUT,
    @Mensaje      NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM crm_prospectos WHERE Prospecto_ID = @Prospecto_ID)
    BEGIN
        SET @Resultado = -1;
        SET @Mensaje   = 'Prospecto con ID ' + CAST(@Prospecto_ID AS NVARCHAR) + ' no encontrado.';
        RETURN;
    END

    BEGIN TRY
        DELETE FROM crm_prospectos WHERE Prospecto_ID = @Prospecto_ID;
        SET @Resultado = 0;
        SET @Mensaje   = 'Prospecto eliminado correctamente.';
    END TRY
    BEGIN CATCH
        SET @Resultado = -99;
        SET @Mensaje   = 'Error SQL al eliminar: ' + ERROR_MESSAGE();
    END CATCH
END
GO

-- ── Verificar los 4 SPs creados ──────────────────────────────────
SELECT name, create_date, modify_date
FROM   sys.objects
WHERE  type = 'P'
  AND  name LIKE 'SP_Prospectos%'
ORDER BY name;
GO
