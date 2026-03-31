
import express from 'express';

export default function(pool) {
    const router = express.Router();

    // Lấy thông báo phù hợp với quyền hạn của user
    router.get('/', async (req, res) => {
        const userId = req.headers['x-user-id'];
        try {
            // Lấy role của user để filter
            const userRes = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
            if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
            const role = userRes.rows[0].role;

            const result = await pool.query(
                `SELECT n.*, u.name as sender_name 
                 FROM system_notifications n
                 LEFT JOIN users u ON n.sender_id = u.id
                 WHERE n.is_active = true 
                 AND (n.target_role = 'ALL' OR n.target_role = $1)
                 ORDER BY n.created_at DESC LIMIT 50`,
                [role]
            );
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Gửi thông báo mới (Chỉ Admin)
    router.post('/', async (req, res) => {
        const userId = req.headers['x-user-id'];
        const { title, content, type, targetRole } = req.body;

        try {
            const result = await pool.query(
                `INSERT INTO system_notifications (title, content, type, target_role, sender_id)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [title, content, type || 'INFO', targetRole || 'ALL', userId]
            );
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Xóa thông báo (Sửa lỗi ép kiểu ID)
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
