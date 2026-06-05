/**
 * prospectos.js
 * Validaciones cliente + SweetAlert2 + envío $.ajax
 * Dependencias del Layout: jQuery 3.4.1, SweetAlert2 v11
 *
 * IDs de campos esperados en la Vista:
 *   #frmProspecto, #btnGuardar, #Prospecto_ID, #Empresa_ID,
 *   #Propietario_ID, #Fuente_ID, #Nombre_Prospecto,
 *   #Nombre_Comercial_Empresa, #Correo, #Telefono,
 *   #Tipo_Persona, #Tiene_Sucursales, #Estatus, #Tipo_Inmueble,
 *   #Notas, #Calle, #Num_Ext, #Num_Int, #Colonia, #Municipio,
 *   #CP, #Estado, #Dias_Disponibles, #Horario, #Ruta
 */

const ProspectosForm = (function ($) {
    'use strict';

    // ── Expresiones regulares ─────────────────────────────────────
    const REGEX = {
        email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        telefono: /^\+?[\d\s\-\(\)]{7,20}$/,
        cp:       /^\d{5}$/
    };

    // ── Validaciones del cliente ──────────────────────────────────
    function validar() {
        const errores = [];
        const g = id => $.trim($('#' + id).val());

        // Obligatorios
        if (!g('Nombre_Prospecto'))
            errores.push('El campo <b>Nombre del Prospecto</b> es obligatorio.');

        if (!g('Nombre_Comercial_Empresa'))
            errores.push('El campo <b>Nombre Comercial de la Empresa</b> es obligatorio.');

        const empresa = parseInt($('#Empresa_ID').val(), 10);
        if (!empresa || empresa <= 0)
            errores.push('Debe seleccionar una <b>Empresa</b> válida.');

        if (!g('Estatus'))
            errores.push('Debe seleccionar un <b>Estatus</b>.');

        // Correo (opcional, pero si se escribe debe ser válido)
        const correo = g('Correo');
        if (correo && !REGEX.email.test(correo))
            errores.push('El <b>Correo Electrónico</b> no tiene un formato válido (ejemplo: usuario@dominio.com).');

        // Teléfono
        const tel = g('Telefono');
        if (tel && !REGEX.telefono.test(tel))
            errores.push('El <b>Teléfono</b> solo puede contener números, espacios, guiones y paréntesis (7-20 caracteres).');

        // Código Postal
        const cp = g('CP');
        if (cp && !REGEX.cp.test(cp))
            errores.push('El <b>Código Postal</b> debe tener exactamente 5 dígitos numéricos.');

        return errores;
    }

    // ── Recopilación de datos del formulario ──────────────────────
    function recopilarDatos() {
        const g    = id => $.trim($('#' + id).val()) || null;
        const gInt = id => parseInt($('#' + id).val(), 10) || 0;

        return {
            Prospecto_ID:            gInt('Prospecto_ID'),
            Empresa_ID:              gInt('Empresa_ID'),
            Propietario_ID:          gInt('Propietario_ID') || 1,
            Fuente_ID:               gInt('Fuente_ID')      || 1,
            Nombre_Prospecto:        $.trim($('#Nombre_Prospecto').val()),
            Nombre_Comercial_Empresa:$.trim($('#Nombre_Comercial_Empresa').val()),
            Correo:                  g('Correo'),
            Telefono:                g('Telefono'),
            Tipo_Persona:            $('#Tipo_Persona').val()    || 'Moral',
            Tiene_Sucursales:        $('#Tiene_Sucursales').val()|| 'No',
            Estatus:                 $('#Estatus').val(),
            Tipo_Inmueble:           g('Tipo_Inmueble'),
            Notas:                   g('Notas'),
            Calle:                   g('Calle'),
            Num_Ext:                 g('Num_Ext'),
            Num_Int:                 g('Num_Int'),
            Colonia:                 g('Colonia'),
            Municipio:               g('Municipio'),
            CP:                      g('CP'),
            Estado:                  g('Estado'),
            Dias_Disponibles:        g('Dias_Disponibles'),
            Horario:                 g('Horario'),
            Ruta:                    g('Ruta'),
            // Anti-CSRF token (requerido por [ValidateAntiForgeryToken])
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        };
    }

    // ── Envío AJAX al controlador ─────────────────────────────────
    function enviarAjax(datos) {
        const $btn = $('#btnGuardar');
        const textoOriginal = $btn.text();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Guardando...');

        $.ajax({
            url:         '/Prospectos/Guardar',
            type:        'POST',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            data:        datos,   // jQuery serializa el objeto plano automáticamente
            dataType:    'json'
        })
        .done(function (resp) {
            if (resp.success) {
                Swal.fire({
                    icon:             'success',
                    title:            '¡Guardado!',
                    text:             resp.message,
                    confirmButtonText:'Aceptar',
                    confirmButtonColor:'#9E652E'
                }).then(function () {
                    window.location.href = '/Prospectos/Index';
                });
            } else {
                Swal.fire({
                    icon:             'error',
                    title:            'Error del servidor',
                    text:             resp.message,
                    confirmButtonText:'Entendido',
                    confirmButtonColor:'#d33'
                });
            }
        })
        .fail(function (xhr) {
            let msg = 'No se pudo conectar con el servidor. Verifique su conexión.';
            if (xhr.status === 403) msg = 'Sesión expirada. Recargue la página e intente de nuevo.';
            if (xhr.status === 500) msg = 'Error interno del servidor (500). Contacte al administrador.';

            Swal.fire({
                icon:             'error',
                title:            'Error de conexión',
                text:             msg,
                confirmButtonText:'Cerrar',
                confirmButtonColor:'#d33'
            });
        })
        .always(function () {
            $btn.prop('disabled', false).text(textoOriginal);
        });
    }

    // ── Lógica principal de guardado ──────────────────────────────
    function ejecutarGuardado() {
        // Limpiar errores visuales previos
        $('.is-invalid').removeClass('is-invalid');

        const errores = validar();

        if (errores.length > 0) {
            // Construir HTML de la lista de errores
            const listaHtml = '<ul style="text-align:left;margin:6px 0 0 0;padding-left:20px">'
                + errores.map(e => '<li style="margin-bottom:4px">' + e + '</li>').join('')
                + '</ul>';

            Swal.fire({
                icon:             'warning',
                title:            'Campos incompletos o inválidos',
                html:             listaHtml,
                confirmButtonText:'Revisar',
                confirmButtonColor:'#f0a500'
            });
            return; // Detener el flujo
        }

        // Sin errores: recopilar y enviar
        const datos = recopilarDatos();
        enviarAjax(datos);
    }

    // ── Inicialización ────────────────────────────────────────────
    function init() {
        // Interceptar submit del form
        $('#frmProspecto').on('submit', function (e) {
            e.preventDefault();
            ejecutarGuardado();
        });

        // Clic del botón fuera del form (por si acaso)
        $(document).on('click', '#btnGuardar', function (e) {
            e.preventDefault();
            ejecutarGuardado();
        });

        // Limpiar estado inválido al enfocar un campo
        $(document).on('focus', '.form-control, .form-select', function () {
            $(this).removeClass('is-invalid');
        });

        // Validar correo en tiempo real (onBlur)
        $('#Correo').on('blur', function () {
            const val = $.trim($(this).val());
            if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                $(this).addClass('is-invalid');
                if (!$(this).next('.invalid-feedback').length) {
                    $(this).after('<div class="invalid-feedback">Formato de correo inválido.</div>');
                }
            } else {
                $(this).removeClass('is-invalid').next('.invalid-feedback').remove();
            }
        });

        // Validar teléfono en tiempo real (onBlur)
        $('#Telefono').on('blur', function () {
            const val = $.trim($(this).val());
            if (val && !/^\+?[\d\s\-\(\)]{7,20}$/.test(val)) {
                $(this).addClass('is-invalid');
                if (!$(this).next('.invalid-feedback').length) {
                    $(this).after('<div class="invalid-feedback">Formato de teléfono inválido.</div>');
                }
            } else {
                $(this).removeClass('is-invalid').next('.invalid-feedback').remove();
            }
        });

        // Validar CP en tiempo real (onBlur)
        $('#CP').on('blur', function () {
            const val = $.trim($(this).val());
            if (val && !/^\d{5}$/.test(val)) {
                $(this).addClass('is-invalid');
                if (!$(this).next('.invalid-feedback').length) {
                    $(this).after('<div class="invalid-feedback">El CP debe ser de 5 dígitos.</div>');
                }
            } else {
                $(this).removeClass('is-invalid').next('.invalid-feedback').remove();
            }
        });
    }

    // API pública
    return { init: init };

}(jQuery));

// ── Arrancar cuando el DOM esté listo ────────────────────────────
$(document).ready(function () {
    ProspectosForm.init();
});
