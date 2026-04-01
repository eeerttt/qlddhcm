
import express from 'express';

// NOTE: Run this migration if the column does not exist yet:
// ALTER TABLE system_notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

export default function(pool) {
    const router = express.Router();

    // Lấy thông báo phù hợp với quyền hạn của user (lọc hết hạn)
    router.get('/', async (req, res) => {
        const userId = req.headers['x-user-id'];
        try {
            const userRes = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
            if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
            const role = userRes.rows[0].role;

            const result = await pool.query(
                `SELECT n.*, u.name as sender_name 
                 FROM system_notifications n
                 LEFT JOIN users u ON n.sender_id = u.id
                 WHERE n.is_active = true 
                 AND (n.target_role = 'ALL' OR n.target_role = $1)
                 AND (n.expires_at IS NULL OR n.expires_at > NOW())
                 ORDER BY n.created_at DESC LIMIT 50`,
                [role]
            );
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Admin: Lấy TẤT CẢ thông báo (không lọc role, không lọc hết hạn)
    router.get('/admin', async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT n.*, u.name as sender_name 
                 FROM system_notifications n
                 LEFT JOIN users u ON n.sender_id = u.id
                 ORDER BY n.created_at DESC`
            );
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Gửi thông báo mới (có expires_at)
    router.post('/', async (req, res) => {
        const userId = req.headers['x-user-id'];
        const { title, content, type, targetRole, expiresAt } = req.body;
        try {
            const result = await pool.query(
                `INSERT INTO system_notifications (title, content, type, target_role, sender_id, expires_at)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [title, content, type || 'INFO', targetRole || 'ALL', userId, expiresAt || null]
            );
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Cập nhật thông báo
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const { title, content, type, targetRole, expiresAt } = req.body;
        try {
            const result = await pool.query(
                `UPDATE system_notifications 
                 SET title = $1, content = $2, type = $3, target_role = $4, expires_at = $5
                 WHERE id = $6 RETURNING *`,
                [title, content, type, targetRole, expiresAt || null, parseInt(id)]
            );
            if (result.rowCount === 0) return res.status(404).json({ error: "Không tìm thấy thông báo." });
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Xóa thông báo
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await pool.query(`DELETE FROM system_notifications WHERE id = $1`, [parseInt(id)]);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: "Không tìm thấy thông báo để xóa." });
            }
            res.json({ status: 'ok' });
        } catch (e) {
            console.error("Delete notification error:", e.message);
            res.status(500).json({ error: "Lỗi cơ sở dữ liệu khi xóa thông báo." });
        }
    });

    return router;
}
