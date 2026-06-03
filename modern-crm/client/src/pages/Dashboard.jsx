import { useState, useEffect } from 'react'
import Layout from './Layout'

const ORIGEN_COLORS = {
  'Web Download':       '#4DB6AC',
  'Online Store':       '#81C784',
  'Partner':            '#FFB74D',
  'External Referral':  '#E57373',
  'Advertisement':      '#BA68C8',
  'Cold Call':          '#64B5F6',
  'Seminar Partner':    '#FFD54F',
  'Default':            '#BDBDBD'
}

export default function Dashboard() {
  const [data, setData] = useState({ kpis: null, origenes: [], recientes: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:5000/api/dashboard')
        if (!response.ok) throw new Error('Error al obtener los datos')
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        console.error(err)
        setError('No se pudo conectar a la base de datos MySQL local.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const formatMXN = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n || 0)

  if (loading) return <Layout title="Análisis"><div style={{ padding: 40 }}>Cargando análisis...</div></Layout>
  if (error) return <Layout title="Análisis"><div style={{ padding: 40, color: 'red' }}>{error}</div></Layout>

  const { kpis, origenes, recientes, monitor = {} } = data

  // KPIs principales
  const posiblesClientesMes = kpis.prospectosActivos || 0;
  const ingresosMes = kpis.tratosEnProceso.sum || 0;
  const tratosProceso = kpis.tratosEnProceso.count || 0;
  const cuentasMes = kpis.clientesTotales || 0;
  
  const objetivoClientes = 1000;
  const clientesActuales = posiblesClientesMes;
  const pctClientes = Math.min((clientesActuales / objetivoClientes) * 100, 100);
  
  const objetivoIngresos = 700000;
  const ingresosActuales = ingresosMes;

  // Monitor de Rendimiento — datos reales
  const mesNombre = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    .replace(/^(\w)/, c => c.toUpperCase());
  const monitorRows = [
    ['POSIBLES CLIENTES CREADO', monitor.prospectosCreados ?? 0, false],
    ['TRATOS CREADO',           monitor.tratosCreados ?? 0,     true],
    ['TRATOS OBTENIDO',         monitor.tratosObtenidos ?? 0,   false],
    ['INGRESOS OBTENIDOS',      monitor.ingresosObtenidos ?? 0, false],
    ['IMPORTE ABIERTO',         monitor.importeAbierto ?? 0,    false],
  ];
  
  const totalOrigenes = origenes.reduce((sum, item) => sum + item.cantidad, 0)
  const origenesData = origenes.map(d => ({
    origen: d.origen || 'Desconocido', count: d.cantidad,
    pct: totalOrigenes > 0 ? Math.round((d.cantidad / totalOrigenes) * 100) : 0,
  })).sort((a, b) => b.count - a.count)

  let cumPct = 0
  const pieSegments = origenesData.map(d => {
    const start = cumPct
    cumPct += d.pct
    return `${ORIGEN_COLORS[d.origen] || ORIGEN_COLORS['Default']} ${start}% ${Math.min(cumPct, 100)}%`
  })
  const pieCss = pieSegments.length > 0 ? `conic-gradient(${pieSegments.join(', ')})` : '#eee'

  // Componente de Tarjeta Base
  const Card = ({ title, children, style = {} }) => (
    <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ flex: 1, padding: '0 20px 20px' }}>
        {children}
      </div>
    </div>
  )

  return (
    <Layout title="Análisis">
      {/* Header Estilo Zoho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13, background: '#fff' }}>
            <option>Todos ▼</option>
          </select>
          <select style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13, background: '#fff' }}>
            <option>☆ Visión general de organización ▼</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '6px 12px', border: '1px solid #ccc', background: '#fff', borderRadius: 4, fontSize: 13, cursor:'pointer' }}>↻</button>
          <button style={{ padding: '6px 12px', border: '1px solid #ccc', background: '#fff', borderRadius: 4, fontSize: 13, cursor:'pointer' }}>+ Agregar componente</button>
          <button style={{ padding: '6px 16px', border: 'none', background: '#2B54E4', color: '#fff', borderRadius: 4, fontSize: 13, cursor:'pointer' }}>Crear panel de información</button>
          <button style={{ padding: '6px 12px', border: '1px solid #ccc', background: '#fff', borderRadius: 4, fontSize: 13, cursor:'pointer' }}>•••</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* ROW 1: 4 KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <Card title="POSIBLES CLIENTES ESTE MES">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ fontSize: 24, color: '#333' }}>{posiblesClientesMes}</span>
              <span style={{ fontSize: 11, color: '#2E7D32', fontWeight: 600 }}>▲ 100%</span>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 30 }}>Relativo al mes pasado: 0</div>
          </Card>
          <Card title="INGRESOS DE ESTE MES">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ fontSize: 24, color: '#333' }}>{formatMXN(ingresosMes)}</span>
            </div>
          </Card>
          <Card title="TRATOS EN PROCESO">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ fontSize: 24, color: '#333' }}>{tratosProceso}</span>
            </div>
          </Card>
          <Card title="CUENTAS ESTE MES">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ fontSize: 24, color: '#333' }}>{cuentasMes}</span>
              <span style={{ fontSize: 11, color: '#2E7D32', fontWeight: 600 }}>▲ 100%</span>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 30 }}>Relativo al mes pasado: 0</div>
          </Card>
        </div>

        {/* ROW 2: Gauges & Progress */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <Card title="POSIBLE CLIENTE OBJETIVO DE GENERACIÓN - ESTE AÑO" style={{ height: 260 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginTop: -20 }}>
              {/* Speedometer CSS */}
              <div style={{ position: 'relative', width: 220, height: 110, overflow: 'hidden' }}>
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: 220, height: 220, 
                  borderRadius: '50%', background: '#e0e0e0',
                  clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'
                }}>
                   <div style={{
                     width: '100%', height: '100%', borderRadius: '50%',
                     background: 'conic-gradient(from -90deg, #A5D6A7 0deg, #A5D6A7 90deg, transparent 90deg)',
                     transform: `rotate(${(pctClientes/100)*180}deg)`,
                     transformOrigin: 'center center'
                   }} />
                </div>
                {/* Aguja */}
                <div style={{
                  position: 'absolute', bottom: -5, left: '50%', width: 10, height: 115,
                  background: '#333', transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${(pctClientes/100)*180 - 90}deg)`,
                  borderRadius: '10px 10px 0 0'
                }} />
                <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', width: 20, height: 20, background: '#333', borderRadius: '50%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, marginTop: 10, fontSize: 11, color: '#666' }}>
                <span>0</span>
                <span style={{ fontWeight: 700 }}>Restante: {objetivoClientes - clientesActuales}</span>
                <span>{objetivoClientes}</span>
              </div>
            </div>
          </Card>

          <Card title="OBJETIVO DE INGRESOS - ESTE AÑO" style={{ height: 260 }}>
            <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, width: 120 }}>Toda la organización</span>
              <div style={{ flex: 1, position: 'relative' }}>
                {/* Etiqueta tooltip */}
                <div style={{ position: 'absolute', top: -50, left: 0, background: '#fff', border: '1px solid #ccc', padding: '6px 12px', fontSize: 11, zIndex: 2, borderRadius: 4 }}>
                  <div style={{ fontWeight: 600 }}>Alcanzado: {formatMXN(ingresosActuales)}</div>
                  <div>Logrado: {Math.round((ingresosActuales/objetivoIngresos)*100)}% de {formatMXN(objetivoIngresos)}</div>
                </div>
                
                {/* Barra de progreso */}
                <div style={{ width: '100%', height: 40, background: '#e0e0e0', position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min((ingresosActuales/objetivoIngresos)*100, 100)}%`, height: '100%', background: '#A5D6A7', display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, fontWeight: 700, color: '#2E7D32' }}>
                    {formatMXN(ingresosActuales)}
                  </div>
                  <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', borderRight: '2px dashed #333' }} />
                </div>
              </div>
            </div>
            
            {/* Eje X */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 130, marginTop: 5, fontSize: 9, color: '#888' }}>
              <span>$0</span><span>$350k</span><span>$700k</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, marginTop: 10, marginLeft: 130, color: '#666' }}>Suma de Importe (MXN)</div>
          </Card>
        </div>

        {/* ROW 3: Tablas y Dona */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          
          <Card title="MONITOR DE RENDIMIENTO - ÚLTIMOS 3 MESES" style={{ height: 350 }}>
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, paddingBottom: 8, borderBottom: '2px solid #2B54E4', marginBottom: 12 }}>
              {mesNombre}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {monitorRows.map(([lbl, val, bg], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '16px 0', background: bg ? '#f5f7ff' : 'transparent', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 10, color: '#666' }}>{lbl}</div>
                  <div style={{ fontSize: 11, textAlign: 'center', fontWeight: 600 }}>
                    {typeof val === 'number' && (lbl.includes('INGRESOS') || lbl.includes('IMPORTE'))
                      ? formatMXN(val)
                      : val
                    }
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="POSIBLES CLIENTES POR ORIGEN" style={{ height: 350, position: 'relative' }}>
             {origenesData.length > 0 ? (
               <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 180, height: 180, borderRadius: '50%', background: pieCss, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 110, height: 110, background: '#fff', borderRadius: '50%' }}></div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 10, overflowY: 'auto', maxHeight: 200 }}>
                  {origenesData.map(d => (
                    <div key={d.origen} style={{ display: 'flex', alignItems: 'center', fontSize: 11 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ORIGEN_COLORS[d.origen] || ORIGEN_COLORS['Default'], marginRight: 6, flexShrink: 0 }}></div>
                      <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.origen}</div>
                      <div style={{ fontWeight: 600, marginLeft: 6 }}>{d.count} ({d.pct}%)</div>
                    </div>
                  ))}
                </div>
               </div>
             ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12, color: '#aaa' }}>No hay datos suficientes para la gráfica</div>
             )}
          </Card>

          <Card title="REPRESENTANTES DE VENTAS PRODUCTIVOS" style={{ height: 350 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '8px 0', fontSize: 11, fontWeight: 400, color: '#666', textAlign: 'left' }}>Propietario De Trato</th>
                  <th style={{ padding: '8px 0', fontSize: 11, fontWeight: 400, color: '#666', textAlign: 'right' }}>Suma De Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 0', fontSize: 11, color: '#333' }}>1. Joel Antonio Pool Martinez</td>
                  <td style={{ padding: '12px 0', fontSize: 11, color: '#333', textAlign: 'right' }}>{formatMXN(ingresosMes)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

        </div>
      </div>
    </Layout>
  )
}
