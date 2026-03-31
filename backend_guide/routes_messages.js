
import express from 'express';

export default function(pool) {
    const router = express.Router();

    // Lấy Hộp thư đến (Inbox)
    router.get('/inbox', async (req, res) => {
        const userId = req.headers['x-user-id'];
        try {
            const query = `
                SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.email as sender_email
                FROM internal_messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.receiver_id = $1 AND m.is_deleted = false
                ORDER BY m.timestamp DESC
            `;
            const result = await pool.query(query, [userId]);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Lấy Thư đã gửi (Sent)
    router.get('/sent', async (req, res) => {
        const userId = req.headers['x-user-id'];
        try {
            const query = `
                SELECT m.*, u.name as receiver_name, u.avatar as receiver_avatar, u.email as receiver_email
                FROM internal_messages m
                JOIN users u ON m.receiver_id = u.id
                WHERE m.sender_id = $1 AND m.is_deleted = false
                ORDER BY m.timestamp DESC
            `;
            const result = await pool.query(query, [userId]);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Lấy Thùng rác (Trash)
    router.get('/trash', async (req, res) => {
        const userId = req.headers['x-user-id'];
        try {
            const query = `
                SELECT m.*, 
                       u_send.name as sender_name, u_send.avatar as sender_avatar, u_send.email as sender_email,
                       u_recv.name as receiver_name, u_recv.avatar as receiver_avatar, u_recv.email as receiver_email
                FROM internal_messages m
                JOIN users u_send ON m.sender_id = u_send.id
                JOIN users u_recv ON m.receiver_id = u_recv.id
                WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND m.is_deleted = true
                ORDER BY m.deleted_at DESC, m.timestamp DESC
            `;
            const result = await pool.query(query, [userId]);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Gửi thư mới
    router.post('/', async (req, res) => {
        const userId = req.headers['x-user-id'];
        const { receiverId, content } = req.body;
        try {
            const senderCheck = await pool.query(`SELECT can_chat FROM users WHERE id = $1`, [userId]);
            if (senderCheck.rows.length === 0 || !senderCheck.rows[0].can_chat) {
                return res.status(403).json({ error: "Tài khoản bị hạn chế gửi thư." });
            }
            const query = `INSERT INTO internal_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *`;
            const result = await pool.query(query, [userId, receiverId, content]);
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Chuyển vào thùng rác (hoặc xóa vĩnh viễn nếu đã ở thùng rác)
    router.delete('/:id', async (req, res) => {
        const userId = req.headers['x-user-id'];
        const { id } = req.params;
        try {
            const check = await pool.query(`SELECT is_deleted FROM internal_messages WHERE id = $1`, [id]);
            if (check.rows.length === 0) return res.status(404).send();

            if (check.rows[0].is_deleted) {
                // Xóa vĩnh viễn
                await pool.query(`DELETE FROM internal_messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)`, [id, userId]);
            } else {
                // Chuyển vào thùng rác - SET deleted_at = NOW()
                await pool.query(`UPDATE internal_messages SET is_deleted = true, deleted_at = NOW() WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)`, [id, userId]);
            }
            res.json({ status: 'ok' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Khôi phục từ thùng rác
    router.put('/restore/:id', async (req, res) => {
        const userId = req.headers['x-user-id'];
        const { id } = req.params;
        try {
            // Khôi phục - SET deleted_at = NULL
            await pool.query(`UPDATE internal_messages SET is_deleted = false, deleted_at = NULL WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)`, [id, userId]);
            res.json({ status: 'ok' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Đếm thư chưa đọc
    router.get('/unread/count', async (req, res) => {
        const userId = req.headers['x-user-id'];
        try {
            const result = await pool.query(`SELECT COUNT(*)::int as count FROM internal_messages WHERE receiver_id = $1 AND is_read = false AND is_deleted = false`, [userId]);
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Đánh dấu thư đã xem
    router.put('/read/:id', async (req, res) => {
        const userId = req.headers['x-user-id'];
        const { id } = req.params;
        try {
            await pool.query(`UPDATE internal_messages SET is_read = true WHERE id = $1 AND receiver_id = $2`, [id, userId]);
            res.json({ status: 'ok' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    return router;
}
