using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using MySql.Data.MySqlClient;   // NuGet: MySql.Data (Oracle) o MySqlConnector
using CRMCiclo.Models;

namespace CRMCiclo.DAL
{
    /// <summary>
    /// Capa de Acceso a Datos — Prospectos sobre MySQL/MariaDB.
    /// Invoca los Stored Procedures del archivo SP_Prospectos_MySQL.sql.
    ///
    /// REQUISITO: instalar el paquete NuGet "MySql.Data" en el proyecto:
    ///   Tools → NuGet Package Manager → Package Manager Console
    ///   > Install-Package MySql.Data
    ///
    /// Cadena de conexión en Web.config (connectionStrings):
    ///   Server=localhost;Port=3306;Database=prueba1;Uid=root;Pwd=TuPassword;
    /// </summary>
    public class ProspectosDAL
    {
        private readonly string _conn =
            ConfigurationManager.ConnectionStrings["CRMConnection"].ConnectionString;

        // ─────────────────────────────────────────────────────────
        // INSERT → llama SP_Prospectos_Insert
        // ─────────────────────────────────────────────────────────
        public (int resultado, string mensaje, int nuevoId) Insertar(ProspectoModel m)
        {
            using (var con = new MySqlConnection(_conn))
            using (var cmd = new MySqlCommand("SP_Prospectos_Insert", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                // Parámetros de entrada (IN)
                AgregarParametrosEntrada(cmd, m);

                // Parámetros de salida (OUT)
                var pId  = AddOut(cmd, "p_nuevo_id",  MySqlDbType.Int32);
                var pRes = AddOut(cmd, "p_resultado",  MySqlDbType.Int32);
                var pMsg = AddOut(cmd, "p_mensaje",    MySqlDbType.VarChar, 500);

                con.Open();
                cmd.ExecuteNonQuery();

                int    res   = ToInt(pRes.Value, -99);
                string msg   = pMsg.Value?.ToString() ?? "Error desconocido";
                int    newId = ToInt(pId.Value, 0);

                return (res, msg, newId);
            }
        }

        // ─────────────────────────────────────────────────────────
        // UPDATE → llama SP_Prospectos_Update
        // ─────────────────────────────────────────────────────────
        public (int resultado, string mensaje) Actualizar(ProspectoModel m)
        {
            using (var con = new MySqlConnection(_conn))
            using (var cmd = new MySqlCommand("SP_Prospectos_Update", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                // El SP de Update recibe el ID como primer parámetro
                cmd.Parameters.AddWithValue("p_Prospecto_ID", m.Prospecto_ID);
                AgregarParametrosEntrada(cmd, m);

                var pRes = AddOut(cmd, "p_resultado", MySqlDbType.Int32);
                var pMsg = AddOut(cmd, "p_mensaje",   MySqlDbType.VarChar, 500);

                con.Open();
                cmd.ExecuteNonQuery();

                int    res = ToInt(pRes.Value, -99);
                string msg = pMsg.Value?.ToString() ?? "Error desconocido";
                return (res, msg);
            }
        }

        // ─────────────────────────────────────────────────────────
        // SELECT → llama SP_Prospectos_Select
        // ─────────────────────────────────────────────────────────
        public DataTable Obtener(int? prospectoId = null, string estatus = null)
        {
            using (var con = new MySqlConnection(_conn))
            using (var cmd = new MySqlCommand("SP_Prospectos_Select", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("p_Prospecto_ID", (object)prospectoId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("p_Estatus",      (object)estatus     ?? DBNull.Value);

                var dt = new DataTable();
                con.Open();
                new MySqlDataAdapter(cmd).Fill(dt);
                return dt;
            }
        }

        // ─────────────────────────────────────────────────────────
        // DELETE → llama SP_Prospectos_Delete
        // ─────────────────────────────────────────────────────────
        public (int resultado, string mensaje) Eliminar(int prospectoId)
        {
            using (var con = new MySqlConnection(_conn))
            using (var cmd = new MySqlCommand("SP_Prospectos_Delete", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("p_Prospecto_ID", prospectoId);

                var pRes = AddOut(cmd, "p_resultado", MySqlDbType.Int32);
                var pMsg = AddOut(cmd, "p_mensaje",   MySqlDbType.VarChar, 500);

                con.Open();
                cmd.ExecuteNonQuery();

                int    res = ToInt(pRes.Value, -99);
                string msg = pMsg.Value?.ToString() ?? "Error desconocido";
                return (res, msg);
            }
        }

        // ─────────────────────────────────────────────────────────
        // Helpers privados
        // ─────────────────────────────────────────────────────────

        /// <summary>
        /// Agrega los parámetros IN comunes a Insert y Update.
        /// Nota: para Update el primer param (p_Prospecto_ID) se agrega antes.
        /// </summary>
        private void AgregarParametrosEntrada(MySqlCommand cmd, ProspectoModel m)
        {
            cmd.Parameters.AddWithValue("p_Empresa_ID",               m.Empresa_ID);
            cmd.Parameters.AddWithValue("p_Nombre_Prospecto",         m.Nombre_Prospecto);
            cmd.Parameters.AddWithValue("p_Nombre_Comercial_Empresa", m.Nombre_Comercial_Empresa);
            cmd.Parameters.AddWithValue("p_Propietario_ID",           m.Propietario_ID > 0 ? (object)m.Propietario_ID : DBNull.Value);
            cmd.Parameters.AddWithValue("p_Fuente_ID",                m.Fuente_ID      > 0 ? (object)m.Fuente_ID      : DBNull.Value);
            cmd.Parameters.AddWithValue("p_Correo",          OrNull(m.Correo));
            cmd.Parameters.AddWithValue("p_Telefono",        OrNull(m.Telefono));
            cmd.Parameters.AddWithValue("p_Tipo_Persona",             m.Tipo_Persona       ?? "Moral");
            cmd.Parameters.AddWithValue("p_Tiene_Sucursales",         m.Tiene_Sucursales   ?? "No");
            cmd.Parameters.AddWithValue("p_Estatus",                  m.Estatus);
            cmd.Parameters.AddWithValue("p_Tipo_Inmueble",   OrNull(m.Tipo_Inmueble));
            cmd.Parameters.AddWithValue("p_Notas",           OrNull(m.Notas));
            cmd.Parameters.AddWithValue("p_Calle",           OrNull(m.Calle));
            cmd.Parameters.AddWithValue("p_Num_Ext",         OrNull(m.Num_Ext));
            cmd.Parameters.AddWithValue("p_Num_Int",         OrNull(m.Num_Int));
            cmd.Parameters.AddWithValue("p_Colonia",         OrNull(m.Colonia));
            cmd.Parameters.AddWithValue("p_Municipio",       OrNull(m.Municipio));
            cmd.Parameters.AddWithValue("p_CP",              OrNull(m.CP));
            cmd.Parameters.AddWithValue("p_Estado",          OrNull(m.Estado));
            cmd.Parameters.AddWithValue("p_Dias_Disponibles",OrNull(m.Dias_Disponibles));
            cmd.Parameters.AddWithValue("p_Horario",         OrNull(m.Horario));
            cmd.Parameters.AddWithValue("p_Ruta",            OrNull(m.Ruta));
        }

        private static object OrNull(string val) =>
            string.IsNullOrWhiteSpace(val) ? (object)DBNull.Value : val.Trim();

        private static MySqlParameter AddOut(MySqlCommand cmd, string name, MySqlDbType type, int size = 0)
        {
            var p = new MySqlParameter(name, type)
            {
                Direction = ParameterDirection.Output
            };
            if (size > 0) p.Size = size;
            cmd.Parameters.Add(p);
            return p;
        }

        private static int ToInt(object val, int defecto) =>
            val != null && val != DBNull.Value ? Convert.ToInt32(val) : defecto;
    }
}
