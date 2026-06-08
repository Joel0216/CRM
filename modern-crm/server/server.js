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
        p.Tipo_Persona as tipoPersona, p.Tiene_Sucursales as tieneSucursales, p.Notas as notas,
        p.Calle as calle, p.Num_Ext as numExt, p.Num_Int as numInt,
        p.Colonia as colonia, p.Municipio as municipio, p.CP as cp,
        p.Estado as estado, p.Lat as lat, p.Lng as lng,
        p.Coordenadas_Manuales as coordenadas_manuales,
        p.Dias_Disponibles as dias_disponibles, p.Horario as horario,
        p.Ruta as ruta,
        p.Foto_Comprobante as foto_comprobante, p.Foto_Fachada as foto_fachada,
        p.Fecha_Creacion as fecha
      FROM crm_prospectos p
      LEFT JOIN empresas e ON p.Empresa_ID=e.Empresa_ID
      ORDER BY p.Fecha_Creacion DESC`
    );
    const rowsWithImages = rows.map(r => ({
      ...r,
      foto_comprobante: r.foto_comprobante ? Buffer.from(r.foto_comprobante).toString('base64') : null,
      foto_fachada: r.foto_fachada ? Buffer.from(r.foto_fachada).toString('base64') : null
    }));
    res.json(rowsWithImages);
  } catch(e){ console.error('GET prospectos:',e); res.status(500).json({error:e.message}); }
});

// ─── PROSPECTOS POST — usa SP_Prospectos_Insert ───────────────
app.post('/api/prospectos', async (req, res) => {
  try {
    const {
      nombre, rfc, contacto, telefono, email, estatus,
      tipoInmueble, tipoPersona, tieneSucursales, notas,
      calle, numExt, numInt, colonia, municipio, cp, estado,
      lat, lng, coordenadas_manuales,
      dias_disponibles, horario, ruta,
      foto_comprobante, foto_fachada, sucursales, contactos
    } = req.body;

    // ── 1. Resolver / crear empresa ───────────────────────────────
    let empresaId = 1;
    if (nombre?.trim()) {
      const [r] = await pool.query(
        `INSERT INTO empresas (Nombre_Empresa, RFC) VALUES (?,?)
         ON DUPLICATE KEY UPDATE Nombre_Empresa=VALUES(Nombre_Empresa)`,
        [nombre.trim(), rfc || null]
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

    // ── 2. CALL SP_Prospectos_Insert ──────────────────────────────
    //    Los parámetros OUT se pasan como variables de sesión MySQL (@var)
    await pool.query(
      `CALL SP_Prospectos_Insert(
         ?,  /* p_Empresa_ID               */
         ?,  /* p_Propietario_ID           */
         ?,  /* p_Fuente_ID                */
         ?,  /* p_Nombre_Prospecto         */
         ?,  /* p_Nombre_Comercial_Empresa */
         ?,  /* p_Correo                   */
         ?,  /* p_Telefono                 */
         ?,  /* p_Tipo_Persona             */
         ?,  /* p_Tiene_Sucursales         */
         ?,  /* p_Estatus                  */
         ?,  /* p_Tipo_Inmueble            */
         ?,  /* p_Notas                    */
         ?,  /* p_Calle                    */
         ?,  /* p_Num_Ext                  */
         ?,  /* p_Num_Int                  */
         ?,  /* p_Colonia                  */
         ?,  /* p_Municipio                */
         ?,  /* p_CP                       */
         ?,  /* p_Estado                   */
         ?,  /* p_Dias_Disponibles         */
         ?,  /* p_Horario                  */
         ?,  /* p_Ruta                     */
         @nuevo_id, @resultado, @mensaje
       )`,
      [
        empresaId,
        1,                                    // Propietario_ID default
        1,                                    // Fuente_ID default
        (contacto || nombre || '').trim(),    // Nombre_Prospecto
        (nombre || contacto || '').trim(),    // Nombre_Comercial_Empresa
        email     || null,
        telefono  || null,
        tipoPersona     || 'Moral',
        tieneSucursales || 'No',
        estatus         || 'Nuevo',
        tipoInmueble    || null,
        notas           || null,
        calle     || null,
        numExt    || null,
        numInt    || null,
        colonia   || null,
        municipio || null,
        cp        || null,
        estado    || null,
        dias_disponibles || null,
        horario          || null,
        ruta             || null
      ]
    );

    // ── 3. Leer parámetros OUT del SP ─────────────────────────────
    const [[out]] = await pool.query(
      'SELECT @nuevo_id as nuevo_id, @resultado as resultado, @mensaje as mensaje'
    );

    // ── 4. Evaluar resultado del SP ───────────────────────────────
    if (out.resultado !== 0) {
      // El SP rechazó la operación (validación interna)
      return res.status(400).json({ success: false, error: out.mensaje });
    }

    const prospectoId = out.nuevo_id;

    // ── 5. Guardar imágenes LONGBLOB (fuera del SP) ───────────────
    if (foto_comprobante && foto_comprobante.length > 50) {
      await pool.query(
        `UPDATE crm_prospectos SET Foto_Comprobante=? WHERE Prospecto_ID=?`,
        [Buffer.from(foto_comprobante, 'base64'), prospectoId]
      );
    }
    if (foto_fachada && foto_fachada.length > 50) {
      await pool.query(
        `UPDATE crm_prospectos SET Foto_Fachada=? WHERE Prospecto_ID=?`,
        [Buffer.from(foto_fachada, 'base64'), prospectoId]
      );
    }

    // ── 6. Sucursales y contactos ─────────────────────────────────
    if (tieneSucursales === 'Sí' && Array.isArray(sucursales) && sucursales.length > 0) {
      const vals = sucursales.map(s => [
        prospectoId, s.nombre_sucursal, s.correo_electronico, s.telefono_sucursal, s.nombre_responsable,
        s.calle || null, s.numExt || null, s.numInt || null, s.colonia || null,
        s.municipio || null, s.cp || null, s.estado || null,
        s.lat ? parseFloat(s.lat) : null, s.lng ? parseFloat(s.lng) : null,
        s.foto_comprobante && s.foto_comprobante.length > 50 ? Buffer.from(s.foto_comprobante, 'base64') : null,
        s.foto_fachada     && s.foto_fachada.length     > 50 ? Buffer.from(s.foto_fachada,    'base64') : null
      ]);
      await pool.query(
        `INSERT INTO crm_prospecto_sucursales
           (Prospecto_ID, Nombre_Sucursal, Correo_Electronico, Telefono_Sucursal, Nombre_Responsable,
            Calle, Num_Ext, Num_Int, Colonia, Municipio, CP, Estado, Lat, Lng, Foto_Comprobante, Foto_Fachada)
         VALUES ?`,
        [vals]
      );
    }
    if (Array.isArray(contactos) && contactos.length > 0) {
      const vals = contactos.map(c => [prospectoId, c.nombre_contacto, c.correo, c.representante_legal, c.telefono]);
      await pool.query(
        `INSERT INTO crm_prospecto_contactos (Prospecto_ID, Nombre_Contacto, Correo, Representante_Legal, Telefono) VALUES ?`,
        [vals]
      );
    }

    res.json({ success: true, id: prospectoId, message: out.mensaje });

  } catch (e) {
    console.error('POST prospecto:', e);
    res.status(500).json({ success: false, error: e.message, stack: e.stack });
  }
});


// ─── PROSPECTOS PUT — usa SP_Prospectos_Update ────────────────
app.put('/api/prospectos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, rfc, contacto, telefono, email, estatus,
      tipoInmueble, tipoPersona, tieneSucursales, notas,
      calle, numExt, numInt, colonia, municipio, cp, estado,
      lat, lng, coordenadas_manuales,
      dias_disponibles, horario, ruta,
      foto_comprobante, foto_fachada, sucursales, contactos
    } = req.body;

    // ── 1. CALL SP_Prospectos_Update ──────────────────────────────
    await pool.query(
      `CALL SP_Prospectos_Update(
         ?,  /* p_Prospecto_ID             */
         ?,  /* p_Nombre_Prospecto         */
         ?,  /* p_Nombre_Comercial_Empresa */
         ?,  /* p_Correo                   */
         ?,  /* p_Telefono                 */
         ?,  /* p_Tipo_Persona             */
         ?,  /* p_Tiene_Sucursales         */
         ?,  /* p_Estatus                  */
         ?,  /* p_Tipo_Inmueble            */
         ?,  /* p_Notas                    */
         ?,  /* p_Calle                    */
         ?,  /* p_Num_Ext                  */
         ?,  /* p_Num_Int                  */
         ?,  /* p_Colonia                  */
         ?,  /* p_Municipio                */
         ?,  /* p_CP                       */
         ?,  /* p_Estado                   */
         ?,  /* p_Dias_Disponibles         */
         ?,  /* p_Horario                  */
         ?,  /* p_Ruta                     */
         @resultado, @mensaje
       )`,
      [
        id,
        (contacto || nombre || '').trim(),
        (nombre   || contacto || '').trim(),
        email     || null,
        telefono  || null,
        tipoPersona     || 'Moral',
        tieneSucursales || 'No',
        estatus         || 'Nuevo',
        tipoInmueble    || null,
        notas           || null,
        calle     || null,
        numExt    || null,
        numInt    || null,
        colonia   || null,
        municipio || null,
        cp        || null,
        estado    || null,
        dias_disponibles || null,
        horario          || null,
        ruta             || null
      ]
    );

    // ── 2. Leer parámetros OUT ────────────────────────────────────
    const [[out]] = await pool.query(
      'SELECT @resultado as resultado, @mensaje as mensaje'
    );

    if (out.resultado !== 0) {
      return res.status(400).json({ success: false, error: out.mensaje });
    }

    // ── 3. Actualizar empresa si el nombre cambió ─────────────────
    if (nombre?.trim()) {
      const [pr] = await pool.query(
        `SELECT Empresa_ID FROM crm_prospectos WHERE Prospecto_ID=?`, [id]
      );
      if (pr.length > 0) {
        await pool.query(
          `UPDATE empresas SET Nombre_Empresa=?, RFC=? WHERE Empresa_ID=?`,
          [nombre.trim(), rfc || null, pr[0].Empresa_ID]
        );
      }
    }

    // ── 4. Imágenes LONGBLOB ──────────────────────────────────────
    if (foto_comprobante !== undefined) {
      await pool.query(
        `UPDATE crm_prospectos SET Foto_Comprobante=? WHERE Prospecto_ID=?`,
        [foto_comprobante && foto_comprobante.length > 50 ? Buffer.from(foto_comprobante, 'base64') : null, id]
      );
    }
    if (foto_fachada !== undefined) {
      await pool.query(
        `UPDATE crm_prospectos SET Foto_Fachada=? WHERE Prospecto_ID=?`,
        [foto_fachada && foto_fachada.length > 50 ? Buffer.from(foto_fachada, 'base64') : null, id]
      );
    }

    // ── 5. Sucursales y contactos (reemplazo completo) ────────────
    await pool.query(`DELETE FROM crm_prospecto_sucursales WHERE Prospecto_ID=?`, [id]);
    if (tieneSucursales === 'Sí' && Array.isArray(sucursales) && sucursales.length > 0) {
      const vals = sucursales.map(s => [
        id, s.nombre_sucursal, s.correo_electronico, s.telefono_sucursal, s.nombre_responsable,
        s.calle || null, s.numExt || null, s.numInt || null, s.colonia || null,
        s.municipio || null, s.cp || null, s.estado || null,
        s.lat ? parseFloat(s.lat) : null, s.lng ? parseFloat(s.lng) : null,
        s.foto_comprobante && s.foto_comprobante.length > 50 ? Buffer.from(s.foto_comprobante, 'base64') : null,
        s.foto_fachada     && s.foto_fachada.length     > 50 ? Buffer.from(s.foto_fachada,    'base64') : null
      ]);
      await pool.query(
        `INSERT INTO crm_prospecto_sucursales
           (Prospecto_ID, Nombre_Sucursal, Correo_Electronico, Telefono_Sucursal, Nombre_Responsable,
            Calle, Num_Ext, Num_Int, Colonia, Municipio, CP, Estado, Lat, Lng, Foto_Comprobante, Foto_Fachada)
         VALUES ?`,
        [vals]
      );
    }

    await pool.query(`DELETE FROM crm_prospecto_contactos WHERE Prospecto_ID=?`, [id]);
    if (Array.isArray(contactos) && contactos.length > 0) {
      const vals = contactos.map(c => [id, c.nombre_contacto, c.correo, c.representante_legal, c.telefono]);
      await pool.query(
        `INSERT INTO crm_prospecto_contactos (Prospecto_ID, Nombre_Contacto, Correo, Representante_Legal, Telefono) VALUES ?`,
        [vals]
      );
    }

    res.json({ success: true, message: out.mensaje });

  } catch (e) {
    console.error('PUT prospecto:', e);
    res.status(500).json({ success: false, error: e.message, stack: e.stack });
  }
});

// ─── PROSPECTOS FOTO (GET) ────────────────────────────────────
app.get('/api/prospectos/:id/foto/:tipo', async (req, res) => {
  try {
    const { id, tipo } = req.params;
    const col = tipo === 'fachada' ? 'Foto_Fachada' : 'Foto_Comprobante';
    const [rows] = await pool.query(
      `SELECT ${col} as foto FROM crm_prospectos WHERE Prospecto_ID=?`, [id]
    );
    if (!rows.length || !rows[0].foto) {
      return res.status(404).json({ error: 'No encontrada' });
    }
    // Asumimos que es jpeg o png; como no guardamos el mime, mandamos octet-stream o intentamos adivinar
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(rows[0].foto);
  } catch(e) {
    console.error('GET foto:', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── SUCURSALES Y CONTACTOS (GET) ─────────────────────────────
app.get('/api/prospectos/:id/sucursales', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT 
      Sucursal_ID as id, Nombre_Sucursal as nombre_sucursal, Correo_Electronico as correo_electronico, 
      Telefono_Sucursal as telefono_sucursal, Nombre_Responsable as nombre_responsable,
      Calle as calle, Num_Ext as numExt, Num_Int as numInt, Colonia as colonia, 
      Municipio as municipio, CP as cp, Estado as estado, Lat as lat, Lng as lng,
      Foto_Comprobante as foto_comprobante, Foto_Fachada as foto_fachada
    FROM crm_prospecto_sucursales WHERE Prospecto_ID=?`, [req.params.id]);
    const rowsWithImages = rows.map(r => ({
      ...r,
      foto_comprobante: r.foto_comprobante ? Buffer.from(r.foto_comprobante).toString('base64') : null,
      foto_fachada: r.foto_fachada ? Buffer.from(r.foto_fachada).toString('base64') : null
    }));
    res.json(rowsWithImages);
  } catch(e) { console.error('GET sucursales:',e); res.status(500).json({error:e.message}); }
});

app.get('/api/prospectos/:id/contactos', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT Contacto_ID as id, Nombre_Contacto as nombre_contacto, Correo as correo, Representante_Legal as representante_legal, Telefono as telefono FROM crm_prospecto_contactos WHERE Prospecto_ID=?`, [req.params.id]);
    res.json(rows);
  } catch(e) { console.error('GET contactos:',e); res.status(500).json({error:e.message}); }
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

// ─── TRATOS ───────────────────────────────────────────────────
app.post('/api/tratos', async (req, res) => {
  try {
    const { prospecto_id, nombre_trato, importe, fase_id } = req.body;
    const [r] = await pool.query(
      `INSERT INTO crm_tratos (Prospecto_ID, Nombre_Trato, Importe, Fase_ID) VALUES (?,?,?,?)`,
      [prospecto_id, nombre_trato, importe, fase_id]
    );
    res.json({ success:true, id: r.insertId });
  } catch(e) { console.error('POST tratos:',e); res.status(500).json({error:e.message}); }
});

// ─── SERVICIOS COTIZADOS CRUD ─────────────────────────────────
app.post('/api/servicios-cotizados', async (req, res) => {
  try {
    const { trato_id, tipo_residuo, frecuencia, periodicidad_pago, volumen_estimado, precio_unitario, dias_asignados, porcentaje_adicional } = req.body;
    const [r] = await pool.query(
      `INSERT INTO crm_servicios_cotizados (trato_id, tipo_residuo, frecuencia, periodicidad_pago, volumen_estimado, precio_unitario, dias_asignados, porcentaje_adicional) VALUES (?,?,?,?,?,?,?,?)`,
      [trato_id, tipo_residuo, frecuencia, periodicidad_pago, volumen_estimado, precio_unitario, dias_asignados, porcentaje_adicional]
    );
    res.json({ success:true, id: r.insertId });
  } catch(e) { console.error('POST servicios:',e); res.status(500).json({error:e.message}); }
});

app.get('/api/servicios-cotizados/:trato_id', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM crm_servicios_cotizados WHERE trato_id=?`, [req.params.trato_id]);
    res.json(rows);
  } catch(e) { console.error('GET servicios:',e); res.status(500).json({error:e.message}); }
});

app.put('/api/servicios-cotizados/:id', async (req, res) => {
  try {
    const { tipo_residuo, frecuencia, periodicidad_pago, volumen_estimado, precio_unitario, dias_asignados, porcentaje_adicional } = req.body;
    await pool.query(
      `UPDATE crm_servicios_cotizados SET tipo_residuo=?, frecuencia=?, periodicidad_pago=?, volumen_estimado=?, precio_unitario=?, dias_asignados=?, porcentaje_adicional=? WHERE id=?`,
      [tipo_residuo, frecuencia, periodicidad_pago, volumen_estimado, precio_unitario, dias_asignados, porcentaje_adicional, req.params.id]
    );
    res.json({ success:true });
  } catch(e) { console.error('PUT servicios:',e); res.status(500).json({error:e.message}); }
});

app.delete('/api/servicios-cotizados/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM crm_servicios_cotizados WHERE id=?`, [req.params.id]);
    res.json({ success:true });
  } catch(e) { console.error('DELETE servicios:',e); res.status(500).json({error:e.message}); }
});

// ─── BORRADORES DE COTIZACIÓN ───────────────────────────────────
app.get('/api/prospectos/:id/borradores', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM crm_cotizaciones_borradores WHERE Prospecto_ID=? ORDER BY Fecha_Creacion DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch(e) { console.error('GET borradores:',e); res.status(500).json({error:e.message}); }
});

app.post('/api/prospectos/:id/borradores', async (req, res) => {
  try {
    const { datos } = req.body;
    const [result] = await pool.query(
      `INSERT INTO crm_cotizaciones_borradores (Prospecto_ID, Datos_Borrador) VALUES (?, ?)`,
      [req.params.id, JSON.stringify(datos)]
    );
    res.json({ success:true, id: result.insertId });
  } catch(e) { console.error('POST borradores:',e); res.status(500).json({error:e.message}); }
});

app.delete('/api/borradores/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM crm_cotizaciones_borradores WHERE Borrador_ID=?`, [req.params.id]);
    res.json({ success:true });
  } catch(e) { console.error('DELETE borrador:',e); res.status(500).json({error:e.message}); }
});

// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor en puerto ${PORT}`));
