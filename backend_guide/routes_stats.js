
import express from 'express';

export default function(pool) {
    const router = express.Router();

    const TYPE_COLS = ['kyhieumucd', 'loaidat', 'mucdich', 'mdsd', 'kh_mucdich'];
    const AREA_COLS = ['dientich', 'dien_tich', 'shape_area', 'dt_phaply', 'st_area'];
    const DATE_COLS = ['updated_at', 'created_at', 'ngaycapnhat', 'ngay_tao', 'timestamp'];

    const buildTimeFilter = (req) => {
        const { period = 'all', from, to } = req.query;

        if (from || to) {
            return {
                mode: 'range',
                from: from ? new Date(from) : null,
                to: to ? new Date(to) : null
            };
        }

        const now = Date.now();
        const periodMap = {
            '7d': 7,
            '30d': 30,
            '90d': 90
        };
        const days = periodMap[period];

        if (!days) return { mode: 'all' };

        return {
            mode: 'since',
            from: new Date(now - days * 24 * 60 * 60 * 1000)
        };
    };

    const buildWhereClause = (timeFilter, dateCol) => {
        if (!dateCol || !timeFilter || timeFilter.mode === 'all') {
            return { whereSql: '', params: [] };
        }

        if (timeFilter.mode === 'range') {
            const params = [];
            const conditions = [];
            if (timeFilter.from && !Number.isNaN(timeFilter.from.getTime())) {
                params.push(timeFilter.from.toISOString());
                conditions.push(`"${dateCol}" >= $${params.length}`);
            }
            if (timeFilter.to && !Number.isNaN(timeFilter.to.getTime())) {
                params.push(timeFilter.to.toISOString());
                conditions.push(`"${dateCol}" <= $${params.length}`);
            }
            if (conditions.length === 0) return { whereSql: '', params: [] };
            return { whereSql: `WHERE ${conditions.join(' AND ')}`, params };
        }

        if (timeFilter.mode === 'since' && timeFilter.from && !Number.isNaN(timeFilter.from.getTime())) {
            return {
                whereSql: `WHERE "${dateCol}" >= $1`,
                params: [timeFilter.from.toISOString()]
            };
        }

        return { whereSql: '', params: [] };
    };

    router.get('/dashboard', async (req, res) => {
        try {
            const registry = await pool.query('SELECT table_name, display_name FROM spatial_tables_registry');
            const tables = registry.rows;
            const timeFilter = buildTimeFilter(req);

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
                    const dateCol = DATE_COLS.find(c => actualCols.includes(c));
                    const { whereSql, params } = buildWhereClause(timeFilter, dateCol);

                    // Query tổng hợp nhanh
                    const statsQuery = `
                        SELECT 
                            COUNT(*)::int as count,
                            SUM(CASE WHEN "${areaCol}"::text ~ '^[0-9.]+$' THEN CAST("${areaCol}" AS NUMERIC) ELSE 0 END) as area
                        FROM "${tableName}"
                        ${whereSql}
                    `;
                    const basicStats = await pool.query(statsQuery, params);
                    
                    // Lấy phân bổ loại đất (giới hạn 5 loại hàng đầu để tránh overhead)
                    const typeDistRes = await pool.query(`
                        SELECT COALESCE("${typeCol}"::text, 'Khác') as type, COUNT(*)::int as count
                        FROM "${tableName}"
                        ${whereSql}
                        GROUP BY "${typeCol}"
                        ORDER BY count DESC LIMIT 5
                    `, params);

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
