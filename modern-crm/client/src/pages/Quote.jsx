import { useState, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { prospectos } from '../data'
import Layout from './Layout'
import MapView from './MapView'

export default function Quote() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const state = location.state || {}
  
  const prospectoIdParam = searchParams.get('prospecto') || state.prospecto_id

  const [items, setItems]           = useState([])
  const [prospecto, setProspecto]   = useState(prospectoIdParam || '')
  const [nota, setNota]             = useState('')
  const [guardado, setGuardado]     = useState(false)

  // Verificacion domicilio
  const [domicilio, setDomicilio]     = useState(state.verificacion_domicilio || '')
  const [diasServicio, setDiasServicio] = useState(state.dias_servicio_disponibles || '')
  const [horario, setHorario] = useState(state.horario || '')
  const [capacidad, setCapacidad] = useState(state.capacidad_disponible || '')
  const [ruta, setRuta] = useState(state.ruta || '')
  const [periodicidadPago, setPeriodicidadPago] = useState(state.periodicidad_pago || 'Mensual')
  const [lat, setLat]                 = useState(state.lat || '')
  const [lng, setLng]                 = useState(state.lng || '')
  const [adeudo, setAdeudo]           = useState('$0.00')
  const [geocodingMsg, setGeocodingMsg] = useState('')
  const [buscando, setBuscando]       = useState(false)

  const [lista, setLista]             = useState([])

  useEffect(() => {
    const fetchProspectos = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/prospectos')
        if (res.ok) {
          const data = await res.json()
          setLista(data)
        }
      } catch(e) { console.error('Error fetching prospectos', e) }
    }
    fetchProspectos()
  }, [])

  useEffect(() => {
    if (prospecto && lista.length > 0) {
      const p = lista.find(x => x.id == prospecto)
      if (p) {
        const dir = [p.calle, p.numExt, p.colonia, p.municipio, p.cp, p.estado].filter(Boolean).join(', ')
        setDomicilio(dir || '')
        setLat(p.lat || '')
        setLng(p.lng || '')
        setDiasServicio(p.dias_disponibles || '')
        setHorario(p.horario || '')
        setCapacidad(p.capacidad_disponible || '')
        setRuta(p.ruta || '')
        setPeriodicidadPago(p.periodicidadPago || 'Mensual')
        
        setItems(prev => prev.map(i => ({
            ...i,
            periodicidad_pago: p.periodicidadPago || 'Mensual',
            tipo_residuo: p.servicio || 'RSU',
            dias_asignados: (p.dias_disponibles || '').split(',').map(x => x.trim()).filter(Boolean)
        })))
      }
    }
  }, [prospecto, lista])

  // Geocodificacion con Nominatim (OpenStreetMap, sin API key)
  const buscarDomicilio = async () => {
    if (!domicilio.trim()) return
    setBuscando(true)
    setGeocodingMsg('')
    try {
      const q = encodeURIComponent(domicilio + ', Merida, Yucatan, Mexico')
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`)
      const data = await res.json()
      if (data.length > 0) {
        setLat(parseFloat(data[0].lat).toFixed(10))
        setLng(parseFloat(data[0].lon).toFixed(10))
        setGeocodingMsg('Domicilio localizado correctamente.')
      } else {
        setGeocodingMsg('No se encontro el domicilio. Ajusta el marcador en el mapa.')
      }
    } catch {
      setGeocodingMsg('Error al buscar domicilio. Revisa tu conexion.')
    }
    setBuscando(false)
  }

  const handleLocationChange = (newLat, newLng) => {
    setLat(newLat)
    setLng(newLng)
  }

  const toggleServicio = (srv) => {
    const existe = items.find(i => i.id === srv.id)
    if (existe) setItems(items.filter(i => i.id !== srv.id))
    else setItems([...items, { ...srv, cantidad: 1, porcentaje: 0, descuento: 0 }])
  }

  const updateItem = (id, field, val) =>
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i))

  const toggleDia = (itemId, dia) => {
    setItems(items.map(i => {
      if(i.id !== itemId) return i;
      const dias = i.dias_asignados || [];
      return { ...i, dias_asignados: dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias, dia] };
    }));
  }

  const subtotal  = items.reduce((s, i) => s + Math.max(0, (i.precio_unitario || 0) * (i.volumen_estimado || 1) * (1 + (i.porcentaje_adicional || 0) / 100)), 0)
  const iva       = subtotal * 0.16
  const total     = subtotal + iva

  const formatMXN = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  const handleGuardar = async () => {
    if (!prospecto) return alert('Selecciona un prospecto')
    if (items.length === 0) return alert('Agrega al menos un servicio')
    
    // Create Trato first (mock API call to create or get trato ID, assuming endpoint exists or backend logic handles it)
    try {
      const tratoRes = await fetch('http://localhost:5000/api/tratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospecto_id: prospecto,
          nombre_trato: 'Cotización CRM',
          importe: total,
          fase_id: 2
        })
      });
      const tratoData = tratoRes.ok ? await tratoRes.json() : { id: Date.now() }; // Fallback for local mock
      const tratoId = tratoData.id || tratoData.insertId || Date.now();

      for (const item of items) {
        await fetch('http://localhost:5000/api/servicios-cotizados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trato_id: tratoId,
            tipo_residuo: item.tipo_residuo,
            frecuencia: item.frecuencia,
            periodicidad_pago: item.periodicidad_pago,
            volumen_estimado: item.volumen_estimado,
            precio_unitario: item.precio_unitario,
            dias_asignados: (item.dias_asignados || []).join(','),
            porcentaje_adicional: item.porcentaje_adicional
          })
        });
      }
    } catch(e) { console.error("Error guardando servicios:", e) }

    prospectos.actualizar(Number(prospecto), {
      estatus: 'Cotizado',
      monto: Math.round(total),
      notas: `Cotización guardada. Domicilio: ${domicilio}. Días de servicio: ${diasServicio}. ${nota}`,
    })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const limpiar = () => { setItems([]); setProspecto(''); setNota(''); setDomicilio(''); setLat(''); setLng('') }

  const isSelected = (id) => items.some(i => i.id === id)
  const FREQ = ['Mensual', 'Trimestral', 'Semestral', 'Anual']

  return (
    <Layout title="Cotizador">
      <div className="page-header">
        <div>
          <h2 className="section-title">Cotizador</h2>
          <p className="section-sub">Calculo de cotizacion por servicios.</p>
        </div>
      </div>

      {guardado && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#2E7D32', fontWeight: 600 }}>
          Cotizacion guardada y prospecto actualizado correctamente
        </div>
      )}

      {/* Selector de prospecto y fechas */}
      <div className="card mb-4" style={{ marginBottom: 20 }}>
        <div className="card-header">
          Cotizador | {lista.find(p => p.id === Number(prospecto))?.nombre || 'Seleccionar prospecto'}
        </div>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
          <div className="form-group">
            <label className="form-label">Prospecto</label>
            <select className="form-input" value={prospecto} onChange={e => setProspecto(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {lista.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de inicio de cotizacion</label>
            <input className="form-input" type="date" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de limite de cotizacion</label>
            <input className="form-input" type="date" />
          </div>
        </div>
      </div>

      {/* Verificacion del domicilio */}
      <div className="card mb-4" style={{ marginBottom: 20 }}>
        <div className="card-header">VERIFICACIÓN DEL DOMICILIO Y DÍAS DE SERVICIO DISPONIBLES</div>
        <div style={{ padding: '0 20px 20px 20px' }}>
          {/* Header Búsqueda */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end', marginBottom: 20 }}>
            <div>
              <label className="form-label" style={{ fontSize: 13, color: '#333' }}>Domicilio de Servicio</label>
              <input
                className="form-input"
                style={{ backgroundColor: '#FCFBF8', borderColor: '#E0E0E0' }}
                value={domicilio}
                onChange={e => setDomicilio(e.target.value)}
                placeholder="Ej: Calle 54 #120, Merida, Yucatan"
                onKeyDown={e => e.key === 'Enter' && buscarDomicilio()}
              />
            </div>
            <div>
              <button className="btn btn-accent" onClick={buscarDomicilio} disabled={buscando} style={{ backgroundColor: '#A1887F', borderColor: '#A1887F', color: '#fff' }}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 24 }}>
            {/* Mapa Izquierda */}
            <div style={{ height: 320, borderRadius: 4, overflow: 'hidden', border: '1px solid #CFD8DC' }}>
                <MapView lat={lat} lng={lng} onLocationChange={handleLocationChange} />
            </div>

            {/* Inputs Centro */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" style={{ fontSize: 13, color: '#333' }}>Latitud del domicilio del servicio</label>
                <input className="form-input" style={{ backgroundColor: '#FCFBF8', borderColor: '#E0E0E0' }} value={lat} onChange={e => setLat(e.target.value)} placeholder="20.9700348..." />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 13, color: '#333' }}>Altitud del domicilio del servicio</label>
                <input className="form-input" style={{ backgroundColor: '#FCFBF8', borderColor: '#E0E0E0' }} value={lng} onChange={e => setLng(e.target.value)} placeholder="-89.6199727..." />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 13, color: '#333' }}>Adeudo del domicilio</label>
                <input className="form-input" style={{ backgroundColor: '#FCFBF8', borderColor: '#E0E0E0' }} value={adeudo} onChange={e => setAdeudo(e.target.value)} />
              </div>
              <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                {geocodingMsg && (
                  <p style={{ fontSize: 12, color: geocodingMsg.includes('No se encontro') || geocodingMsg.includes('Error') ? '#C62828' : '#2E7D32', fontWeight: 600 }}>
                    {geocodingMsg}
                  </p>
                )}
                {adeudo === '$0.00' && (
                  <p style={{ fontSize: 12, color: '#2E7D32', fontWeight: 700, marginTop: 4 }}>
                    Sin adeudo detectado en este domicilio.
                  </p>
                )}
              </div>
            </div>

            {/* Panel Derecha (Pills) */}
            <div style={{ backgroundColor: '#F1F8E9', border: '1px solid #AED581', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>Días disponibles</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(diasServicio || 'Sin asignar').split(',').map(d => (
                    <span key={d.trim()} style={{ backgroundColor: '#C8E6C9', color: '#2E7D32', padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: '1px solid #A5D6A7' }}>
                      {d.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Ruta</label>
                <div>
                  <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: '1px solid #BBDEFB' }}>
                    {ruta || 'Sin asignar'}
                  </span>
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Horario</label>
                <div>
                  <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: '1px solid #BBDEFB' }}>
                    {horario || 'Sin asignar'}
                  </span>
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Capacidad disponible</label>
                <div>
                  <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '4px 24px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: '1px solid #BBDEFB' }}>
                    {capacidad || '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Servicios a cotizar */}
      <div className="card mb-4" style={{ marginBottom: 20 }}>
        <div className="card-header">Servicios a cotizar</div>
        <div style={{ padding: 20 }}>
          {/* Encabezado de tabla */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 40px', gap: 8, padding: '8px 0', borderBottom: '2px solid var(--border)', marginBottom: 8 }}>
            {['Tipo de Residuo', 'Días', 'Frecuencia', 'Periodicidad Pago', 'Vol. Estimado', 'Precio U.', '% Adicional', 'Subtotal', ''].map((h, i) => (
              <span key={i} className="text-xs text-muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</span>
            ))}
          </div>

          {items.length === 0 && (
            <p className="text-muted text-sm" style={{ padding: '12px 0' }}>No hay servicios agregados.</p>
          )}

          {items.map(item => (
            <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 40px', gap: 8, alignItems: 'start' }}>
                <div>
                  <select className="form-input" value={item.tipo_residuo} onChange={e => updateItem(item.id, 'tipo_residuo', e.target.value)} disabled>
                    <option value="RSU">RSU (Residuos Sólidos Urbanos)</option>
                    <option value="RME">RME (Residuos de Manejo Especial)</option>
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, lineHeight: 1.2 }}>
                    {item.tipo_residuo === 'RSU' 
                      ? 'Basura regular, límite de 2 bolsas de 200L domiciliarias' 
                      : 'Requiere Plan de Manejo avalado por la SDS'}
                  </div>
                </div>

                <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                  {['Lun','Mar','Mie','Jue','Vie','Sab','Dom'].map(d => (
                    <div key={d} onClick={() => toggleDia(item.id, d)}
                         style={{ fontSize:10, padding:'4px 6px', borderRadius:12, cursor:'pointer', border:'1px solid var(--border)',
                         background: (item.dias_asignados||[]).includes(d) ? '#E8F5E9' : '#fff',
                         color: (item.dias_asignados||[]).includes(d) ? '#2E7D32' : 'var(--text3)',
                         fontWeight: (item.dias_asignados||[]).includes(d) ? 700 : 500 }}>
                      {d}
                    </div>
                  ))}
                </div>

                <select className="form-input" value={item.frecuencia} onChange={e => updateItem(item.id, 'frecuencia', e.target.value)}>
                  <option>Semanal</option>
                  <option>Quincenal</option>
                  <option>Mensual</option>
                  <option>Bimestral</option>
                </select>
                <select className="form-input" value={item.periodicidad_pago} onChange={e => updateItem(item.id, 'periodicidad_pago', e.target.value)} disabled>
                  <option value={periodicidadPago}>{periodicidadPago}</option>
                </select>
                <input className="form-input" type="number" min={1} value={item.volumen_estimado} onChange={e => updateItem(item.id, 'volumen_estimado', Math.max(1, Number(e.target.value)))} />
                <input className="form-input" type="number" min={0} step={0.1} value={item.precio_unitario} onChange={e => updateItem(item.id, 'precio_unitario', Number(e.target.value))} />
                <input className="form-input" type="number" min={0} step={0.1} value={item.porcentaje_adicional} onChange={e => updateItem(item.id, 'porcentaje_adicional', Number(e.target.value))} placeholder="%" />
                
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                  {formatMXN(Math.max(0, (item.precio_unitario || 0) * (item.volumen_estimado || 1) * (1 + (item.porcentaje_adicional || 0) / 100)))}
                </span>
                <button
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #EF9A9A', background: 'white', color: '#C62828', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                  onClick={() => setItems(items.filter(i => i.id !== item.id))}
                >-</button>
              </div>
            </div>
          ))}

          {/* Boton agregar */}
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => setItems([...items, {
              id: Date.now(), tipo_residuo: state.servicio || 'RSU', frecuencia: 'Semanal', periodicidad_pago: periodicidadPago, volumen_estimado: 1, precio_unitario: 0, dias_asignados: [], porcentaje_adicional: 0
            }])}>
              + Agregar servicio
            </button>
          </div>
        </div>
      </div>

      {/* Periodicidad + Totales */}
      <div className="card">
        <div className="card-header">Periodicidad de Pago</div>
        <div style={{ padding: 20 }}>
          <div className="freq-buttons" style={{ maxWidth: 500, marginBottom: 20 }}>
            {/* Eliminados botones globales de periodicidad ya que ahora están por fila */}
          </div>

          {/* Aviso pago */}
          <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
            <span style={{ color: '#E65100', fontWeight: 700 }}>i</span>
            <div>
              <div style={{ color: '#9E652E', fontWeight: 700, fontSize: 13 }}>Pago inicial solo por transferencia</div>
              <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 3 }}>
                Al generar y enviar esta cotizacion, el cliente recibira acceso al portal para aceptar y firmar. El primer pago es exclusivamente por transferencia bancaria.
              </div>
            </div>
          </div>

          {/* Totales */}
          <div style={{ maxWidth: 500, marginLeft: 'auto' }}>
            <div className="totals-box">
              <div className="totals-row"><span>Subtotal servicios</span><span>{formatMXN(subtotal)}</span></div>
              <div className="totals-row"><span>IVA (16%)</span><span>{formatMXN(iva)}</span></div>
              <div className="totals-total">
                <span>TOTAL A PAGAR</span>
                <span>{formatMXN(total)}</span>
              </div>
            </div>
          </div>

          {/* Notas y acciones */}
          <div className="form-group mt-4">
            <label className="form-label">Notas adicionales</label>
            <textarea className="form-input" value={nota} onChange={e => setNota(e.target.value)} rows={2} placeholder="Condiciones, vigencia, observaciones..." />
          </div>

          <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={limpiar}>Guardar borrador</button>
            <button className="btn btn-ghost" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Descargar PDF</button>
            <button className="btn btn-primary" onClick={handleGuardar}>Enviar al cliente</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
