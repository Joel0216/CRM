using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using System.Web.Mvc;
using CRMCiclo.DAL;
using CRMCiclo.Models;

namespace CRMCiclo.Controllers
{
    public class ProspectosController : Controller
    {
        private readonly ProspectosDAL _dal = new ProspectosDAL();

        // ── GET /Prospectos/Index ─────────────────────────────────
        public ActionResult Index()
        {
            ViewBag.Title      = "Prospectos";
            ViewBag.ActiveMenu = "Prospectos";
            return View();
        }

        // ── GET /Prospectos/Formulario?id=0  (nuevo)
        // ── GET /Prospectos/Formulario?id=5  (editar)
        public ActionResult Formulario(int id = 0)
        {
            ViewBag.Title      = id == 0 ? "Nuevo Prospecto" : "Editar Prospecto";
            ViewBag.ActiveMenu = "Prospectos";

            var model = new ProspectoModel();

            if (id > 0)
            {
                var dt = _dal.Obtener(id);
                if (dt.Rows.Count > 0)
                    model = MapRow(dt.Rows[0]);
                else
                {
                    TempData["Error"] = "Prospecto no encontrado.";
                    return RedirectToAction("Index");
                }
            }
            return View(model);
        }

        // ── POST /Prospectos/Guardar  (INSERT o UPDATE vía AJAX) ──
        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult Guardar(ProspectoModel model)
        {
            // 1. Validación de DataAnnotations en el servidor
            if (!ModelState.IsValid)
            {
                var sb = new StringBuilder();
                foreach (var ms in ModelState.Values)
                    foreach (var err in ms.Errors)
                        sb.AppendLine(err.ErrorMessage);

                return Json(new ApiResponse
                {
                    success = false,
                    message = sb.ToString().Trim()
                });
            }

            try
            {
                if (model.Prospecto_ID == 0)
                {
                    // INSERT
                    var (resultado, mensaje, nuevoId) = _dal.Insertar(model);
                    return resultado == 0
                        ? Json(new ApiResponse { success = true,  message = mensaje, data = nuevoId })
                        : Json(new ApiResponse { success = false, message = mensaje });
                }
                else
                {
                    // UPDATE
                    var (resultado, mensaje) = _dal.Actualizar(model);
                    return resultado == 0
                        ? Json(new ApiResponse { success = true,  message = mensaje })
                        : Json(new ApiResponse { success = false, message = mensaje });
                }
            }
            catch (Exception ex)
            {
                return Json(new ApiResponse
                {
                    success = false,
                    message = "Error inesperado: " + ex.Message
                });
            }
        }

        // ── GET /Prospectos/ObtenerLista  (JSON para DataTable) ───
        [HttpGet]
        public JsonResult ObtenerLista(string estatus = null)
        {
            try
            {
                var dt    = _dal.Obtener(null, estatus);
                var lista = new List<object>();

                foreach (DataRow row in dt.Rows)
                {
                    lista.Add(new
                    {
                        Prospecto_ID             = row["Prospecto_ID"],
                        Nombre_Prospecto         = row["Nombre_Prospecto"],
                        Nombre_Comercial_Empresa = row["Nombre_Comercial_Empresa"],
                        Correo                   = row["Correo"],
                        Telefono                 = row["Telefono"],
                        Estatus                  = row["Estatus"],
                        Tipo_Inmueble            = row["Tipo_Inmueble"],
                        Nombre_Empresa           = row["Nombre_Empresa"],
                        Propietario              = row["Propietario"],
                        Fecha_Creacion           = row["Fecha_Creacion"]
                    });
                }

                return Json(new ApiResponse { success = true, data = lista },
                            JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new ApiResponse { success = false, message = ex.Message },
                            JsonRequestBehavior.AllowGet);
            }
        }

        // ── POST /Prospectos/Eliminar ─────────────────────────────
        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult Eliminar(int id)
        {
            try
            {
                if (id <= 0)
                    return Json(new ApiResponse { success = false, message = "ID de prospecto inválido." });

                var (resultado, mensaje) = _dal.Eliminar(id);
                return resultado == 0
                    ? Json(new ApiResponse { success = true,  message = mensaje })
                    : Json(new ApiResponse { success = false, message = mensaje });
            }
            catch (Exception ex)
            {
                return Json(new ApiResponse { success = false, message = "Error al eliminar: " + ex.Message });
            }
        }

        // ─────────────────────────────────────────────────────────
        // Utilidad: DataRow → ProspectoModel
        // ─────────────────────────────────────────────────────────
        private static ProspectoModel MapRow(DataRow row)
        {
            T Get<T>(string col) =>
                row[col] == DBNull.Value ? default : (T)Convert.ChangeType(row[col], typeof(T));

            string Str(string col) => row[col] == DBNull.Value ? null : row[col].ToString();

            return new ProspectoModel
            {
                Prospecto_ID             = Get<int>("Prospecto_ID"),
                Nombre_Prospecto         = Str("Nombre_Prospecto"),
                Nombre_Comercial_Empresa = Str("Nombre_Comercial_Empresa"),
                Correo                   = Str("Correo"),
                Telefono                 = Str("Telefono"),
                Tipo_Persona             = Str("Tipo_Persona"),
                Tiene_Sucursales         = Str("Tiene_Sucursales"),
                Estatus                  = Str("Estatus"),
                Tipo_Inmueble            = Str("Tipo_Inmueble"),
                Notas                    = Str("Notas"),
                Calle                    = Str("Calle"),
                Num_Ext                  = Str("Num_Ext"),
                Num_Int                  = Str("Num_Int"),
                Colonia                  = Str("Colonia"),
                Municipio                = Str("Municipio"),
                CP                       = Str("CP"),
                Estado                   = Str("Estado"),
                Dias_Disponibles         = Str("Dias_Disponibles"),
                Horario                  = Str("Horario"),
                Ruta                     = Str("Ruta"),
                Fecha_Creacion           = row["Fecha_Creacion"] == DBNull.Value
                                           ? (DateTime?)null
                                           : Convert.ToDateTime(row["Fecha_Creacion"])
            };
        }
    }
}
