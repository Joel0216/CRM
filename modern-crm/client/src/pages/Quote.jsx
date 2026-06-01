import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SERVICIOS, prospectos } from '../data'
import Layout from './Layout'
import MapView from './MapView'

export default function Quote() {
  const [searchParams] = useSearchParams()
  const prospectoIdParam = searchParams.get('prospecto')

  const [items, setItems]           = useState([])
  const [prospecto, setProspecto]   = useState(prospectoIdParam || '')
  const [nota, setNota]             = useState('')
  const [frecuencia, setFrecuencia] = useState('Mensual')
  const [guardado, setGuardado]     = useState(false)

  // Verificacion domicilio
  const [domicilio, setDomicilio]     = useState('')
  const [lat, setLat]                 = useState('')
  const [lng, setLng]                 = useState('')
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
    if (prospectoIdParam && lista.length > 0) {
      const p = lista.find(x => x.id === Number(prospectoIdParam))
      if (p) {
        const dir = [p.calle, p.numExt, p.colonia, p.municipio, p.cp, p.estado].filter(Boolean).join(', ')
        if (dir) setDomicilio(dir)
        if (p.lat) setLat(p.lat)
        if (p.lng) setLng(p.lng)
        if (p.periodicidadPago) setFrecuencia(p.periodicidadPago)
      }
    }
  }, [prospectoIdParam, lista])

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

  const subtotal  = items.reduce((s, i) => s + Math.max(0, i.precio * i.cantidad * (1 + (i.porcentaje || 0) / 100) * (1 - (i.descuento || 0) / 100)), 0)
  const iva       = subtotal * 0.16
  const total     = subtotal + iva

  const formatMXN = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  const handleGuardar = () => {
    if (!prospecto) return alert('Selecciona un prospecto')
    if (items.length === 0) return alert('Agrega al menos un servicio')
    const servicios = items.map(i => `${i.nombre} (x${i.cantidad})`).join(', ')
    prospectos.actualizar(Number(prospecto), {
      estatus: 'Cotizacion',
      monto: Math.round(total),
      notas: `Cotizacion ${frecuencia}: ${servicios}. Domicilio: ${domicilio}. ${nota}`,
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
            <select className="form-input" value={prospecto} onChange={e => {
              setProspecto(e.target.value)
              const p=lista.find(x=>x.id===Number(e.target.value))
              if(p){
                const dir=[p.calle,p.numExt,p.colonia,p.municipio,p.cp,p.estado].filter(Boolean).join(', ')
                if(dir) setDomicilio(dir)
                if(p.lat) setLat(p.lat)
                if(p.lng) setLng(p.lng)
                if(p.periodicidadPago) setFrecuencia(p.periodicidadPago)
              }
            }}>
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
        <div className="card-header">Verificacion del Domicilio</div>
        <div style={{ padding: 20 }}>
          {/* Busqueda de domicilio */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Domicilio de Servicio</label>
              <input
                className="form-input"
                value={domicilio}
                onChange={e => setDomicilio(e.target.value)}
                placeholder="Ej: Calle 54 #120, Merida, Yucatan"
                onKeyDown={e => e.key === 'Enter' && buscarDomicilio()}
              />
            </div>
            <div style={{ paddingTop: 22 }}>
              <button className="btn btn-accent" onClick={buscarDomicilio} disabled={buscando}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Mapa + campos lat/lng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
            <div style={{ height: 280, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapView lat={lat} lng={lng} onLocationChange={handleLocationChange} />
            </div>

            <div>
              <div className="form-group">
                <label className="form-label">Latitud del domicilio</label>
                <input className="form-input" value={lat} onChange={e => setLat(e.target.value)} placeholder="20.9700348..." />
              </div>
              <div className="form-group">
                <label className="form-label">Longitud del domicilio</label>
                <input className="form-input" value={lng} onChange={e => setLng(e.target.value)} placeholder="-89.6199727..." />
              </div>
              <div className="form-group">
                <label className="form-label">Adeudo del domicilio</label>
                <input className="form-input" value={adeudo} onChange={e => setAdeudo(e.target.value)} />
              </div>
              {geocodingMsg && (
                <p style={{ fontSize: 12, color: geocodingMsg.includes('No se encontro') || geocodingMsg.includes('Error') ? '#C62828' : '#2E7D32', fontWeight: 500 }}>
                  {geocodingMsg}
                </p>
              )}
              {adeudo === '$0.00' && (
                <p style={{ fontSize: 12, color: '#9E652E', fontWeight: 500, marginTop: 4 }}>
                  Sin adeudo detectado en este domicilio.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Servicios a cotizar */}
      <div className="card mb-4" style={{ marginBottom: 20 }}>
        <div className="card-header">Servicios a cotizar</div>
        <div style={{ padding: 20 }}>
          {/* Encabezado de tabla */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 100px 90px 90px 100px 36px', gap: 8, padding: '8px 0', borderBottom: '2px solid var(--border)', marginBottom: 8 }}>
            {['Servicio', 'Frecuencia', 'Veces', 'Precio Unitario', '% adicional', 'Descuento', 'Subtotal', ''].map((h, i) => (
              <span key={i} className="text-xs text-muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</span>
            ))}
          </div>

          {items.length === 0 && (
            <p className="text-muted text-sm" style={{ padding: '12px 0' }}>No hay servicios agregados.</p>
          )}

          {items.map(item => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 100px 90px 90px 100px 36px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{frecuencia}</span>
              <input
                className="form-input"
                type="number" min={1}
                style={{ padding: '5px 8px', fontSize: 12 }}
                value={item.cantidad}
                onChange={e => updateItem(item.id, 'cantidad', Math.max(1, Number(e.target.value)))}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{formatMXN(item.precio)}</span>
              <input
                className="form-input"
                type="number" min={0} step={0.1}
                style={{ padding: '5px 8px', fontSize: 12 }}
                value={item.porcentaje}
                onChange={e => updateItem(item.id, 'porcentaje', Number(e.target.value))}
                placeholder="0.0"
              />
              <div style={{display:'flex', alignItems:'center', gap:4}}>
                <input
                  className="form-input"
                  type="number" min={0} step={0.1}
                  style={{ padding: '5px 8px', fontSize: 12, width:'100%' }}
                  value={item.descuento || ''}
                  onChange={e => updateItem(item.id, 'descuento', Number(e.target.value))}
                  placeholder="0.0"
                />
                <span style={{fontSize:12}}>%</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                {formatMXN(Math.max(0, item.precio * item.cantidad * (1 + (item.porcentaje || 0) / 100) * (1 - (item.descuento || 0) / 100)))}
              </span>
              <button
                style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #EF9A9A', background: 'white', color: '#C62828', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setItems(items.filter(i => i.id !== item.id))}
              >-</button>
            </div>
          ))}

          {/* Selector de servicios */}
          <div style={{ marginTop: 16 }}>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 280 }}
              onChange={e => {
                const srv = SERVICIOS.find(s => s.id === Number(e.target.value))
                if (srv && !isSelected(srv.id)) toggleServicio(srv)
                e.target.value = ''
              }}
              defaultValue=""
            >
              <option value="" disabled>+ Agregar servicio...</option>
              {SERVICIOS.filter(s => !isSelected(s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Periodicidad + Totales */}
      <div className="card">
        <div className="card-header">Periodicidad de Pago</div>
        <div style={{ padding: 20 }}>
          <div className="freq-buttons" style={{ maxWidth: 500, marginBottom: 20 }}>
            {FREQ.map(f => (
              <button key={f} className={`freq-btn ${frecuencia === f ? 'active' : ''}`} onClick={() => setFrecuencia(f)}>
                <div style={{ fontWeight: 600 }}>{f}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {f==='Mensual'?'Pago cada mes':f==='Trimestral'?'Pago cada 3 meses':f==='Semestral'?'Pago cada 6 meses':'Pago único anual'}
                </div>
              </button>
            ))}
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
                <span>TOTAL {frecuencia.toUpperCase()}</span>
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
