/**
 * prospectos-validaciones.js
 * ─────────────────────────────────────────────────────────────────
 * Módulo de validaciones cliente + SweetAlert2 + $.ajax
 * Basado en el esquema real: crm_prospectos (prueba1 / MariaDB 10.4)
 *
 * Campos y sus tipos en la BD:
 * ┌────────────────────────────┬──────────────┬───────────┐
 * │ Campo                      │ Tipo MySQL   │ Requerido │
 * ├────────────────────────────┼──────────────┼───────────┤
 * │ Nombre_Prospecto           │ VARCHAR(150) │ SÍ (NN)   │
 * │ Nombre_Comercial_Empresa   │ VARCHAR(150) │ SÍ (NN)   │
 * │ Empresa_ID                 │ INT / FK     │ SÍ (NN)   │
 * │ Estatus                    │ VARCHAR(50)  │ SÍ (NN)   │
 * │ Correo                     │ VARCHAR(150) │ NO        │
 * │ Telefono                   │ VARCHAR(30)  │ NO        │
 * │ Tipo_Persona               │ VARCHAR(50)  │ NO        │
 * │ Tiene_Sucursales           │ VARCHAR(20)  │ NO        │
 * │ Tipo_Inmueble              │ VARCHAR(50)  │ NO        │
 * │ Notas                      │ TEXT         │ NO        │
 * │ Calle                      │ VARCHAR(150) │ NO        │
 * │ Num_Ext                    │ VARCHAR(20)  │ NO        │
 * │ Num_Int                    │ VARCHAR(20)  │ NO        │
 * │ Colonia                    │ VARCHAR(100) │ NO        │
 * │ Municipio                  │ VARCHAR(100) │ NO        │
 * │ CP                         │ VARCHAR(10)  │ NO        │
 * │ Estado                     │ VARCHAR(100) │ NO        │
 * │ Dias_Disponibles           │ VARCHAR(150) │ NO        │
 * │ Horario                    │ VARCHAR(100) │ NO        │
 * │ Ruta                       │ VARCHAR(100) │ NO        │
 * └────────────────────────────┴──────────────┴───────────┘
 *
 * Dependencias (ya en _Layout.cshtml):
 *   - jQuery 3.4.1
 *   - SweetAlert2 v11 (Swal)
 *   - Bootstrap 5 (clases is-invalid)
 * ─────────────────────────────────────────────────────────────────
 */

const ProspectosForm = (function ($) {
    'use strict';

    // ── Expresiones regulares según tipos de campo en la BD ───────
    const REGEX = {
        // Correo: formato estándar RFC 5321 simplificado
        email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,

        // Teléfono: 7-20 chars, solo dígitos, espacios, +, -, ()
        // Válidos: 9991234567 | (999)123-4567 | +52 999 123 4567
        telefono: /^\+?[\d\s\-\(\)]{7,20}$/,

        // CP: exactamente 5 dígitos numéricos (México)
        cp: /^\d{5}$/,

        // Límites de longitud según VARCHAR de la BD
        maxLen: {
            Nombre_Prospecto:         150,
            Nombre_Comercial_Empresa: 150,
            Correo:                   150,
            Telefono:                  30,
            Tipo_Persona:              50,
            Tiene_Sucursales:          20,
            Estatus:                   50,
            Tipo_Inmueble:             50,
            Calle:                    150,
            Num_Ext:                   20,
            Num_Int:                   20,
            Colonia:                  100,
            Municipio:                100,
            CP:                        10,
            Estado:                   100,
            Dias_Disponibles:         150,
            Horario:                  100,
            Ruta:                     100
        }
    };

    // ── Catálogos de valores permitidos (espejo del SP / frontend) ─
    const CATALOGOS = {
        Estatus: ['Nuevo','En seguimiento','Cotizado','Adeudo','Inactivo'],
        Tipo_Persona: ['Moral','Física'],
        Tiene_Sucursales: ['No','Sí'],
        Tipo_Inmueble: ['Casa','Oficinas','Local','Condominio Público','Condominio Privado']
    };

    // ── Helper: obtener valor trimmed de un campo ─────────────────
    const g  = id => $.trim($('#' + id).val() || '');
    const gi = id => parseInt($('#' + id).val(), 10) || 0;

    // ─────────────────────────────────────────────────────────────
    // FUNCIÓN PRINCIPAL DE VALIDACIÓN
    // Retorna array de mensajes de error (vacío = sin errores)
    // ─────────────────────────────────────────────────────────────
    function validar() {
        const errores = [];

        // ─── GRUPO 1: Campos NOT NULL en la BD ───────────────────

        // Nombre_Prospecto → VARCHAR(150) NOT NULL
        if (!g('Nombre_Prospecto')) {
            marcarInvalido('Nombre_Prospecto');
            errores.push('El <b>Nombre del Prospecto</b> es obligatorio.');
        } else if (g('Nombre_Prospecto').length > 150) {
            marcarInvalido('Nombre_Prospecto');
            errores.push('El <b>Nombre del Prospecto</b> no puede exceder 150 caracteres.');
        }

        // Nombre_Comercial_Empresa → VARCHAR(150) NOT NULL
        if (!g('Nombre_Comercial_Empresa')) {
            marcarInvalido('Nombre_Comercial_Empresa');
            errores.push('El <b>Nombre Comercial de la Empresa</b> es obligatorio.');
        } else if (g('Nombre_Comercial_Empresa').length > 150) {
            marcarInvalido('Nombre_Comercial_Empresa');
            errores.push('El <b>Nombre Comercial</b> no puede exceder 150 caracteres.');
        }

        // Empresa_ID → INT NOT NULL FK
        if (gi('Empresa_ID') <= 0) {
            marcarInvalido('Empresa_ID');
            errores.push('Debe seleccionar una <b>Empresa</b> válida.');
        }

        // Estatus → VARCHAR(50) NOT NULL
        const estatus = g('Estatus');
        if (!estatus) {
            marcarInvalido('Estatus');
            errores.push('Debe seleccionar un <b>Estatus</b>.');
        } else if (!CATALOGOS.Estatus.includes(estatus)) {
            marcarInvalido('Estatus');
            errores.push(`El <b>Estatus</b> "${estatus}" no es válido.`);
        }

        // ─── GRUPO 2: Campos opcionales con formato ───────────────

        // Correo → VARCHAR(150) NULL — validar formato si se captura
        const correo = g('Correo');
        if (correo) {
            if (!REGEX.email.test(correo)) {
                marcarInvalido('Correo');
                errores.push('El <b>Correo Electrónico</b> no tiene un formato válido (ej: usuario@dominio.com).');
            } else if (correo.length > 150) {
                marcarInvalido('Correo');
                errores.push('El <b>Correo</b> excede el límite de 150 caracteres.');
            }
        }

        // Telefono → VARCHAR(30) NULL — solo dígitos y separadores
        const tel = g('Telefono');
        if (tel) {
            if (!REGEX.telefono.test(tel)) {
                marcarInvalido('Telefono');
                errores.push('El <b>Teléfono</b> solo puede contener números, espacios, guiones y paréntesis (7-20 caracteres).');
            } else if (tel.length > 30) {
                marcarInvalido('Telefono');
                errores.push('El <b>Teléfono</b> excede el límite de 30 caracteres.');
            }
        }

        // CP → VARCHAR(10) NULL — México: 5 dígitos
        const cp = g('CP');
        if (cp && !REGEX.cp.test(cp)) {
            marcarInvalido('CP');
            errores.push('El <b>Código Postal</b> debe contener exactamente 5 dígitos numéricos.');
        }

        // ─── GRUPO 3: Longitudes máximas de campos VARCHAR opcionales ─
        const camposLongitud = [
            { id: 'Calle',           label: 'Calle',           max: 150 },
            { id: 'Num_Ext',         label: 'Núm. Exterior',   max: 20  },
            { id: 'Num_Int',         label: 'Núm. Interior',   max: 20  },
            { id: 'Colonia',         label: 'Colonia',         max: 100 },
            { id: 'Municipio',       label: 'Municipio',       max: 100 },
            { id: 'Estado',          label: 'Estado',          max: 100 },
            { id: 'Dias_Disponibles',label: 'Días Disponibles',max: 150 },
            { id: 'Horario',         label: 'Horario',         max: 100 },
            { id: 'Ruta',            label: 'Ruta',            max: 100 }
        ];

        camposLongitud.forEach(function (c) {
            const val = g(c.id);
            if (val && val.length > c.max) {
                marcarInvalido(c.id);
                errores.push(`El campo <b>${c.label}</b> excede el máximo de ${c.max} caracteres.`);
            }
        });

        return errores;
    }

    // ─────────────────────────────────────────────────────────────
    // Marcar campo como inválido (Bootstrap 5)
    // ─────────────────────────────────────────────────────────────
    function marcarInvalido(id) {
        const $el = $('#' + id);
        $el.addClass('is-invalid');
        // Agregar feedback solo si no existe ya
        if (!$el.siblings('.invalid-feedback').length && !$el.next('.invalid-feedback').length) {
            $el.after('<div class="invalid-feedback">Campo inválido.</div>');
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Recopilar todos los datos del formulario
    // ─────────────────────────────────────────────────────────────
    function recopilarDatos() {
        return {
            // ID del registro (0 = nuevo, >0 = edición)
            Prospecto_ID:            gi('Prospecto_ID'),
            // Campos NOT NULL
            Empresa_ID:              gi('Empresa_ID'),
            Propietario_ID:          gi('Propietario_ID') || 1,
            Fuente_ID:               gi('Fuente_ID')      || 1,
            Nombre_Prospecto:        g('Nombre_Prospecto'),
            Nombre_Comercial_Empresa:g('Nombre_Comercial_Empresa'),
            Estatus:                 g('Estatus') || 'Nuevo',
            // Campos opcionales
            Correo:                  g('Correo')           || null,
            Telefono:                g('Telefono')         || null,
            Tipo_Persona:            g('Tipo_Persona')     || 'Moral',
            Tiene_Sucursales:        g('Tiene_Sucursales') || 'No',
            Tipo_Inmueble:           g('Tipo_Inmueble')    || null,
            Notas:                   g('Notas')            || null,
            // Dirección
            Calle:                   g('Calle')    || null,
            Num_Ext:                 g('Num_Ext')  || null,
            Num_Int:                 g('Num_Int')  || null,
            Colonia:                 g('Colonia')  || null,
            Municipio:               g('Municipio')|| null,
            CP:                      g('CP')       || null,
            Estado:                  g('Estado')   || null,
            // Operaciones
            Dias_Disponibles:        g('Dias_Disponibles') || null,
            Horario:                 g('Horario')          || null,
            Ruta:                    g('Ruta')             || null,
            // Anti-CSRF (requerido por [ValidateAntiForgeryToken])
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Envío AJAX → /Prospectos/Guardar
    // ─────────────────────────────────────────────────────────────
    function enviarAjax(datos) {
        const $btn          = $('#btnGuardar');
        const textoOriginal = $btn.html();

        // Deshabilitar botón + spinner
        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-1" role="status"></span>Guardando...');

        $.ajax({
            url:      '/Prospectos/Guardar',
            type:     'POST',
            data:     datos,   // jQuery serializa el objeto plano
            dataType: 'json'
        })
        .done(function (resp) {
            if (resp.success) {
                // ✅ Guardado exitoso
                Swal.fire({
                    icon:              'success',
                    title:             '¡Guardado correctamente!',
                    text:              resp.message,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor:'#9E652E',
                    timer:             4000,
                    timerProgressBar:  true
                }).then(function () {
                    // Redirigir al listado
                    window.location.href = '/Prospectos/Index';
                });

            } else {
                // ❌ Error del servidor / SP (validación SQL)
                Swal.fire({
                    icon:              'error',
                    title:             'No se pudo guardar',
                    html:              '<p style="margin:0">' + resp.message + '</p>',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor:'#d33'
                });
            }
        })
        .fail(function (xhr) {
            // ❌ Error de red o HTTP
            let titulo = 'Error de conexión';
            let texto  = 'No se pudo contactar al servidor. Verifique su conexión.';

            if (xhr.status === 403) {
                titulo = 'Sesión expirada';
                texto  = 'Su sesión ha expirado. Por favor recargue la página.';
            } else if (xhr.status === 404) {
                titulo = 'Recurso no encontrado (404)';
                texto  = 'La ruta del servidor no existe. Contacte al administrador.';
            } else if (xhr.status === 500) {
                titulo = 'Error interno del servidor (500)';
                texto  = 'Ocurrió un error en el servidor. Contacte al administrador.';
            }

            Swal.fire({
                icon:              'error',
                title:             titulo,
                text:              texto,
                confirmButtonText: 'Cerrar',
                confirmButtonColor:'#6c757d'
            });
        })
        .always(function () {
            // Restaurar botón siempre
            $btn.prop('disabled', false).html(textoOriginal);
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Ejecutar flujo de guardado
    // ─────────────────────────────────────────────────────────────
    function ejecutarGuardado() {
        // 1. Limpiar errores visuales anteriores
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').remove();

        // 2. Ejecutar validaciones
        const errores = validar();

        if (errores.length > 0) {
            // ⚠️ Alerta de advertencia con lista de errores
            const html = '<ul style="text-align:left;margin:8px 0 0 0;padding-left:18px;font-size:0.9rem">'
                + errores.map(e => `<li style="margin-bottom:5px">${e}</li>`).join('')
                + '</ul>';

            Swal.fire({
                icon:              'warning',
                title:             `Hay ${errores.length} campo${errores.length > 1 ? 's' : ''} con error`,
                html:              html,
                confirmButtonText: 'Corregir',
                confirmButtonColor:'#f0a500',
                // Hacer scroll al primer campo inválido
                didOpen: function () {
                    const primer = document.querySelector('.is-invalid');
                    if (primer) primer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            return; // 🛑 Detener — no enviar
        }

        // 3. Sin errores → confirmar y enviar
        const esNuevo = gi('Prospecto_ID') === 0;

        Swal.fire({
            icon:               'question',
            title:              esNuevo ? '¿Registrar prospecto?' : '¿Guardar cambios?',
            text:               esNuevo
                                    ? 'Se creará un nuevo prospecto en el sistema.'
                                    : 'Se actualizarán los datos del prospecto.',
            showCancelButton:   true,
            confirmButtonText:  esNuevo ? 'Sí, registrar' : 'Sí, guardar',
            cancelButtonText:   'Cancelar',
            confirmButtonColor: '#9E652E',
            cancelButtonColor:  '#6c757d'
        }).then(function (result) {
            if (result.isConfirmed) {
                enviarAjax(recopilarDatos());
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Validaciones en tiempo real (onBlur por campo)
    // ─────────────────────────────────────────────────────────────
    function bindValidacionesEnVivo() {

        // Correo → formato al perder foco
        $('#Correo').on('blur', function () {
            const val = g('Correo');
            limpiarError('Correo');
            if (val && !REGEX.email.test(val)) {
                marcarInvalido('Correo');
                $('#Correo').next('.invalid-feedback').text('Formato inválido. Ej: usuario@dominio.com');
            }
        });

        // Teléfono → formato al perder foco
        $('#Telefono').on('blur', function () {
            const val = g('Telefono');
            limpiarError('Telefono');
            if (val && !REGEX.telefono.test(val)) {
                marcarInvalido('Telefono');
                $('#Telefono').next('.invalid-feedback').text('Solo dígitos, espacios, guiones y paréntesis (7-20 chars).');
            }
        });

        // CP → 5 dígitos al perder foco
        $('#CP').on('blur', function () {
            const val = g('CP');
            limpiarError('CP');
            if (val && !REGEX.cp.test(val)) {
                marcarInvalido('CP');
                $('#CP').next('.invalid-feedback').text('El CP debe tener exactamente 5 dígitos numéricos.');
            }
        });

        // Limpiar error visual al escribir en cualquier campo
        $(document).on('input change', '.form-control, .form-select', function () {
            const id = $(this).attr('id');
            if (id) limpiarError(id);
        });
    }

    function limpiarError(id) {
        $('#' + id).removeClass('is-invalid').siblings('.invalid-feedback').remove();
        $('#' + id).next('.invalid-feedback').remove();
    }

    // ─────────────────────────────────────────────────────────────
    // INIT — bindear todos los eventos
    // ─────────────────────────────────────────────────────────────
    function init() {
        // Submit del formulario
        $('#frmProspecto').on('submit', function (e) {
            e.preventDefault();
            ejecutarGuardado();
        });

        // Clic del botón guardar (por si está fuera del <form>)
        $(document).on('click', '#btnGuardar', function (e) {
            e.preventDefault();
            ejecutarGuardado();
        });

        // Validaciones en vivo
        bindValidacionesEnVivo();

        console.log('[ProspectosForm] Módulo inicializado correctamente.');
    }

    // API pública
    return { init: init, validar: validar };

}(jQuery));

// ── Arrancar cuando el DOM esté listo ────────────────────────────
$(document).ready(function () {
    ProspectosForm.init();
});
