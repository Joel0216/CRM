import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import MapView from './MapView'

const ESTATUSES = ['Nuevo','En seguimiento','Cotizado','Adeudo','Inactivo']
// Tipos base — el condominio muestra sub-opción Público/Privado
const TIPOS_BASE = ['Casa','Condominio','Oficinas','Local']
const PERIODICIDADES = ['Mensual','Trimestral','Semestral','Anual']

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const TELEFONO_RE = /^\+?[\d\s\-\(\)]{7,20}$/
const CP_RE       = /^\d{5}$/

const EMPTY = {
  nombre:'',rfc:'',contacto:'',telefono:'',email:'',
  estatus:'Nuevo',notas:'',
  tipoInmueble:'', tipoPersona:'Moral', tieneSucursales:'No',
  sucursales:[], contactos:[],
  dias_disponibles:'', horario:'',
  calle:'',numExt:'',numInt:'',colonia:'',municipio:'',cp:'',estado:'',
  adeudo:false,
  foto_comprobante:null, foto_fachada:null
}

function getBadge(e){
  const m={Nuevo:'badge-prospecto','En seguimiento':'badge-cotizacion',
    Cotizado:'badge-cotizacion',Adeudo:'badge-perdido',Inactivo:'badge-cerrado'}
  return m[e]||'badge-prospecto'
}

/* ── Componentes FUERA del componente principal para evitar pérdida de foco ── */
function FInput({label,campo,value,onChange,error,type='text',placeholder='',full=false,req=false}){
  return(
    <div className="form-group" style={full?{gridColumn:'1/-1'}:{}}>
      <label className="form-label">{label}{req?' *':''}</label>
      <input className="form-input" type={type} value={value||''} placeholder={placeholder}
        style={error?{borderColor:'#C62828'}:{}}
        onChange={e=>onChange(campo,e.target.value)}/>
      {error&&<span style={{fontSize:11,color:'#C62828'}}>{error}</span>}
    </div>
  )
}

function FSelect({label,campo,value,onChange,error,options,req=false}){
  return(
    <div className="form-group">
      <label className="form-label">{label}{req?' *':''}</label>
      <select className="form-input" value={value||''} style={error?{borderColor:'#C62828'}:{}}
        onChange={e=>onChange(campo,e.target.value)}>
        {req&&<option value="">-- Seleccionar --</option>}
        {options.map(o => {
          if (typeof o === 'object') return <option key={o.val} value={o.val}>{o.lbl}</option>
          return <option key={o} value={o}>{o}</option>
        })}
      </select>
      {error&&<span style={{fontSize:11,color:'#C62828'}}>{error}</span>}
    </div>
  )
}

function Alert({type,children}){
  const s={
    error:{background:'#FFEBEE',border:'1px solid #EF9A9A',color:'#C62828'},
    warn:{background:'#FFF3E0',border:'1px solid #FFCC80',color:'#E65100'},
    info:{background:'#E3F2FD',border:'1px solid #90CAF9',color:'#1565C0'},
    success:{background:'#E8F5E9',border:'1px solid #A5D6A7',color:'#2E7D32'},
  }
  return <div style={{...s[type],borderRadius:8,padding:'10px 14px',fontSize:13,marginBottom:14}}>{children}</div>
}

function Modal({title,onClose,wide,children}){
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:wide?720:580}}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'white',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cerrar</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function Tabs({tabs,active,onChange}){
  return(
    <div style={{display:'flex',borderBottom:'2px solid var(--border)',marginBottom:20}}>
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)} style={{
          padding:'10px 20px',border:'none',background:'none',cursor:'pointer',fontFamily:'inherit',
          fontSize:13,fontWeight:600,color:active===t?'var(--brown-dark)':'var(--text3)',
          borderBottom:active===t?'2px solid var(--brown-dark)':'2px solid transparent',marginBottom:-2}}>
          {t}
        </button>
      ))}
    </div>
  )
}

/* ── Pestañas del formulario — FUERA del componente principal ── */
function TabDatos({form,onChange,errors}){
  // Lógica del tipo de inmueble con sub-opción de condominio
  const esCondominio = (form.tipoInmueble||'').startsWith('Condominio')
  const tipoBase = esCondominio ? 'Condominio' : (form.tipoInmueble||'')
  const subCondominio = form.tipoInmueble === 'Condominio Privado' ? 'Privado' : 'Público'

  const handleTipoChange = (valor) => {
    if (valor === 'Condominio') {
      onChange('tipoInmueble', 'Condominio Público') // default: Público
    } else {
      onChange('tipoInmueble', valor)
    }
  }

  const [modalS, setModalS] = useState(false);
  const [modalC, setModalC] = useState(false);
  const [sForm, setSForm] = useState({});
  const [cForm, setCForm] = useState({});
  const [editIdx, setEditIdx] = useState(-1);
  const [tabS, setTabS] = useState('DATOS PERSONALES');

  return(
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
      <FInput campo="nombre" label="Razón Social" req full value={form.nombre} onChange={onChange} error={errors.nombre} placeholder="Nombre o razón social"/>
      <FInput campo="contacto" label="Nombre completo del contacto" value={form.contacto} onChange={onChange} error={errors.contacto}/>
      <FInput campo="telefono" label="Teléfono" req value={form.telefono} onChange={onChange} error={errors.telefono} placeholder="10 dígitos"/>
      <FInput campo="rfc" label="RFC" value={form.rfc} onChange={onChange} error={errors.rfc} placeholder="RFC (opcional)"/>
      
      <FSelect campo="tieneSucursales" label="Tienes sucursales" options={['-- Seleccionar --', 'Sí', 'No']} value={form.tieneSucursales} onChange={onChange} error={null}/>
      
      <FSelect campo="tipoPersona" label="Tipo de persona" options={['-- Seleccionar --', 'Física', 'Moral']} value={form.tipoPersona} onChange={onChange} error={null}/>
      <FInput campo="email" label="Email" req type="email" value={form.email} onChange={onChange} error={errors.email} placeholder="correo@empresa.mx"/>

      {/* Tipo de Inmueble */}
      <div className="form-group">
        <label className="form-label">Tipo de Inmueble *</label>
        <select className="form-input" value={tipoBase}
          style={errors.tipoInmueble?{borderColor:'#C62828'}:{}}
          onChange={e=>handleTipoChange(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          {TIPOS_BASE.map(o=><option key={o}>{o}</option>)}
        </select>
        {errors.tipoInmueble&&<span style={{fontSize:11,color:'#C62828'}}>{errors.tipoInmueble}</span>}
      </div>

      {/* Sub-opción Condominio Público / Privado */}
      {esCondominio ? (
        <div className="form-group">
          <label className="form-label">¿Es Público o Privado? *</label>
          <div style={{display:'flex',gap:20,marginTop:6}}>
            {['Público','Privado'].map(sub=>(
              <label key={sub} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',
                padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:500,
                background: subCondominio===sub?'#FFF3E0':'#fafafa',
                border: subCondominio===sub?'2px solid #E65100':'2px solid #e0e0e0',
                color: subCondominio===sub?'#E65100':'#777',
                transition:'all 0.15s',
              }}>
                <input type="radio" name="subCondominio" value={sub}
                  checked={subCondominio===sub}
                  onChange={()=>onChange('tipoInmueble',`Condominio ${sub}`)}
                  style={{display:'none'}}/>
                {sub}
              </label>
            ))}
          </div>
          <div style={{fontSize:11,color:'#aaa',marginTop:4}}>
            Valor guardado: <strong>{form.tipoInmueble}</strong>
          </div>
        </div>
      ) : (
        <div />
      )}

      <div />
      
      <div className="form-group">
        <label className="form-label">Días disponibles</label>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:4}}>
          {['Lun','Mar','Mie','Jue','Vie','Sab','Dom'].map(d => {
            const arr = (form.dias_disponibles||'').split(',').map(x=>x.trim()).filter(Boolean);
            const active = arr.includes(d);
            return (
              <div key={d} onClick={() => {
                const n = active ? arr.filter(x=>x!==d) : [...arr, d];
                onChange('dias_disponibles', n.join(', '));
              }}
              style={{ fontSize:12, padding:'6px 10px', borderRadius:14, cursor:'pointer', border:'1px solid var(--border)',
              background: active ? '#E8F5E9' : '#fff',
              color: active ? '#2E7D32' : 'var(--text3)',
              fontWeight: active ? 700 : 500, transition: 'all 0.2s' }}>
                {d}
              </div>
            )
          })}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Horario (Rango de horas)</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="form-input" type="time" value={(form.horario || '').split(' - ')[0] || ''} onChange={e => {
            const end = (form.horario || '').split(' - ')[1] || '';
            onChange('horario', `${e.target.value}${end ? ' - ' + end : ''}`);
          }} />
          <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>a</span>
          <input className="form-input" type="time" value={(form.horario || '').split(' - ')[1] || ''} onChange={e => {
            const start = (form.horario || '').split(' - ')[0] || '';
            onChange('horario', `${start ? start + ' - ' : ''}${e.target.value}`);
          }} />
        </div>
      </div>

      <FSelect campo="estatus" label="Estatus" options={ESTATUSES} value={form.estatus} onChange={onChange} error={null}/>
      
      {form.tieneSucursales === 'Sí' && (
        <div style={{gridColumn:'1/-1', marginTop:16}}>
          <div style={{fontWeight:700, color:'var(--brown-dark)', borderBottom:'2px solid var(--border)', paddingBottom:4, marginBottom:12, textTransform:'uppercase'}}>
            &gt; GESTIÓN DE SUCURSALES
          </div>
          {(form.sucursales||[]).map((s, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)', padding:'8px 0'}}>
              <span style={{fontWeight:600, fontSize:13}}>{s.nombre_sucursal}</span>
              <div style={{display:'flex', gap:10}}>
                <button className="btn btn-sm btn-ghost" style={{padding:'4px 8px'}} onClick={(e)=>{e.preventDefault(); setSForm(s); setEditIdx(i); setModalS(true)}}>👁</button>
                <button className="btn btn-sm btn-danger" style={{padding:'4px 8px'}} onClick={(e)=>{e.preventDefault(); onChange('sucursales', form.sucursales.filter((_, idx)=>idx!==i))}}>−</button>
              </div>
            </div>
          ))}
          <div style={{textAlign:'right', marginTop:12}}>
            <button className="btn btn-sm" style={{background:'var(--brown-dark)', color:'white'}} onClick={(e)=>{e.preventDefault(); setSForm({}); setEditIdx(-1); setModalS(true)}}>+ Agregar Sucursal</button>
          </div>
        </div>
      )}

      <div style={{gridColumn:'1/-1', marginTop:16}}>
        <div style={{fontWeight:700, color:'var(--brown-dark)', borderBottom:'2px solid var(--border)', paddingBottom:4, marginBottom:12, textTransform:'uppercase'}}>
          &gt; DATOS DE CONTACTO
        </div>
        {(form.contactos||[]).map((c, i) => (
          <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)', padding:'8px 0'}}>
            <span style={{fontWeight:600, fontSize:13}}>{c.nombre_contacto}</span>
            <div style={{display:'flex', gap:10}}>
              <button className="btn btn-sm btn-ghost" style={{padding:'4px 8px'}} onClick={(e)=>{e.preventDefault(); setCForm(c); setEditIdx(i); setModalC(true)}}>👁</button>
              <button className="btn btn-sm btn-danger" style={{padding:'4px 8px'}} onClick={(e)=>{e.preventDefault(); onChange('contactos', form.contactos.filter((_, idx)=>idx!==i))}}>−</button>
            </div>
          </div>
        ))}
        <div style={{textAlign:'right', marginTop:12}}>
          <button className="btn btn-sm" style={{background:'var(--brown-dark)', color:'white'}} onClick={(e)=>{e.preventDefault(); setCForm({}); setEditIdx(-1); setModalC(true)}}>+ Agregar Contacto</button>
        </div>
      </div>

      <div className="form-group" style={{gridColumn:'1/-1', marginTop:16}}>
        <label className="form-label">Notas</label>
        <textarea className="form-input" rows={3} value={form.notas||''} placeholder="Observaciones..."
          onChange={e=>onChange('notas',e.target.value)}/>
      </div>

      {modalS && (
        <Modal title="AGREGAR SUCURSAL" onClose={()=>setModalS(false)} wide>
          <Tabs tabs={['DATOS PERSONALES','DIRECCIÓN','FOTOS']} active={tabS} onChange={setTabS}/>
          {tabS === 'DATOS PERSONALES' && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <FInput campo="nombre_sucursal" label="Nombre de Sucursal" req value={sForm.nombre_sucursal} onChange={(c,v)=>setSForm({...sForm, [c]:v})} placeholder="Ej. Empresa SA de CV"/>
              <FInput campo="telefono_sucursal" label="Teléfono de sucursal" req value={sForm.telefono_sucursal} onChange={(c,v)=>setSForm({...sForm, [c]:v})} placeholder="000 000 0000"/>
              <FInput campo="correo_electronico" label="Correo electrónico" req value={sForm.correo_electronico} onChange={(c,v)=>setSForm({...sForm, [c]:v})} placeholder="correo@ejemplo.com"/>
              <FInput campo="nombre_responsable" label="Nombre del responsable" req value={sForm.nombre_responsable} onChange={(c,v)=>setSForm({...sForm, [c]:v})} placeholder="Ej. Juan Pérez"/>
            </div>
          )}
          {tabS === 'DIRECCIÓN' && (
            <TabDireccion form={sForm} onChange={(c,v)=>setSForm({...sForm, [c]:v})} errors={{}} onVerificar={()=>{}} onReactivar={()=>{}} />
          )}
          {tabS === 'FOTOS' && (
            <TabFotos form={sForm} onChange={(c,v)=>setSForm({...sForm, [c]:v})}/>
          )}
          <div style={{textAlign:'center', marginTop:20}}>
            <button className="btn" style={{background:'var(--brown-dark)', color:'white', padding:'8px 32px'}} onClick={(e)=>{
              e.preventDefault();
              let arr = [...(form.sucursales||[])];
              if(editIdx >= 0) arr[editIdx] = sForm;
              else arr.push(sForm);
              onChange('sucursales', arr);
              setModalS(false);
              setTabS('DATOS PERSONALES');
            }}>GUARDAR</button>
          </div>
        </Modal>
      )}

      {modalC && (
        <Modal title="AGREGAR CONTACTO" onClose={()=>setModalC(false)}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <FInput campo="nombre_contacto" label="Nombre de Contacto" value={cForm.nombre_contacto} onChange={(c,v)=>setCForm({...cForm, [c]:v})} placeholder="Ej. Juan Pérez"/>
            <FInput campo="representante_legal" label="Representante Legal" value={cForm.representante_legal} onChange={(c,v)=>setCForm({...cForm, [c]:v})} placeholder="999 000 0000"/>
            <FInput campo="correo" label="Correo" value={cForm.correo} onChange={(c,v)=>setCForm({...cForm, [c]:v})} placeholder="correo@ejemplo.com"/>
            <FInput campo="telefono" label="Teléfono" value={cForm.telefono} onChange={(c,v)=>setCForm({...cForm, [c]:v})} placeholder="999 000 0000"/>
          </div>
          <div style={{textAlign:'center', marginTop:20}}>
            <button className="btn" style={{background:'var(--brown-dark)', color:'white', padding:'8px 32px'}} onClick={(e)=>{
              e.preventDefault();
              let arr = [...(form.contactos||[])];
              if(editIdx >= 0) arr[editIdx] = cForm;
              else arr.push(cForm);
              onChange('contactos', arr);
              setModalC(false);
            }}>GUARDAR</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function TabDireccion({form,onChange,errors,addrAlert,onVerificar,onReactivar}){
  const [mapState,setMapState]=useState({loading:false,url:null,notFound:false,label:''})

  const MERIDA_BBOX = { minLat: 20.7, maxLat: 21.2, minLon: -89.9, maxLon: -89.4 }
  const dentroDeYucatan = (lat, lon) => lat >= MERIDA_BBOX.minLat && lat <= MERIDA_BBOX.maxLat && lon >= MERIDA_BBOX.minLon && lon <= MERIDA_BBOX.maxLon

  const limpiarDireccion = (str) => {
    let limpio = (str || '').split(/ por | -por | - por | entre |,/i)[0].trim()
    limpio = limpio.replace(/^C\.\s*/i, 'Calle ').replace(/^Av\.\s*/i, 'Avenida ').trim()
    return limpio
  }

    // Extrae coordenadas de una cadena como "20.9674, -89.6237"
    const extraerCoordenadas = (texto) => {
      const match = texto.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
      return match ? { lat: parseFloat(match[1]), lon: parseFloat(match[2]) } : null;
    }

    const reverseGeocodeAndSet = async (lat, lon) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { headers: { 'Accept-Language': 'es', 'User-Agent': 'CRMCicloAmbiental/1.0' } });
        const data = await res.json();
        if (data && data.address) {
          const ad = data.address;
          if(ad.road) onChange('calle', ad.road);
          if(ad.house_number) onChange('numExt', ad.house_number);
          if(ad.neighbourhood || ad.suburb) onChange('colonia', ad.neighbourhood || ad.suburb);
          if(ad.city || ad.town || ad.county) onChange('municipio', ad.city || ad.town || ad.county);
          if(ad.postcode) onChange('cp', ad.postcode);
          if(ad.state) onChange('estado', ad.state);
          
          onChange('lat', lat.toFixed(8));
          onChange('lng', lon.toFixed(8));
          onChange('coordenadas_manuales', true);
          setMapState({
            loading: false, url: true, notFound: false,
            label: data.display_name,
            precision: 'exact'
          });
          return true;
        }
      } catch (e) { console.error(e) }
      return false;
    }

    const geocodificar=async()=>{
      if(!form.cp&&!form.municipio&&!form.calle&&!form.busquedaMapa) return
      setMapState({loading:true,url:null,notFound:false,label:'', precision:'', advertencia:''})
      
      // Si el usuario pegó coordenadas en el buscador libre
      if (form.busquedaMapa) {
        const coords = extraerCoordenadas(form.busquedaMapa);
        if (coords) {
          const success = await reverseGeocodeAndSet(coords.lat, coords.lon);
          if (success) return;
        }
      }

      // Si ya hay manual, advertir (aunque la volverá a buscar si el usuario forzó el botón)
      if (form.coordenadas_manuales && !form.busquedaMapa?.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/)) {
        if(!confirm("Ya estableciste coordenadas manualmente. ¿Deseas volver a buscar la dirección original y perder tu pin personalizado?")) {
          setMapState(prev => ({...prev, loading:false, url:true})) // Restaura vista
          return
        }
        onChange('coordenadas_manuales', false)
      }

      const calleLimpia = limpiarDireccion(form.calle)
      const numLimpio = limpiarDireccion(form.numExt)
      const estado = form.estado || 'Yucatán'
      const qParts = (...parts) => parts.filter(p => p && p.trim() !== '').join(', ')
      
      const limpiarTextoLibre = (texto) => {
        if(!texto) return '';
        return texto
          .replace(/\s*-?\s*por\s+\d+\s+y\s+\d+/gi, '') // Elimina "-por 57 y 59" o " por 57 y 59"
          .replace(/\s*entre\s+\d+\s+y\s+\d+/gi, '')    // Elimina "entre 57 y 59"
          .replace(/\bC\.\s*/gi, 'Calle ')              // "C. " -> "Calle "
          .replace(/\bAv\.\s*/gi, 'Avenida ')           // "Av. " -> "Avenida "
          .replace(/\bYuc\.?/gi, 'Yucatán')             // "Yuc." -> "Yucatán"
          .trim();
      }

      const intentos = []
      
      // Intento 0: Si el usuario proporcionó una búsqueda libre, se intenta tal cual y también limpio
      if (form.busquedaMapa && form.busquedaMapa.trim()) {
        intentos.push(form.busquedaMapa.trim())
        intentos.push(limpiarTextoLibre(form.busquedaMapa.trim())) // Variante limpia para Nominatim
      }

      intentos.push(
        // Intento 1: Literal, tal cual lo capturó el usuario en los campos
        qParts(`${form.calle||''} ${form.numExt||''}`.trim(), form.colonia, `${form.cp||''} ${form.municipio||''}`.trim(), estado, 'México'),
        // Intento 2: Dirección completa limpia con código postal (sin municipio, priorizando CP para evitar empates)
        qParts(`${calleLimpia} ${numLimpio}`.trim(), form.colonia, form.cp, estado, 'México'),
        // Intento 3: Calle limpia, colonia y municipio
        qParts(calleLimpia, form.colonia, form.municipio, estado, 'México'),
        // Intento 4: Solo colonia, municipio y CP (para centrar en la zona)
        qParts(form.colonia, form.municipio, form.cp, estado, 'México')
      )

      for (const query of intentos) {
        if (!query.replace(/,\s*/g,'').trim()) continue
        
        // Prevenir búsquedas basura que solo tienen CP, Ciudad o País (esto causaba el error del Templo de Mérida)
        if (/^(97\d{3}|yucatán|méxico|mérida|,\s*)+$/i.test(query.trim())) continue;

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=mx&viewbox=-89.9,21.2,-89.4,20.7&bounded=1`
        try {
          const res = await fetch(url, { headers: { 'Accept-Language': 'es', 'User-Agent': 'CRMCicloAmbiental/1.0' } })
          const data = await res.json()
          if (data.length > 0) {
            const lat = parseFloat(data[0].lat)
            const lon = parseFloat(data[0].lon)
            if (dentroDeYucatan(lat, lon)) {
              onChange('lat', lat.toFixed(8))
              onChange('lng', lon.toFixed(8))
              setMapState({
                loading: false, url: true, notFound: false,
                label: data[0].display_name,
                precision: data[0].type || data[0].class
              })
              return
            }
          }
        } catch (e) {
          console.error(e)
        }
      }
      
      // Fallback final: Centro de Mérida
      onChange('lat', 20.9674)
      onChange('lng', -89.6237)
      setMapState({
        loading: false, url: true, notFound: false, label: '', precision: 'ciudad',
        advertencia: 'No se pudo geocodificar con precisión. Se muestra el centro de Mérida.'
      })
    }

  const handleClick=()=>{ onVerificar(); geocodificar() }

  return(
    <div>
      {/* Buscador libre para el mapa */}
      <div style={{marginBottom:16, background:'var(--bg2)', padding:12, borderRadius:8, border:'1px solid var(--border)'}}>
        <div style={{fontSize:13, fontWeight:600, marginBottom:8, color:'var(--text1)'}}>Búsqueda rápida en mapa</div>
        <FInput campo="busquedaMapa" value={form.busquedaMapa} onChange={onChange} error={null} placeholder="Pega todo junto aquí. Ej: C. 60-A 322-por 57 y 59, Mulchechén, 97370 Mérida, Yuc." full />
        <div style={{fontSize:11, color:'var(--text3)', marginTop:4}}>Si llenas este campo, el mapa lo usará como primera opción para encontrar la ubicación exacta.</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
        <FInput campo="calle" label="Calle" req value={form.calle} onChange={onChange} error={errors.calle} placeholder="Ej: Calle 21, Av. Reforma"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 8px'}}>
          <FInput campo="numExt" label="Núm. Ext." req value={form.numExt} onChange={onChange} error={errors.numExt} placeholder="331"/>
          <FInput campo="numInt" label="Núm. Int." value={form.numInt} onChange={onChange} error={null} placeholder="A"/>
        </div>
        <FInput campo="colonia" label="Colonia" req value={form.colonia} onChange={onChange} error={errors.colonia} placeholder="Ej: Miguel Hidalgo"/>
        <FInput campo="municipio" label="Municipio" req value={form.municipio} onChange={onChange} error={errors.municipio} placeholder="Ej: Mérida"/>
        <FInput campo="cp" label="Código Postal" req value={form.cp} onChange={onChange} error={errors.cp} placeholder="97000"/>
        <FInput campo="estado" label="Estado" value={form.estado} onChange={onChange} error={null} placeholder="Ej: Yucatán"/>
      </div>

      <button className="btn btn-accent" style={{marginBottom:12}} onClick={handleClick} disabled={mapState.loading}>
        {mapState.loading?'Buscando en el mapa...':'Verificar Dirección'}
      </button>

      {addrAlert&&(
        <Alert type={addrAlert.type}>
          {addrAlert.msg}
          {addrAlert.reactivar&&<div style={{marginTop:8}}><button className="btn btn-sm btn-primary" onClick={onReactivar}>Reactivar Servicio</button></div>}
        </Alert>
      )}

      {mapState.notFound&&(
        <Alert type="warn">
          No se encontró la ubicación exacta. El mapa no pudo localizarla, pero puedes <strong>guardar los datos de todas formas</strong>. Intenta escribir el nombre completo de la calle.
        </Alert>
      )}

      {mapState.url?(
        <div>
          {mapState.label&&<div style={{fontSize:11,color:'var(--text3)',marginBottom:6,padding:'0 2px'}}>{mapState.label}</div>}
          
          {mapState.advertencia && <Alert type="error">{mapState.advertencia}</Alert>}
          {!mapState.advertencia && mapState.precision && (
            <div style={{marginBottom:8}}>
              {mapState.precision === 'exact' ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#E3F2FD',color:'#1565C0',fontWeight:'bold'}}>Coordenadas ajustadas manualmente</span> :
               ['house','building'].includes(mapState.precision) ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#E8F5E9',color:'#2E7D32',fontWeight:'bold'}}>Ubicación exacta</span> :
               ['street'].includes(mapState.precision) ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#FFF8E1',color:'#F57F17',fontWeight:'bold'}}>Aproximado a la calle</span> :
               <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#FFF3E0',color:'#E65100',fontWeight:'bold'}}>Aproximado a la colonia — verifica el pin</span>}
            </div>
          )}
          
          <div style={{width:'100%',height:240,borderRadius:8,overflow:'hidden',marginBottom:4}}>
            <MapView 
              lat={form.lat} 
              lng={form.lng} 
              onLocationChange={(lat,lng)=>{
                onChange('lat', lat)
                onChange('lng', lng)
                onChange('coordenadas_manuales', true)
              }}
            />
          </div>
          
          <div style={{background:'var(--bg2)', padding:'12px', borderRadius:8, marginTop:8, border:'1px solid var(--border)'}}>
            <div style={{fontSize:12, fontWeight:600, marginBottom:8, color:'var(--text1)'}}>Ajuste Manual de Coordenadas</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
              <FInput campo="lat" label="Latitud" value={form.lat} onChange={(c,v) => {onChange(c,v); onChange('coordenadas_manuales', true)}} placeholder="Ej: 20.9674"/>
              <FInput campo="lng" label="Longitud" value={form.lng} onChange={(c,v) => {onChange(c,v); onChange('coordenadas_manuales', true)}} placeholder="Ej: -89.6237"/>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
              <span style={{fontSize:11, color:'var(--text3)'}}>Arrastra el marcador en el mapa o pega las coordenadas y presiona el botón.</span>
              <button 
                className="btn btn-sm btn-primary" 
                onClick={(e) => { e.preventDefault(); reverseGeocodeAndSet(parseFloat(form.lat), parseFloat(form.lng)); }}
              >
                Autocompletar Dirección desde el Pin
              </button>
            </div>
          </div>
        </div>
      ):(
        !mapState.loading&&(
          <div style={{background:'var(--bg2)',borderRadius:8,height:140,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13,border:'1px solid var(--border)',flexDirection:'column',gap:8}}>
            <span style={{fontSize:28}}></span>
            <span>Llena la dirección y presiona <strong>Verificar</strong></span>
          </div>
        )
      )}
    </div>
  )
}

function TabFotos({ form, onChange }) {
  const handleFile = (campo, file) => {
    if (!file) {
      onChange(campo, null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Exportar a JPEG con calidad 0.8
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64String = dataUrl.split(',')[1];
        onChange(campo, base64String);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div className="form-group" style={{ padding: '20px', background: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <label className="form-label" style={{ fontSize: '14px', marginBottom: '12px' }}>Comprobante de Domicilio</label>
        <input 
          type="file" 
          accept="image/*" 
          className="form-input" 
          onChange={(e) => handleFile('foto_comprobante', e.target.files[0])} 
        />
        {form.foto_comprobante && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <img 
              src={`data:image/jpeg;base64,${form.foto_comprobante}`} 
              alt="Comprobante" 
              style={{ maxHeight: '150px', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
            <button className="btn btn-sm" style={{ background: '#FFEBEE', color: '#D32F2F' }} onClick={() => onChange('foto_comprobante', null)}>
              Eliminar foto
            </button>
          </div>
        )}
      </div>

      <div className="form-group" style={{ padding: '20px', background: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <label className="form-label" style={{ fontSize: '14px', marginBottom: '12px' }}>Fachada del Domicilio</label>
        <input 
          type="file" 
          accept="image/*" 
          className="form-input" 
          onChange={(e) => handleFile('foto_fachada', e.target.files[0])} 
        />
        {form.foto_fachada && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <img 
              src={`data:image/jpeg;base64,${form.foto_fachada}`} 
              alt="Fachada" 
              style={{ maxHeight: '150px', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
            <button className="btn btn-sm" style={{ background: '#FFEBEE', color: '#D32F2F' }} onClick={() => onChange('foto_fachada', null)}>
              Eliminar foto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Componente principal ── */
export default function Prospects(){
  const navigate=useNavigate()
  const [lista,setLista]=useState([])
  const [filtro,setFiltro]=useState('')
  const [estatusFiltro,setEstatusFiltro]=useState('')
  const [modal,setModal]=useState(null)
  const [selected,setSelected]=useState(null)
  const [form,setForm]=useState(EMPTY)
  const [tab,setTab]=useState('Datos Personales')
  const [errors,setErrors]=useState({})
  const [addrAlert,setAddrAlert]=useState(null)
  const [facturaModal,setFacturaModal]=useState(false)

  const cargar=async ()=>{
    try {
      const res = await fetch('http://localhost:5000/api/prospectos')
      if(res.ok) {
        const data = await res.json()
        setLista(data)
      }
    } catch(e) { console.error('Error fetching prospectos', e) }
  }
  useEffect(()=>{ cargar() },[])

  // ── Bloquear scroll del body cuando hay modal abierto ──
  useEffect(() => {
    if (modal) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    // Limpiar al desmontar el componente
    return () => document.body.classList.remove('modal-open')
  }, [modal])

  const filtrados=lista.filter(p=>{
    const q=filtro.toLowerCase()
    return(!q||p.nombre?.toLowerCase().includes(q)||p.contacto?.toLowerCase().includes(q))
      &&(!estatusFiltro||p.estatus===estatusFiltro)
  })

  const handleChange=(campo,valor)=>{
    setForm(f=>({...f,[campo]:valor}))
    setErrors(e=>({...e,[campo]:null}))
  }

  const cerrar=()=>{setModal(null);setSelected(null);setForm(EMPTY);setTab('Datos Personales');setErrors({});setAddrAlert(null)}

  // ── Validaciones completas por tipo de campo (espejo del SP MySQL) ──
  const validar = () => {
    const e = {}

    // ── Campos NOT NULL en crm_prospectos ────────────────────────
    // Nombre (Razón Social) → VARCHAR(150) NOT NULL
    const nombre = (form.nombre || '').trim()
    if (!nombre) {
      e.nombre = 'La Razón Social es obligatoria.'
    } else if (nombre.length > 150) {
      e.nombre = 'Máximo 150 caracteres.'
    }

    // Teléfono → VARCHAR(30) NOT NULL en la práctica del negocio
    const tel = (form.telefono || '').trim()
    if (!tel) {
      e.telefono = 'El Teléfono es obligatorio.'
    } else if (!TELEFONO_RE.test(tel)) {
      e.telefono = 'Solo dígitos, espacios, guiones y paréntesis (7-20 caracteres).'
    } else if (tel.length > 30) {
      e.telefono = 'Máximo 30 caracteres.'
    }

    // Email → VARCHAR(150) NOT NULL en el negocio (req en FInput)
    const email = (form.email || '').trim()
    if (!email) {
      e.email = 'El correo electrónico es obligatorio.'
    } else if (!EMAIL_RE.test(email)) {
      e.email = 'Formato inválido. Ej: usuario@dominio.com'
    } else if (email.length > 150) {
      e.email = 'Máximo 150 caracteres.'
    }

    // Tipo de Inmueble → NOT NULL en el flujo de negocio
    if (!form.tipoInmueble) {
      e.tipoInmueble = 'Selecciona un Tipo de Inmueble.'
    }

    // ── Campos opcionales con formato ────────────────────────────
    // RFC → VARCHAR(20), opcional
    const rfc = (form.rfc || '').trim()
    if (rfc && rfc.length > 20) {
      e.rfc = 'El RFC no puede exceder 20 caracteres.'
    }

    // Contacto → VARCHAR(150), opcional
    const contacto = (form.contacto || '').trim()
    if (contacto && contacto.length > 150) {
      e.contacto = 'Máximo 150 caracteres.'
    }

    return e
  }

  // ── Validaciones de dirección ─────────────────────────────────
  const validarDireccion = () => {
    const e = {}
    if (!(form.calle   || '').trim()) e.calle    = 'Requerido'
    if (!(form.numExt  || '').trim()) e.numExt   = 'Requerido'
    if (!(form.colonia || '').trim()) e.colonia  = 'Requerido'
    if (!(form.municipio||'').trim()) e.municipio= 'Requerido'
    const cp = (form.cp || '').trim()
    if (!cp) {
      e.cp = 'Requerido'
    } else if (!CP_RE.test(cp)) {
      e.cp = 'El CP debe tener 5 dígitos numéricos.'
    }
    return e
  }

  const verificarDireccion = () => {
    const dirErrors = validarDireccion()
    if (Object.keys(dirErrors).length) { setErrors(prev => ({...prev, ...dirErrors})); return }
    const match = lista.find(p =>
      p.id !== (selected?.id) &&
      (p.calle    || '').toLowerCase() === (form.calle    || '').toLowerCase() &&
      (p.numExt   || '').toLowerCase() === (form.numExt   || '').toLowerCase() &&
      (p.colonia  || '').toLowerCase() === (form.colonia  || '').toLowerCase()
    )
    if (!match) { setAddrAlert({ type:'success', msg:'✓ Sin adeudo detectado. Dirección disponible.' }); return }
    if (match.adeudo || match.estatus === 'Adeudo')
      setAddrAlert({ type:'error', msg:'⚠ Este domicilio tiene un adeudo pendiente. Contactar a cobranza.', match })
    else if (match.estatus === 'Inactivo')
      setAddrAlert({ type:'warn', msg:'Este domicilio está dado de baja. ¿Deseas reactivar el servicio?', match, reactivar:true })
    else
      setAddrAlert({ type:'info', msg:'Este domicilio ya cuenta con servicio activo.' })
  }

  const handleReactivar=()=>{
    if(!addrAlert?.match)return
    // prospectos.actualizar(addrAlert.match.id,{estatus:'En seguimiento'})
    cargar();cerrar();alert('Servicio reactivado correctamente.')
  }

  const handleGuardar = async () => {
    // 1. Validar campos
    const e = validar()
    if (Object.keys(e).length) {
      setErrors(e)
      // ⚠️ SweetAlert de ADVERTENCIA con lista de errores
      const lista = Object.values(e)
        .map(msg => `<li style="margin-bottom:4px">${msg}</li>`)
        .join('')
      Swal.fire({
        icon: 'warning',
        title: `${Object.keys(e).length} campo${Object.keys(e).length > 1 ? 's' : ''} con error`,
        html: `<ul style="text-align:left;margin:8px 0 0;padding-left:20px;font-size:0.88rem">${lista}</ul>`,
        confirmButtonText: 'Corregir',
        confirmButtonColor: '#E65100'
      })
      return
    }

    // 2. Confirmación antes de guardar
    const esNuevo = modal === 'crear'
    const confirm = await Swal.fire({
      icon: 'question',
      title: esNuevo ? '¿Registrar prospecto?' : '¿Guardar cambios?',
      text: esNuevo
        ? `Se creará el prospecto "${(form.nombre||'').trim()}".`
        : `Se actualizarán los datos de "${selected?.nombre}".`,
      showCancelButton: true,
      confirmButtonText: esNuevo ? 'Sí, registrar' : 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5C3819',
      cancelButtonColor: '#6c757d'
    })
    if (!confirm.isConfirmed) return

    // 3. Enviar al servidor
    const data = { ...form, fecha: form.fecha || new Date().toISOString().split('T')[0] }
    try {
      let resp
      if (esNuevo) {
        resp = await fetch('http://localhost:5000/api/prospectos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      } else if (selected?.id) {
        resp = await fetch(`http://localhost:5000/api/prospectos/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      }

      const json = resp ? await resp.json() : null

      if (resp?.ok && json?.success !== false) {
        // ✅ SweetAlert de ÉXITO
        await Swal.fire({
          icon: 'success',
          title: esNuevo ? '¡Prospecto registrado!' : '¡Cambios guardados!',
          text: esNuevo
            ? `"${(form.nombre||'').trim()}" fue agregado correctamente.`
            : `Los datos de "${selected?.nombre}" fueron actualizados.`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#5C3819',
          timer: 3000,
          timerProgressBar: true
        })
        cargar(); cerrar()
      } else {
        // ❌ SweetAlert de ERROR del servidor
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: json?.error || 'El servidor no pudo procesar la solicitud.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#d33'
        })
      }
    } catch (err) {
      console.error('Error guardando:', err)
      // ❌ SweetAlert de ERROR de conexión
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Verifica que esté corriendo.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#6c757d'
      })
    }
  }

  const formatMXN=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0)

  return(
    <Layout title="Prospectos">
      <div className="page-header">
        <div>
          <h2 className="section-title">Padrón de Prospectos</h2>
          <p className="section-sub">{lista.length} registros en total</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{setForm(EMPTY);setModal('crear')}}>+ Agregar Prospecto</button>
      </div>

      <div className="search-bar">
        <div className="search-wrap">
          <span className="search-icon">&#128269;</span>
          <input className="form-input" placeholder="Buscar por empresa o contacto..." value={filtro} onChange={e=>setFiltro(e.target.value)}/>
        </div>
        <select className="form-input" style={{width:190}} value={estatusFiltro} onChange={e=>setEstatusFiltro(e.target.value)}>
          <option value="">Todos los estatus</option>
          {ESTATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Empresa / RFC</th><th>Contacto</th><th>Inmueble</th>
              <th>Tipo</th><th>Estatus</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {filtrados.map(p=>(
                <tr key={p.id}>
                  <td><div style={{fontWeight:600}}>{p.nombre}</div><div className="text-xs text-muted">{p.rfc||p.email}</div></td>
                  <td><div>{p.contacto}</div><div className="text-xs text-muted">{p.telefono}</div></td>
                  <td className="text-muted">{p.tipoInmueble||'—'}</td>
                  <td className="text-muted">{p.tipoPersona||'Moral'}</td>
                  <td><span className={`badge ${getBadge(p.estatus)}`}>{p.estatus}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={()=>navigate(`/prospectos/${p.id}`)}>Ver</button>
                      <button className="btn btn-ghost btn-sm" onClick={async ()=>{
                        const resS = await fetch(`http://localhost:5000/api/prospectos/${p.id}/sucursales`);
                        const sucursales = await resS.json();
                        const resC = await fetch(`http://localhost:5000/api/prospectos/${p.id}/contactos`);
                        const contactos = await resC.json();
                        const p2={...EMPTY,...p, sucursales, contactos};
                        setForm(p2);setSelected(p);setTab('Datos Personales');setModal('editar');
                      }}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                          // 🗑️ SweetAlert de CONFIRMACIÓN de eliminación
                          const result = await Swal.fire({
                            icon: 'warning',
                            title: '¿Eliminar prospecto?',
                            html: `<b>${p.nombre}</b> será eliminado permanentemente junto con sus sucursales y contactos.`,
                            showCancelButton: true,
                            confirmButtonText: 'Sí, eliminar',
                            cancelButtonText: 'Cancelar',
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#6c757d'
                          })
                          if (!result.isConfirmed) return
                          try {
                            const resp = await fetch(`http://localhost:5000/api/prospectos/${p.id}`, { method: 'DELETE' })
                            if (resp.ok) {
                              Swal.fire({
                                icon: 'success',
                                title: '¡Eliminado!',
                                text: `"${p.nombre}" fue eliminado correctamente.`,
                                timer: 2500,
                                timerProgressBar: true,
                                showConfirmButton: false
                              })
                              cargar()
                            } else {
                              Swal.fire({ icon:'error', title:'Error', text:'No se pudo eliminar el prospecto.' })
                            }
                          } catch {
                            Swal.fire({ icon:'error', title:'Sin conexión', text:'Verifica que el servidor esté corriendo.' })
                          }
                        }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>
                {filtro||estatusFiltro?'Sin resultados':'No hay prospectos registrados'}
              </td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {(modal==='crear'||modal==='editar')&&(
        <Modal title={modal==='crear'?'Nuevo Prospecto':`Editar: ${selected?.nombre}`} onClose={cerrar} wide>
          <Tabs tabs={['Datos Personales','Dirección','Fotos']} active={tab} onChange={setTab}/>
          {tab==='Datos Personales'&&<TabDatos form={form} onChange={handleChange} errors={errors}/>}
          {tab==='Dirección'&&<TabDireccion form={form} onChange={handleChange} errors={errors} addrAlert={addrAlert} onVerificar={verificarDireccion} onReactivar={handleReactivar}/>}
          {tab==='Fotos'&&<TabFotos form={form} onChange={handleChange}/>}
          <div className="flex gap-2 mt-3" style={{justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            {tab !== 'Fotos' ? (
              <button className="btn btn-primary" onClick={() => setTab(tab === 'Datos Personales' ? 'Dirección' : 'Fotos')}>Siguiente</button>
            ) : (
              <button className="btn btn-primary" onClick={handleGuardar}>{modal==='crear'?'Crear Prospecto':'Guardar Cambios'}</button>
            )}
          </div>
        </Modal>
      )}

      {modal==='ver'&&selected&&(
        <Modal title={selected.nombre} onClose={cerrar} wide>
          <Tabs tabs={['Datos Personales','Dirección','Fotos']} active={tab} onChange={setTab}/>
          {tab==='Datos Personales'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px'}}>
              {[['RFC',selected.rfc],['Contacto',selected.contacto],['Teléfono',selected.telefono],
                ['Email',selected.email],['Tipo de Inmueble',selected.tipoInmueble],
                ['Periodicidad',selected.periodicidadPago],['Monto',formatMXN(selected.monto)],['Fecha',selected.fecha],
                ['Días Disponibles',selected.dias_disponibles],['Horario',selected.horario],['Capacidad',selected.capacidad_disponible],['Ruta',selected.ruta]
              ].map(([k,v])=>(
                <div key={k}>
                  <div className="text-xs text-muted" style={{fontWeight:600,textTransform:'uppercase',marginBottom:4}}>{k}</div>
                  <div>{v||'—'}</div>
                </div>
              ))}
              <div>
                <div className="text-xs text-muted" style={{fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Estatus</div>
                <span className={`badge ${getBadge(selected.estatus)}`}>{selected.estatus}</span>
              </div>
              {selected.notas&&<div style={{gridColumn:'1/-1'}}>
                <div className="text-xs text-muted" style={{fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Notas</div>
                <div style={{color:'var(--text2)'}}>{selected.notas}</div>
              </div>}
            </div>
          )}
          {tab==='Dirección'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px',marginBottom:16}}>
                {[['Calle',selected.calle],['Núm. Ext.',selected.numExt],['Colonia',selected.colonia],
                  ['Municipio',selected.municipio],['C.P.',selected.cp],['Estado',selected.estado]
                ].map(([k,v])=>(
                  <div key={k}>
                    <div className="text-xs text-muted" style={{fontWeight:600,textTransform:'uppercase',marginBottom:4}}>{k}</div>
                    <div>{v||'—'}</div>
                  </div>
                ))}
              </div>
              {selected.adeudo
                ?<Alert type="error">Este domicilio tiene un adeudo pendiente. Contactar a cobranza.</Alert>
                :<Alert type="success">Sin adeudo detectado en este domicilio.</Alert>}
            </div>
          )}
          {tab==='Fotos'&&<TabFotos form={selected} onChange={() => {}}/>}
          <div className="flex gap-2 mt-4" style={{justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={cerrar}>Cerrar</button>
            <button className="btn btn-accent" onClick={()=>setFacturaModal(true)}>Convertir a Cliente</button>
            <button className="btn btn-primary" onClick={()=>{
              const fd = selected?.fecha ? String(selected.fecha).split('T')[0] : '';
              setForm({...EMPTY,...selected, fecha: fd});
              setModal('editar');
            }}>Editar</button>
          </div>
        </Modal>
      )}

      {facturaModal&&selected&&(
        <Modal title="Conversión a Cliente — Primera Factura" onClose={()=>setFacturaModal(false)}>
          <Alert type="info">Ventas genera una <strong>Nota de Venta</strong>. La factura la procesa Facturación o el sistema según método de pago.</Alert>
          {[
            {icon:'',title:'Pago en Plataforma (tarjeta/referencia)',desc:'Factura automática al confirmar pago.',btn:'Generar Nota de Venta',cb:()=>{alert('Nota de venta generada. Factura automática al confirmar pago.');setFacturaModal(false)}},
            {icon:'',title:'Transferencia Bancaria Manual',desc:'Cobranza valida el pago, luego Facturación emite la factura.',btn:'Notificar a Cobranza',cb:()=>{alert('Solicitud enviada a Cobranza.');setFacturaModal(false)}},
            {icon:'',title:'Crédito',desc:'Factura automática al firmar contrato, sin esperar pago.',btn:'Firmar Contrato y Facturar',cb:()=>{alert('Contrato firmado. Factura generada automáticamente.');setFacturaModal(false)}},
          ].map(({icon,title,desc,btn,cb})=>(
            <div key={title} style={{border:'1px solid var(--border)',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,marginBottom:6}}>{title}</div>
              <div className="text-muted text-sm">{desc}</div>
              <button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={cb}>{btn}</button>
            </div>
          ))}
        </Modal>
      )}
    </Layout>
  )
}
