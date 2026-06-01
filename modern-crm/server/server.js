import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// ─── DASHBOARD ───────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  try {
    const [kpi1] = await pool.query(
      `SELECT COUNT(*) as count FROM crm_prospectos
       WHERE LOWER(COALESCE(Estatus,'')) NOT IN ('convertido','no viable')`
    );
    const [kpi2] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(Importe),0) as sum
       FROM crm_tratos WHERE Fase_ID NOT IN (5,6)`
    );
    const [kpi3] = await pool.query(
      `SELECT COUNT(*) as count FROM crm_tratos WHERE Promesa_Pago_Cobranza=1`
    );
    const [kpi4] = await pool.query(
      `SELECT COUNT(*) as count FROM clientes WHERE Activo=1`
    );
    const [origenes] = await pool.query(`
      SELECT f.Nombre_Fuente as origen, COUNT(p.Prospecto_ID) as cantidad
      FROM crm_prospectos p
      INNER JOIN crm_fuentes_prospecto f ON p.Fuente_ID=f.Fuente_ID
      GROUP BY f.Nombre_Fuente`
    );
    const [recientes] = await pool.query(`
      SELECT e.Nombre_Empresa as empresa, p.Nombre_Prospecto as contacto,
             f.Nombre_Fuente as origen, t.Nombre_Trato as estatusComercial,
             t.Importe as monto, p.Fecha_Creacion as fechaAlta
      FROM crm_prospectos p
      LEFT JOIN empresas e              ON p.Empresa_ID=e.Empresa_ID
      LEFT JOIN crm_tratos t            ON p.Prospecto_ID=t.Prospecto_ID
      LEFT JOIN crm_fuentes_prospecto f ON p.Fuente_ID=f.Fuente_ID
      ORDER BY p.Fecha_Creacion DESC LIMIT 6`
    );
    const ahora   = new Date();
    const pDia    = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const uDia    = new Date(ahora.getFullYear(), ahora.getMonth()+1, 0, 23, 59, 59);
    const [mP]    = await pool.query(
      `SELECT COUNT(*) as total FROM crm_prospectos WHERE Fecha_Creacion>=? AND Fecha_Creacion<=?`,
      [pDia, uDia]
    );
    const [mT]    = await pool.query(`
      SELECT COUNT(*) as totalCreados,
        SUM(CASE WHEN Fase_ID=5 THEN 1 ELSE 0 END) as obtenidos,
        SUM(CASE WHEN Fase_ID=5 THEN Importe ELSE 0 END) as ingresosObtenidos,
        SUM(CASE WHEN Fase_ID NOT IN(5,6) THEN Importe ELSE 0 END) as importeAbierto
      FROM crm_tratos WHERE Fecha_Creacion>=? AND Fecha_Creacion<=?`,
      [pDia, uDia]
    );
    res.json({
      kpis:{
        prospectosActivos: kpi1[0].count,
        tratosEnProceso:{ count: kpi2[0].count, sum: kpi2[0].sum||0 },
        cuentasAdeudo: kpi3[0].count,
        clientesTotales: kpi4[0].count
      },
      origenes, recientes,
      monitor:{
        prospectosCreados : mP[0].total             ||0,
        tratosCreados     : mT[0].totalCreados       ||0,
        tratosObtenidos   : mT[0].obtenidos          ||0,
        ingresosObtenidos : mT[0].ingresosObtenidos  ||0,
        importeAbierto    : mT[0].importeAbierto     ||0,
      }
    });
  } catch(e){ console.error('Dashboard:',e); res.status(500).json({error:e.message}); }
});

// ─── PROSPECTOS GET ───────────────────────────────────────────
app.get('/api/prospectos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.Prospecto_ID as id, e.Nombre_Empresa as nombre, e.RFC as rfc,
        p.Nombre_Prospecto as contacto, p.Telefono as telefono, p.Correo as email,
        p.Estatus as estatus, p.Tipo_Inmueble as tipoInmueble,
        p.Periodicidad_Pago as periodicidadPago, p.Monto as monto,
        p.Servicio as servicio, p.Notas as notas,
        p.Calle as calle, p.Num_Ext as numExt, p.Num_Int as numInt,
        p.Colonia as colonia, p.Municipio as municipio, p.CP as cp,
        p.Estado as estado, p.Lat as lat, p.Lng as lng,
        p.Coordenadas_Manuales as coordenadas_manuales,
        p.Fecha_Creacion as fecha
      FROM crm_prospectos p
      LEFT JOIN empresas e ON p.Empresa_ID=e.Empresa_ID
      ORDER BY p.Fecha_Creacion DESC`
    );
    res.json(rows);
  } catch(e){ console.error('GET prospectos:',e); res.status(500).json({error:e.message}); }
});

// ─── PROSPECTOS POST ──────────────────────────────────────────
app.post('/api/prospectos', async (req, res) => {
  try {
    const {
      nombre, rfc, contacto, telefono, email, estatus,
      tipoInmueble, periodicidadPago, monto, servicio, notas,
      calle, numExt, numInt, colonia, municipio, cp, estado,
      lat, lng, coordenadas_manuales
    } = req.body;

    let empresaId = 1;
    if (nombre?.trim()) {
      const [r] = await pool.query(
        `INSERT INTO empresas (Nombre_Empresa, RFC) VALUES (?,?)
         ON DUPLICATE KEY UPDATE Nombre_Empresa=VALUES(Nombre_Empresa)`,
        [nombre.trim(), rfc||null]
      );
      if (r.insertId) {
        empresaId = r.insertId;
      } else {
        const [ex] = await pool.query(
          `SELECT Empresa_ID FROM empresas WHERE Nombre_Empresa=? LIMIT 1`, [nombre.trim()]
        );
        empresaId = ex[0]?.Empresa_ID || 1;
      }
    }

    const [result] = await pool.query(`
      INSERT INTO crm_prospectos
        (Empresa_ID, Propietario_ID, Fuente_ID,
         Nombre_Prospecto, Nombre_Comercial_Empresa, Correo, Telefono, Estatus,
         Tipo_Inmueble, Periodicidad_Pago, Monto, Servicio, Notas,
         Calle, Num_Ext, Num_Int, Colonia, Municipio, CP, Estado,
         Lat, Lng, Coordenadas_Manuales)
      VALUES (?,1,1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        empresaId,
        (contacto||nombre||'').trim(),
        (nombre||contacto||'').trim(),
        email||null, telefono||null, estatus||'Nuevo',
        tipoInmueble||null, periodicidadPago||null, parseFloat(monto)||0,
        servicio||null, notas||null,
        calle||null, numExt||null, numInt||null,
        colonia||null, municipio||null, cp||null, estado||null,
        lat ? parseFloat(lat) : null,
        lng ? parseFloat(lng) : null,
        coordenadas_manuales ? 1 : 0
      ]
    );
    res.json({ success:true, id: result.insertId });
  } catch(e){ console.error('POST prospecto:',e); res.status(500).json({error:e.message}); }
});

// ─── PROSPECTOS PUT ───────────────────────────────────────────
app.put('/api/prospectos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, rfc, contacto, telefono, email, estatus,
      tipoInmueble, periodicidadPago, monto, servicio, notas,
      calle, numExt, numInt, colonia, municipio, cp, estado,
      lat, lng, coordenadas_manuales
    } = req.body;

    await pool.query(`
      UPDATE crm_prospectos SET
        Nombre_Prospecto=?, Nombre_Comercial_Empresa=?,
        Correo=?, Telefono=?, Estatus=?,
        Tipo_Inmueble=?, Periodicidad_Pago=?, Monto=?,
        Servicio=?, Notas=?,
        Calle=?, Num_Ext=?, Num_Int=?,
        Colonia=?, Municipio=?, CP=?, Estado=?,
        Lat=?, Lng=?, Coordenadas_Manuales=?
      WHERE Prospecto_ID=?`,
      [
        (contacto||nombre||'').trim(),
        (nombre||contacto||'').trim(),
        email||null, telefono||null, estatus||'Nuevo',
        tipoInmueble||null, periodicidadPago||null, parseFloat(monto)||0,
        servicio||null, notas||null,
        calle||null, numExt||null, numInt||null,
        colonia||null, municipio||null, cp||null, estado||null,
        lat ? parseFloat(lat) : null,
        lng ? parseFloat(lng) : null,
        coordenadas_manuales ? 1 : 0,
        id
      ]
    );

    if (nombre?.trim()) {
      const [pr] = await pool.query(
        `SELECT Empresa_ID FROM crm_prospectos WHERE Prospecto_ID=?`, [id]
      );
      if (pr.length > 0) {
        await pool.query(
          `UPDATE empresas SET Nombre_Empresa=?, RFC=? WHERE Empresa_ID=?`,
          [nombre.trim(), rfc||null, pr[0].Empresa_ID]
        );
      }
    }
    res.json({ success:true });
  } catch(e){ console.error('PUT prospecto:',e); res.status(500).json({error:e.message}); }
});

// ─── PROSPECTOS DELETE ────────────────────────────────────────
app.delete('/api/prospectos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT Empresa_ID FROM crm_prospectos WHERE Prospecto_ID=?`, [id]
    );
    await pool.query(`DELETE FROM crm_prospectos WHERE Prospecto_ID=?`, [id]);
    if (rows.length > 0) {
      const eid = rows[0].Empresa_ID;
      const [[{c1}]] = await pool.query(
        `SELECT COUNT(*) as c1 FROM crm_prospectos WHERE Empresa_ID=?`, [eid]
      );
      const [[{c2}]] = await pool.query(
        `SELECT COUNT(*) as c2 FROM clientes WHERE Empresa_ID=?`, [eid]
      );
      if (c1===0 && c2===0)
        await pool.query(`DELETE FROM empresas WHERE Empresa_ID=?`, [eid]);
    }
    res.json({ success:true });
  } catch(e){ console.error('DELETE prospecto:',e); res.status(500).json({error:e.message}); }
});

// ─── ARCHIVOS — Subir ────────────────────────────────────────
app.post('/api/prospectos/:id/archivos', async (req, res) => {
  try {
    const { id } = req.params;
    const { base64, nombre, tipo, peso } = req.body;
    if (!base64 || !nombre)
      return res.status(400).json({ error: 'Faltan datos del archivo' });
    const buffer = Buffer.from(base64, 'base64');
    const [r] = await pool.query(
      `INSERT INTO crm_prospecto_archivos
         (Prospecto_ID, archivo_binario, archivo_nombre, archivo_peso, archivo_tipo)
       VALUES (?,?,?,?,?)`,
      [id, buffer, nombre, peso||buffer.length, tipo||'application/octet-stream']
    );
    res.json({ success:true, id: r.insertId, nombre, tipo, peso });
  } catch(e){ console.error('Upload:',e); res.status(500).json({error:e.message}); }
});

// ─── ARCHIVOS — Listar (solo metadatos) ──────────────────────
app.get('/api/prospectos/:id/archivos', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT Archivo_ID as id, archivo_nombre as nombre,
              archivo_tipo as tipo, archivo_peso as peso,
              Fecha_Subida as fecha
       FROM crm_prospecto_archivos
       WHERE Prospecto_ID=? ORDER BY Fecha_Subida DESC`,
      [id]
    );
    res.json(rows);
  } catch(e){ console.error('List archivos:',e); res.status(500).json({error:e.message}); }
});

// ─── ARCHIVOS — Descargar (base64) ───────────────────────────
app.get('/api/archivos/:archivoId', async (req, res) => {
  try {
    const { archivoId } = req.params;
    const [rows] = await pool.query(
      `SELECT archivo_nombre as nombre, archivo_binario as binario,
              archivo_tipo as tipo, archivo_peso as peso
       FROM crm_prospecto_archivos WHERE Archivo_ID=?`,
      [archivoId]
    );
    if (!rows.length) return res.status(404).json({ error:'No encontrado' });
    const a = rows[0];
    res.json({
      nombre: a.nombre,
      tipo: a.tipo,
      peso: a.peso,
      base64: a.binario.toString('base64')
    });
  } catch(e){ console.error('Get archivo:',e); res.status(500).json({error:e.message}); }
});

// ─── ARCHIVOS — Eliminar ──────────────────────────────────────
app.delete('/api/archivos/:archivoId', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM crm_prospecto_archivos WHERE Archivo_ID=?`,
      [req.params.archivoId]
    );
    res.json({ success:true });
  } catch(e){ console.error('Delete archivo:',e); res.status(500).json({error:e.message}); }
});

// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor en puerto ${PORT}`));
