
import express from 'express';
import { authenticateToken } from './middleware_auth.js';

export default function(pool, logSystemAction) {
    const router = express.Router();

    // --- BRANCHES ---
    router.get('/branches', async (req, res) => {
        try { res.json((await pool.query(`SELECT * FROM branches ORDER BY name`)).rows); } catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.post('/branches', authenticateToken, async (req, res) => {
        try {
            const id = 'br-' + Date.now();
            await pool.query(`INSERT INTO branches (id, code, name, address) VALUES ($1, $2, $3, $4)`, [id, req.body.code, req.body.name, req.body.address]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.put('/branches/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query(`UPDATE branches SET code=$1, name=$2, address=$3 WHERE id=$4`, [req.body.code, req.body.name, req.body.address, req.params.id]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.delete('/branches/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query(`DELETE FROM branches WHERE id=$1`, [req.params.id]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- LAND PRICES ---
    router.get('/land-prices', async (req, res) => {
        try { res.json((await pool.query(`SELECT land_type as "landType", base_price as "basePrice", description FROM land_prices`)).rows); } catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.post('/land-prices', authenticateToken, async (req, res) => {
        try { await pool.query(`INSERT INTO land_prices VALUES ($1, $2, $3)`, [req.body.landType, req.body.basePrice, req.body.description]); res.json({status:'ok'}); }
        catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.put('/land-prices/:id', authenticateToken, async (req, res) => {
        try { await pool.query(`UPDATE land_prices SET base_price=$1, description=$2 WHERE land_type=$3`, [req.body.basePrice, req.body.description, req.params.id]); res.json({status:'ok'}); }
        catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.delete('/land-prices/:id', authenticateToken, async (req, res) => {
        try { await pool.query(`DELETE FROM land_prices WHERE land_type=$1`, [req.params.id]); res.json({status:'ok'}); }
        catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- TRA CỨU BẢNG GIÁ ĐẤT 2026 ---
    // Lấy danh sách Phường/Xã nối kèm Tỉnh Cũ để phân biệt
    router.get('/land-prices-2026/wards', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT DISTINCT 
                phuongxa || ' (' || COALESCE(tinhcu, 'N/A') || ')' as label 
                FROM bang_gia_dat_2026 
                WHERE phuongxa IS NOT NULL AND phuongxa != '' 
                ORDER BY label ASC
            `);
            res.json(result.rows.map(r => r.label));
        } catch (e) { 
            if (e.code === '42P01') return res.json([]);
            res.status(500).json({ error: e.message }); 
        }
    });

    // API lấy gợi ý tổng hợp (Đường, Đoạn) dựa trên Phường/Xã (tách từ label)
    router.get('/land-prices-2026/suggestions', async (req, res) => {
        let { phuongxa } = req.query;
        if (phuongxa && phuongxa.includes(' (')) {
            phuongxa = phuongxa.split(' (')[0];
        }

        try {
            let whereClause = phuongxa ? `WHERE phuongxa = $1` : `WHERE 1=1`;
            const params = phuongxa ? [phuongxa] : [];

            const streets = await pool.query(`SELECT DISTINCT tenduong FROM bang_gia_dat_2026 ${whereClause} AND tenduong IS NOT NULL ORDER BY tenduong ASC`, params);
            const fromPoints = await pool.query(`SELECT DISTINCT tu FROM bang_gia_dat_2026 ${whereClause} AND tu IS NOT NULL ORDER BY tu ASC`, params);
            const toPoints = await pool.query(`SELECT DISTINCT den FROM bang_gia_dat_2026 ${whereClause} AND den IS NOT NULL ORDER BY den ASC`, params);

            res.json({
                streets: streets.rows.map(r => r.tenduong),
                fromPoints: fromPoints.rows.map(r => r.tu),
                toPoints: toPoints.rows.map(r => r.den)
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Tìm kiếm giá đất mở rộng
    router.get('/land-prices-2026/search', async (req, res) => {
        let { phuongxa, tenduong, tu, den } = req.query;
        if (phuongxa && phuongxa.includes(' (')) {
            phuongxa = phuongxa.split(' (')[0];
        }

        try {
            let query = `SELECT * FROM bang_gia_dat_2026 WHERE 1=1`;
            const params = [];
            let idx = 1;

            if (phuongxa) {
                query += ` AND phuongxa = $${idx++}`;
                params.push(phuongxa);
            }
            if (tenduong) {
                query += ` AND tenduong ILIKE $${idx++}`;
                params.push(`%${tenduong}%`);
            }
            if (tu) {
                query += ` AND tu ILIKE $${idx++}`;
                params.push(`%${tu}%`);
            }
            if (den) {
                query += ` AND den ILIKE $${idx++}`;
                params.push(`%${den}%`);
            }

            query += ` ORDER BY tinhcu ASC, phuongxa ASC, tenduong ASC, tu ASC`;
            
            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (e) {
            if (e.code === '42P01') return res.status(404).json({ error: "Bảng giá đất 2026 chưa được khởi tạo." });
            res.status(500).json({ error: e.message });
        }
    });

    // Admin APIs for Land Price 2026
    router.post('/land-prices-2026', authenticateToken, async (req, res) => {
        const { phuongxa, tenduong, tinhcu, tu, den, dato, dattmdv, datsxkdpnn, nam_ap_dung, nguon_du_lieu, ghi_chu } = req.body;
        try {
            await pool.query(`
                INSERT INTO bang_gia_dat_2026 
                (phuongxa, tenduong, tinhcu, tu, den, dato, dattmdv, datsxkdpnn, nam_ap_dung, nguon_du_lieu, ghi_chu)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [phuongxa, tenduong, tinhcu, tu, den, dato, dattmdv, datsxkdpnn, nam_ap_dung, nguon_du_lieu, ghi_chu]);
            res.json({ status: 'ok' });
        } catch(e) { res.status(500).json({ error: e.message }); }
    });

    router.put('/land-prices-2026/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { phuongxa, tenduong, tinhcu, tu, den, dato, dattmdv, datsxkdpnn, nam_ap_dung, nguon_du_lieu, ghi_chu } = req.body;
        try {
            await pool.query(`
                UPDATE bang_gia_dat_2026 
                SET phuongxa=$1, tenduong=$2, tinhcu=$3, tu=$4, den=$5, dato=$6, dattmdv=$7, datsxkdpnn=$8, nam_ap_dung=$9, nguon_du_lieu=$10, ghi_chu=$11
                WHERE id=$12
            `, [phuongxa, tenduong, tinhcu, tu, den, dato, dattmdv, datsxkdpnn, nam_ap_dung, nguon_du_lieu, ghi_chu, id]);
            res.json({ status: 'ok' });
        } catch(e) { res.status(500).json({ error: e.message }); }
    });

    router.delete('/land-prices-2026/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query(`DELETE FROM bang_gia_dat_2026 WHERE id=$1`, [req.params.id]);
            res.json({ status: 'ok' });
        } catch(e) { res.status(500).json({ error: e.message }); }
    });

    // --- MENU ITEMS ---
    router.get('/menu-items', async (req, res) => {
        try { res.json((await pool.query(`SELECT * FROM menu_items ORDER BY order_index ASC`)).rows); } catch (e) { res.status(500).json({ error: e.message }); }
    });
    
    router.post('/menu-items', authenticateToken, async (req, res) => {
        try {
            await pool.query(`INSERT INTO menu_items (id, label, icon, roles, order_index, is_active, type, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [req.body.id, req.body.label, req.body.icon, req.body.roles, req.body.order_index, req.body.is_active, req.body.type, req.body.url]);
            await logSystemAction(req, 'ADD_MENU', `Thêm mục menu: ${req.body.label}`);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.put('/menu-items/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { label, icon, roles, order_index, is_active, type, url } = req.body;
        try {
            await pool.query(`UPDATE menu_items SET label=$1, icon=$2, roles=$3, order_index=$4, is_active=$5, type=$6, url=$7 WHERE id=$8`, [label, icon, roles, order_index, is_active, type, url, id]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.delete('/menu-items/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query(`DELETE FROM menu_items WHERE id = $1`, [req.params.id]);
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- SYSTEM SETTINGS ---
    router.get('/settings', async (req, res) => {
        try { res.json((await pool.query(`SELECT * FROM system_settings`)).rows); } catch (e) { res.status(500).json({ error: e.message }); }
    });
    router.post('/settings', authenticateToken, async (req, res) => {
        try {
            for(const s of req.body.settings) {
                await pool.query(`INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [s.key, s.value]);
            }
            res.json({ status: 'ok' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    return router;
}
