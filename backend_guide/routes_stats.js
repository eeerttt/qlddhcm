
import express from 'express';

export default function(pool) {
    const router = express.Router();

    const TYPE_COLS = ['kyhieumucd', 'loaidat', 'mucdich', 'mdsd', 'kh_mucdich'];
    const AREA_COLS = ['dientich', 'dien_tich', 'shape_area', 'dt_phaply', 'st_area'];

    router.get('/dashboard', async (req, res) => {
        try {
            const registry = await pool.query('SELECT table_name, display_name FROM spatial_tables_registry');
            const tables = registry.rows;

            if (tables.length === 0) {
                return res.json({ totalParcels: 0, totalArea: 0, totalValue: 0, parcelsByType: [], valueByBranch: [] });
            }

            let totalParcels = 0;
            let totalArea = 0;
            const typeMap = {}; 
            const branchStats = []; 

            // Sử dụng Promise.all để truy vấn song song thay vì tuần tự (Nhanh hơn đáng kể)
            const results = await Promise.all(tables.map(async (table) => {
                const tableName = table.table_name;
                const displayName = table.display_name || tableName;

                try {
                    // Kiểm tra nhanh sự tồn tại của bảng và cột (không query data)
                    const colRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [tableName]);
                    if (colRes.rows.length === 0) return null;
                    
                    const actualCols = colRes.rows.map(r => r.column_name.toLowerCase());
                    const typeCol = TYPE_COLS.find(c => actualCols.includes(c)) || 'loaidat';
                    const areaCol = AREA_COLS.find(c => actualCols.includes(c)) || 'dientich';

                    // Query tổng hợp nhanh
                    const statsQuery = `
                        SELECT 
                            COUNT(*)::int as count,
                            SUM(CASE WHEN "${areaCol}"::text ~ '^[0-9.]+$' THEN CAST("${areaCol}" AS NUMERIC) ELSE 0 END) as area
                        FROM "${tableName}"
                    `;
                    const basicStats = await pool.query(statsQuery);
                    
                    // Lấy phân bổ loại đất (giới hạn 5 loại hàng đầu để tránh overhead)
                    const typeDistRes = await pool.query(`
                        SELECT COALESCE("${typeCol}"::text, 'Khác') as type, COUNT(*)::int as count
                        FROM "${tableName}"
                        GROUP BY "${typeCol}"
                        ORDER BY count DESC LIMIT 5
                    `);

                    return {
                        tableName,
                        displayName,
                        count: parseInt(basicStats.rows[0].count || 0),
                        area: parseFloat(basicStats.rows[0].area || 0),
                        types: typeDistRes.rows
                    };
                } catch (e) {
                    console.warn(`Skip table ${tableName}:`, e.message);
                    return null;
                }
            }));

            // Tổng hợp kết quả
            results.filter(Boolean).forEach(r => {
                totalParcels += r.count;
                totalArea += r.area;
                branchStats.push({ name: r.displayName, value: r.count });
                r.types.forEach(t => {
                    typeMap[t.type] = (typeMap[t.type] || 0) + t.count;
                });
            });

            const parcelsByType = Object.entries(typeMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);

            res.json({
                totalParcels,
                totalArea,
                totalValue: totalArea * 5000000, 
                parcelsByType,
                valueByBranch: branchStats
            });

        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    return router;
}
