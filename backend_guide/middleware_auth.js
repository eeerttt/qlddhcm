
import jwt from 'jsonwebtoken';

// Trong môi trường thực tế, hãy chuyển key này vào biến môi trường (.env)
export const JWT_SECRET = process.env.JWT_SECRET || 'GEOMASTER_SECURE_KEY_2024_!@#';

export const authenticateToken = (req, res, next) => {
    // Bỏ qua xác thực cho các phương thức OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    // Định dạng: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access Denied: Vui lòng đăng nhập." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("[Auth] Token invalid or expired");
            return res.status(403).json({ error: "Session Expired: Phiên làm việc hết hạn." });
        }
        
        // Gắn thông tin user đã giải mã vào request để các route sau sử dụng
        req.user = user;
        next();
    });
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Access Denied: Vui lòng đăng nhập." });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden: Chỉ quản trị viên được phép thực hiện thao tác này." });
    }
    next();
};
