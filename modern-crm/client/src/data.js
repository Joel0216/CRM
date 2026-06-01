// ============================================================
// data.js — Capa de datos offline-first con localStorage
// CRM Ciclo Ambiental
// ============================================================

// ▶ Incrementa esta versión cada vez que cambies el esquema de datos
const DATA_VERSION = 'v3'

const KEYS = {
  prospectos: 'crm_prospectos',
  usuarios:   'crm_usuarios',
  user:       'crm_user',
  version:    'crm_data_version',
}

// ── Datos iniciales de ejemplo ──────────────────────────────
const PROSPECTOS_INICIALES = [
  {
    id: 1, nombre: 'Empresa Verde S.A.', rfc: 'EVE800101AB1',
    contacto: 'Carlos Méndez', telefono: '5512345678',
    email: 'cmendez@empresaverde.mx', estatus: 'En seguimiento',
    servicio: 'Recolección de residuos', fecha: '2026-05-01',
    notas: 'Interesado en contrato anual', monto: 15000,
    tipoInmueble: 'Oficinas', periodicidadPago: 'Mensual',
    calle: 'Av. Reforma', numExt: '120', colonia: 'Centro', municipio: 'Mérida', cp: '97000', estado: 'Yucatán',
    adeudo: false,
  },
  {
    id: 2, nombre: 'Industrias del Norte', rfc: 'IND900201CD2',
    contacto: 'María García', telefono: '5587654321',
    email: 'mgarcia@inorte.mx', estatus: 'Nuevo',
    servicio: 'Tratamiento de aguas', fecha: '2026-05-10',
    notas: 'Requiere visita técnica', monto: 35000,
    tipoInmueble: 'Local', periodicidadPago: 'Trimestral',
    calle: 'Calle 54', numExt: '200', colonia: 'Itzimná', municipio: 'Mérida', cp: '97100', estado: 'Yucatán',
    adeudo: false,
  },
  {
    id: 3, nombre: 'Centro Comercial Plaza', rfc: 'CCP950315EF3',
    contacto: 'Roberto Silva', telefono: '5555550000',
    email: 'rsilva@plazacc.mx', estatus: 'Cotizado',
    servicio: 'Manejo integral de residuos', fecha: '2026-05-15',
    notas: 'Pendiente cotización formal', monto: 22000,
    tipoInmueble: 'Condominio Público', periodicidadPago: 'Semestral',
    calle: 'Av. Colón', numExt: '45', colonia: 'García Ginerés', municipio: 'Mérida', cp: '97070', estado: 'Yucatán',
    adeudo: false,
  },
  {
    id: 4, nombre: 'Hospital Regional', rfc: 'HRE010101GH4',
    contacto: 'Ana Martínez', telefono: '5599991111',
    email: 'amartinez@hospitalreg.mx', estatus: 'Adeudo',
    servicio: 'Residuos peligrosos', fecha: '2026-04-20',
    notas: 'Pago pendiente desde enero', monto: 48000,
    tipoInmueble: 'Oficinas', periodicidadPago: 'Anual',
    calle: 'Calle 59', numExt: '500', colonia: 'Centro Histórico', municipio: 'Mérida', cp: '97000', estado: 'Yucatán',
    adeudo: true,
  },
  {
    id: 5, nombre: 'Escuela Tecnológica', rfc: 'ETI880520IJ5',
    contacto: 'Luis Ramírez', telefono: '5533337777',
    email: 'lramirez@esctech.mx', estatus: 'Inactivo',
    servicio: 'Reciclaje educativo', fecha: '2026-05-18',
    notas: 'Servicio suspendido en marzo', monto: 8000,
    tipoInmueble: 'Casa', periodicidadPago: 'Mensual',
    calle: 'Calle 21', numExt: '88', colonia: 'Chuburná', municipio: 'Mérida', cp: '97200', estado: 'Yucatán',
    adeudo: false,
  },
]

const USUARIOS_INICIALES = [
  { id: 1, usuario: 'admin', password: 'admin123', nombre: 'Administrador', rol: 'admin' },
  { id: 2, usuario: 'vendedor', password: 'venta123', nombre: 'Vendedor CRM', rol: 'vendedor' },
]

// ── Inicialización con control de versiones ──────────────────
function inicializar() {
  const versionGuardada = localStorage.getItem(KEYS.version)

  // Si la versión no coincide, limpiar datos obsoletos y reinicializar
  if (versionGuardada !== DATA_VERSION) {
    console.log(`[CRM] Migrando datos ${versionGuardada || 'sin versión'} → ${DATA_VERSION}`)
    localStorage.removeItem(KEYS.prospectos)
    localStorage.removeItem(KEYS.usuarios)
    localStorage.setItem(KEYS.version, DATA_VERSION)
  }

  if (!localStorage.getItem(KEYS.prospectos)) {
    localStorage.setItem(KEYS.prospectos, JSON.stringify(PROSPECTOS_INICIALES))
  }
  if (!localStorage.getItem(KEYS.usuarios)) {
    localStorage.setItem(KEYS.usuarios, JSON.stringify(USUARIOS_INICIALES))
  }
}
inicializar()

// ── Helpers ──────────────────────────────────────────────────
function leer(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function guardar(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}
function nuevoId(lista) {
  return lista.length > 0 ? Math.max(...lista.map(i => i.id)) + 1 : 1
}

// ── AUTH ─────────────────────────────────────────────────────
export const auth = {
  login(usuario, password) {
    const usuarios = leer(KEYS.usuarios)
    const u = usuarios.find(u => u.usuario === usuario && u.password === password)
    if (u) {
      const sesion = { id: u.id, nombre: u.nombre, rol: u.rol, usuario: u.usuario }
      localStorage.setItem(KEYS.user, JSON.stringify(sesion))
      return { ok: true, user: sesion }
    }
    return { ok: false, error: 'Usuario o contraseña incorrectos' }
  },
  logout() {
    localStorage.removeItem(KEYS.user)
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem(KEYS.user)) } catch { return null }
  },
}

// ── PROSPECTOS ───────────────────────────────────────────────
export const prospectos = {
  getAll() {
    return leer(KEYS.prospectos)
  },
  getById(id) {
    return leer(KEYS.prospectos).find(p => p.id === Number(id)) || null
  },
  crear(data) {
    const lista = leer(KEYS.prospectos)
    const nuevo = { ...data, id: nuevoId(lista), fecha: data.fecha || new Date().toISOString().split('T')[0] }
    lista.push(nuevo)
    guardar(KEYS.prospectos, lista)
    return nuevo
  },
  actualizar(id, data) {
    const lista = leer(KEYS.prospectos)
    const idx = lista.findIndex(p => p.id === Number(id))
    if (idx === -1) return null
    lista[idx] = { ...lista[idx], ...data, id: Number(id) }
    guardar(KEYS.prospectos, lista)
    return lista[idx]
  },
  eliminar(id) {
    const lista = leer(KEYS.prospectos).filter(p => p.id !== Number(id))
    guardar(KEYS.prospectos, lista)
    return true
  },
}

// ── MÉTRICAS DASHBOARD ───────────────────────────────────────
export function getMetrics() {
  const lista = leer(KEYS.prospectos)
  const total = lista.length
  // Prospectos nuevos o en seguimiento (activos operativamente)
  const activos = lista.filter(p => p.estatus === 'Nuevo' || p.estatus === 'En seguimiento').length
  // Cotizaciones pendientes
  const cotizaciones = lista.filter(p => p.estatus === 'Cotizado').length
  // Clientes con adeudo
  const conAdeudo = lista.filter(p => p.estatus === 'Adeudo').length
  // Inactivos / dados de baja
  const inactivos = lista.filter(p => p.estatus === 'Inactivo').length
  // Monto total del padrón
  const montoTotal = lista.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
  // Monto de cotizaciones
  const montoCotizado = lista.filter(p => p.estatus === 'Cotizado').reduce((sum, p) => sum + (Number(p.monto) || 0), 0)

  return { total, activos, cotizaciones, conAdeudo, inactivos, montoTotal, montoCotizado }
}

// ── SERVICIOS (para cotizador) ───────────────────────────────
export const SERVICIOS = [
  { id: 1, nombre: 'Recolección de residuos sólidos', precio: 2500, unidad: 'mes' },
  { id: 2, nombre: 'Tratamiento de aguas residuales', precio: 8000, unidad: 'servicio' },
  { id: 3, nombre: 'Manejo integral de residuos', precio: 6000, unidad: 'mes' },
  { id: 4, nombre: 'Residuos peligrosos CRETIB', precio: 12000, unidad: 'servicio' },
  { id: 5, nombre: 'Reciclaje corporativo', precio: 3500, unidad: 'mes' },
  { id: 6, nombre: 'Auditoría ambiental', precio: 15000, unidad: 'proyecto' },
  { id: 7, nombre: 'Capacitación ambiental', precio: 4500, unidad: 'evento' },
  { id: 8, nombre: 'Disposición final controlada', precio: 9000, unidad: 'servicio' },
]
