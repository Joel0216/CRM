using System;
using System.ComponentModel.DataAnnotations;

namespace CRMCiclo.Models
{
    /// <summary>
    /// ViewModel que representa el formulario de Prospectos/Clientes.
    /// Las anotaciones [Required] son validadas por ModelState en el controlador.
    /// </summary>
    public class ProspectoModel
    {
        public int Prospecto_ID { get; set; }  // 0 = nuevo registro

        [Required(ErrorMessage = "El Nombre del Prospecto es obligatorio.")]
        [StringLength(150, ErrorMessage = "Máximo 150 caracteres.")]
        public string Nombre_Prospecto { get; set; }

        [Required(ErrorMessage = "El Nombre Comercial de la Empresa es obligatorio.")]
        [StringLength(150)]
        public string Nombre_Comercial_Empresa { get; set; }

        [Required(ErrorMessage = "Debe seleccionar una Empresa.")]
        [Range(1, int.MaxValue, ErrorMessage = "Seleccione una empresa válida.")]
        public int Empresa_ID { get; set; }

        public int Propietario_ID { get; set; } = 1;
        public int Fuente_ID      { get; set; } = 1;

        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        [StringLength(150)]
        public string Correo { get; set; }

        [RegularExpression(@"^\+?[0-9\s\-\(\)]{7,20}$",
            ErrorMessage = "El Teléfono solo admite números, espacios, guiones y paréntesis (7-20 caracteres).")]
        [StringLength(30)]
        public string Telefono { get; set; }

        public string Tipo_Persona     { get; set; } = "Moral";
        public string Tiene_Sucursales { get; set; } = "No";

        [Required(ErrorMessage = "El Estatus es obligatorio.")]
        public string Estatus { get; set; } = "Nuevo";

        public string Tipo_Inmueble { get; set; }
        public string Notas         { get; set; }

        // Dirección
        [StringLength(150)] public string Calle    { get; set; }
        [StringLength(20)]  public string Num_Ext  { get; set; }
        [StringLength(20)]  public string Num_Int  { get; set; }
        [StringLength(100)] public string Colonia  { get; set; }
        [StringLength(100)] public string Municipio{ get; set; }

        [RegularExpression(@"^\d{5}$", ErrorMessage = "El Código Postal debe tener exactamente 5 dígitos.")]
        [StringLength(10)]
        public string CP { get; set; }

        [StringLength(100)] public string Estado { get; set; }

        // Operaciones
        [StringLength(150)] public string Dias_Disponibles { get; set; }
        [StringLength(100)] public string Horario          { get; set; }
        [StringLength(100)] public string Ruta             { get; set; }

        public DateTime? Fecha_Creacion { get; set; }
    }

    /// <summary>
    /// Respuesta JSON estandarizada para todos los endpoints del CRM.
    /// Estructura: { success, message, data }
    /// </summary>
    public class ApiResponse
    {
        public bool   success { get; set; }
        public string message { get; set; }
        public object data    { get; set; }
    }
}
