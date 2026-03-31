
import express from 'express';
import os from 'os';
import { authenticateToken } from './middleware_auth.js';

export default function(pool, logSystemAction, dbConfig) {
    const router = express.Router();

    // --- WMS LAYERS ---
    router.get('/wms-layers', async (req, res) => {
        try { 
            const result = await pool.query(`SELECT id, name, url, layers, visible, opacity, type, category FROM wms_layers ORDER BY name ASC`);
            res.json(result.rows); 
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/wms-layers', authenticateToken, async (req, res) => {
        const { name, url, layers, visible, opacity, type, category } = req.body;
        try {
            const id = 'ly-' + Date.now();
            await pool.query(
                `INSERT INTO wms_layers (id, name, url, layers, visible, opacity, type, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [id, name, url, layers, visible, parseFloat(opacity) || 1, type || 'WMS', category || 'STANDARD']
            );
            await logSystemAction(req, 'ADD_LAYER', `Thêm lớp bản đồ: ${name}`);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.put('/wms-layers/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { name, url, layers, visible, opacity, type, category } = req.body;
        try {
            await pool.query(
                `UPDATE wms_layers SET name=$1, url=$2, layers=$3, visible=$4, opacity=$5, type=$6, category=$7 WHERE id=$8`,
                [name, url, layers, visible, parseFloat(opacity) || 1, type, category, id]
            );
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.delete('/wms-layers/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query(`DELETE FROM wms_layers WHERE id = $1`, [req.params.id]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- BASEMAPS ---
    router.get('/basemaps', async (req, res) => {
        try { res.json((await pool.query(`SELECT id, name, url, type, is_default as "isDefault", visible, use_proxy as "useProxy" FROM basemaps`)).rows); } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/basemaps', authenticateToken, async (req, res) => {
        const { name, url, type, isDefault, visible, useProxy } = req.body;
        try {
            const id = 'bm-' + Date.now();
            if (isDefault) await pool.query(`UPDATE basemaps SET is_default = false`);
            await pool.query(
                `INSERT INTO basemaps (id, name, url, type, is_default, visible, use_proxy) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                [id, name, url, type, isDefault, visible, useProxy || false]
            );
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.put('/basemaps/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { name, url, type, isDefault, visible, useProxy } = req.body;
        try {
            if (isDefault) await pool.query(`UPDATE basemaps SET is_default = false`);
            await pool.query(
                `UPDATE basemaps SET name=$1, url=$2, type=$3, is_default=$4, visible=$5, use_proxy=$6 WHERE id=$7`, 
                [name, url, type, isDefault, visible, useProxy || false, id]
            );
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.delete('/basemaps/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query(`DELETE FROM basemaps WHERE id = $1`, [req.params.id]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- ROLE PERMISSIONS ---
    router.get('/role-permissions', authenticateToken, async (req, res) => {
        try { res.json((await pool.query(`SELECT role, permissions FROM role_permissions`)).rows); } catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.post('/role-permissions', authenticateToken, async (req, res) => {
        try {
            await pool.query(`INSERT INTO role_permissions (role, permissions) VALUES ($1, $2) ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions`, [req.body.role, req.body.permissions]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- SYSTEM LOGS ---
    router.get('/logs', authenticateToken, async (req, res) => {
        try { res.json((await pool.query(`SELECT id, user_id as "userId", user_name as "userName", action, details, timestamp FROM system_logs ORDER BY timestamp DESC LIMIT 200`)).rows); } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- DB STATUS & SERVER INFO ---
    router.get('/db-check', authenticateToken, async (req, res) => {
        try { await pool.query('SELECT 1'); res.json({ status: 'connected', dbName: dbConfig.database, host: dbConfig.host }); } catch (e) { res.json({ status: 'error', message: e.message }); }
    });
    
    router.get('/server-info', authenticateToken, (req, res) => {
        res.json({ 
            osType: os.type(), 
            uptime: os.uptime(), 
            freeMem: os.freemem(), 
            totalMem: os.totalmem(),
            cpuModel: os.cpus()[0].model,
            cpuUsage: Math.random() * 30 // Demo, thực tế cần module phức tạp hơn để tính % CPU
        });
    });

    // --- BACKUP V2 ---
    router.get('/backup/tables', authenticateToken, async (req, res) => {
        try {
            const systemTables = ['users', 'branches', 'system_settings', 'land_prices', 'menu_items', 'wms_layers', 'basemaps', 'role_permissions', 'system_notifications', 'spatial_tables_registry'];
            const registryRes = await pool.query(`SELECT table_name FROM spatial_tables_registry`);
            const spatialTables = registryRes.rows.map(r => r.table_name);
            res.json({ system: systemTables, spatial: spatialTables });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/backup/create', authenticateToken, async (req, res) => {
        const { tables } = req.body;
        if (!tables || !Array.isArray(tables) || tables.length === 0) return res.status(400).json({ error: "Vui lòng chọn ít nhất một bảng để sao lưu." });
        try {
            let sqlDump = `-- GeoMaster WebGIS SQL Dump\n-- Date: ${new Date().toISOString()}\n\n`;
            for (const table of tables) {
                const colRes = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
                if (colRes.rows.length === 0) continue;
                const columns = colRes.rows.map(r => r.column_name);
                const dataQuery = `SELECT ${colRes.rows.map(r => r.data_type === 'USER-DEFINED' ? `ST_AsEWKT("${r.column_name}") as "${r.column_name}"` : `"${r.column_name}"`).join(', ')} FROM "${table}"`;
                const dataRes = await pool.query(dataQuery);
                sqlDump += `-- Data for: ${table}\nDELETE FROM "${table}";\n`;
                for (const row of dataRes.rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return val.startsWith('SRID=') ? `ST_GeomFromEWKT('${val.replace(/'/g, "''")}')` : `'${val.replace(/'/g, "''")}'`;
                        return (val instanceof Date) ? `'${val.toISOString()}'` : val;
                    });
                    sqlDump += `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
                }
                sqlDump += `\n`;
            }
            res.setHeader('Content-disposition', `attachment; filename=backup_${Date.now()}.sql`);
            res.setHeader('Content-type', 'text/plain');
            res.send(sqlDump);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    return router;
}
