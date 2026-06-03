import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { prospectos } from '../data'
import Layout from './Layout'
import MapView from './MapView'

function Field({label,value}){
  return(
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>{label}</div>
      <div style={{fontSize:14,color:'var(--text)',fontWeight:500}}>{value||'—'}</div>
    </div>
  )
}

function Alert({type,children}){
  const s={
    error:{background:'#FFEBEE',border:'1px solid #EF9A9A',color:'#C62828'},
    success:{background:'#E8F5E9',border:'1px solid #A5D6A7',color:'#2E7D32'},
  }
  return <div style={{...s[type],borderRadius:8,padding:'10px 14px',fontSize:13,marginBottom:14}}>{children}</div>
}

function Section({title,children}){
  return(
    <div className="card" style={{marginBottom:20}}>
      <div className="card-header">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  )
}

function getBadge(e){
  const m={Nuevo:'badge-prospecto','En seguimiento':'badge-cotizacion',
    Cotizado:'badge-cotizacion',Adeudo:'badge-perdido',Inactivo:'badge-cerrado'}
  return m[e]||'badge-prospecto'
}

const formatMXN=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0)

export default function ProspectoDetalle(){
  const {id}=useParams()
  const navigate=useNavigate()
  const [p,setP]=useState(null)
  const [mapState,setMapState]=useState({loading:false,url:null,notFound:false,label:''})

  useEffect(()=>{
    const found=prospectos.getById(Number(id))
    setP(found)
    if(found){geocodificar(found)}
  },[id])

  const MERIDA_BBOX = { minLat: 20.7, maxLat: 21.2, minLon: -89.9, maxLon: -89.4 }
  const dentroDeYucatan = (lat, lon) => lat >= MERIDA_BBOX.minLat && lat <= MERIDA_BBOX.maxLat && lon >= MERIDA_BBOX.minLon && lon <= MERIDA_BBOX.maxLon

  const limpiarDireccion = (calle) => (calle || '')
    .replace(/\s*-?\s*por\s+\d+\s+y\s+\d+/gi, '')
    .replace(/\s*entre\s+\d+\s+y\s+\d+/gi, '')
    .replace(/^C\.\s*/i, 'Calle ')
    .replace(/^Av\.\s*/i, 'Avenida ')
    .trim()

  const geocodificar=async(data)=>{
    if(!data.cp&&!data.municipio&&!data.calle) return
    setMapState({loading:true,url:null,notFound:false,label:'', precision:'', advertencia:''})

    // Usa lat/lng guardados si existen
    if(data.lat&&data.lng){
      setMapState({
        loading:false,url:true,notFound:false,
        label:[data.calle,data.numExt,data.colonia,data.municipio].filter(Boolean).join(', '),
        lat: data.lat, lng: data.lng,
        precision: data.coordenadas_manuales ? 'manual' : ''
      })
      return
    }

    const h={headers:{'User-Agent':'CRMCicloAmbiental/1.0'}}
    const calleLimpia=limpiarDireccion(data.calle)
    const numLimpio=limpiarDireccion(data.numExt)

    const intentos = [
      `${calleLimpia} ${numLimpio}, ${data.colonia||''}, ${data.cp||''}, Mérida, Yucatán, México`.replace(/,\s*,/g, ','),
      `${calleLimpia}, ${data.colonia||''}, Mérida, Yucatán, México`.replace(/,\s*,/g, ','),
      `${data.colonia||''}, ${data.municipio||''}, ${data.cp||''}, Yucatán, México`.replace(/,\s*,/g, ','),
    ]

    for (const query of intentos) {
      if (!query.replace(/,\s*/g,'').trim()) continue
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=mx&viewbox=-89.9,21.2,-89.4,20.7&bounded=1`
      try {
        const res = await fetch(url, h)
        const json = await res.json()
        if (json.length > 0) {
          const lat = parseFloat(json[0].lat)
          const lon = parseFloat(json[0].lon)
          if (dentroDeYucatan(lat, lon)) {
            setMapState({
              loading: false, url: true, notFound: false,
              label: json[0].display_name, lat, lng: lon,
              precision: json[0].type || json[0].class
            })
            return
          }
        }
      } catch (e) { console.error(e) }
    }
    
    // Fallback final
    setMapState({
      loading: false, url: true, notFound: false, label: '', lat: 20.9674, lng: -89.6237, precision: 'ciudad',
      advertencia: 'No se pudo geocodificar con precisión. Se muestra el centro de Mérida.'
    })
  }

  if(!p) return(
    <Layout title="Detalle de Prospecto">
      <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
        <div style={{fontSize:40,marginBottom:12}}></div>
        <p>Prospecto no encontrado.</p>
        <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>navigate('/prospectos')}>← Volver a Prospectos</button>
      </div>
    </Layout>
  )

  return(
    <Layout title={`Acciones — ${p.nombre}`}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="section-title">{p.nombre}</h2>
          <p className="section-sub">
            <span className={`badge ${getBadge(p.estatus)}`}>{p.estatus}</span>
            {p.tipoInmueble&&<span style={{marginLeft:10,color:'var(--text3)',fontSize:13}}>{p.tipoInmueble}</span>}
            {p.periodicidadPago&&<span style={{marginLeft:6,color:'var(--text3)',fontSize:13}}>· {p.periodicidadPago}</span>}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={()=>navigate('/prospectos')}>← Volver</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
        {/* Datos Personales */}
        <Section title="Datos Personales">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="Razón Social" value={p.nombre}/>
            <Field label="RFC" value={p.rfc}/>
            <Field label="Contacto" value={p.contacto}/>
            <Field label="Teléfono" value={p.telefono}/>
            <Field label="Email" value={p.email}/>
            <Field label="Fecha de Alta" value={p.fecha}/>
            <Field label="Servicio" value={p.servicio}/>
            <Field label="Monto Estimado" value={formatMXN(p.monto)}/>
            <Field label="Días Disponibles" value={p.dias_disponibles}/>
            <Field label="Horario" value={p.horario}/>
            <Field label="Capacidad Disponible" value={p.capacidad_disponible}/>
          </div>
          {p.notas&&(
            <div style={{marginTop:8,padding:'12px',background:'var(--bg2)',borderRadius:8,fontSize:13,color:'var(--text2)'}}>
              <div style={{fontWeight:700,marginBottom:4,fontSize:11,textTransform:'uppercase',color:'var(--text3)'}}>Notas</div>
              {p.notas}
            </div>
          )}
        </Section>

        {/* Dirección */}
        <Section title="Dirección">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="Calle" value={p.calle}/>
            <Field label="Núm. Ext / Int" value={[p.numExt,p.numInt].filter(Boolean).join(' / ')}/>
            <Field label="Colonia" value={p.colonia}/>
            <Field label="Municipio" value={p.municipio}/>
            <Field label="Código Postal" value={p.cp}/>
            <Field label="Estado" value={p.estado}/>
          </div>
          {p.adeudo
            ?<Alert type="error">Este domicilio tiene un adeudo pendiente. Contactar a cobranza.</Alert>
            :<Alert type="success">Sin adeudo detectado en este domicilio.</Alert>
          }
          {/* Mapa */}
          {mapState.loading&&(
            <div style={{background:'var(--bg2)',borderRadius:8,height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13}}>
              Cargando mapa...
            </div>
          )}
          {mapState.notFound&&!mapState.loading&&(
            <div style={{background:'var(--bg2)',borderRadius:8,height:80,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13,border:'1px solid var(--border)'}}>
              Dirección no encontrada en el mapa
            </div>
          )}
          {mapState.url&&(
            <div>
              {mapState.label&&<div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>{mapState.label}</div>}
              
              {mapState.advertencia && <Alert type="error">{mapState.advertencia}</Alert>}
              {!mapState.advertencia && mapState.precision && (
                <div style={{marginBottom:8}}>
                  {mapState.precision === 'manual' ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#E3F2FD',color:'#1565C0',fontWeight:'bold'}}>Coordenadas ajustadas manualmente</span> :
                   ['house','building'].includes(mapState.precision) ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#E8F5E9',color:'#2E7D32',fontWeight:'bold'}}>Ubicación exacta</span> :
                   ['street'].includes(mapState.precision) ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#FFF8E1',color:'#F57F17',fontWeight:'bold'}}>Aproximado a la calle</span> :
                   <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#FFF3E0',color:'#E65100',fontWeight:'bold'}}>Aproximado a la colonia</span>}
                </div>
              )}

              <div style={{width:'100%',height:240,borderRadius:8,overflow:'hidden'}}>
                <MapView 
                  lat={mapState.lat} 
                  lng={mapState.lng} 
                  onLocationChange={(lat,lng)=>{
                    // Si el usuario ajusta el pin, guardamos en base de datos
                    prospectos.actualizar(p.id, {lat, lng, coordenadas_manuales: true})
                  }}
                />
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Acciones disponibles */}
      <Section title="Acciones Disponibles">
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={()=>navigate('/cotizacion', {
            state: {
              prospecto_id: p.id,
              calle: p.calle,
              numExt: p.numExt,
              colonia: p.colonia,
              municipio: p.municipio,
              cp: p.cp,
              estado: p.estado,
              lat: p.lat,
              lng: p.lng,
              dias_servicio_disponibles: p.dias_disponibles,
              horario: p.horario,
              capacidad_disponible: p.capacidad_disponible,
              periodicidad_pago: p.periodicidadPago,
              verificacion_domicilio: p.verificacion_domicilio
            }
          })}>
            Generar Cotización
          </button>
          <button className="btn btn-ghost" onClick={()=>{
            if(confirm(`¿Marcar como Inactivo a ${p.nombre}?`)){
              prospectos.actualizar(p.id,{estatus:'Inactivo'})
              navigate('/prospectos')
            }
          }}>
            Dar de Baja
          </button>
        </div>
      </Section>
    </Layout>
  )
}
