
import { MOCK_DATA } from './mock_data.js';

export class MockPool {
    constructor() {
        console.log('ℹ️ Mock Database Pool initialized.');
    }

    async connect() {
        return {
            release: () => {},
            query: this.query.bind(this)
        };
    }

    async query(text, params) {
        const query = text.toLowerCase().trim();
        console.log(`[Mock DB Query] ${query} | Params: ${JSON.stringify(params)}`);

        if (query.includes('select * from branches')) {
            return { rows: MOCK_DATA.branches };
        }
        if (query.includes('select land_type')) {
            return { rows: MOCK_DATA.land_prices };
        }
        if (query.includes('select * from menu_items')) {
            return { rows: MOCK_DATA.menu_items };
        }
        if (query.includes('select * from system_settings')) {
            return { rows: MOCK_DATA.system_settings };
        }
        if (query.includes('from wms_layers')) {
            return { rows: MOCK_DATA.wms_layers.map(l => ({
                id: l.id, name: l.name, url: l.url, layers: l.layers, 
                visible: l.is_active, opacity: l.opacity, type: l.type, category: 'STANDARD'
            })) };
        }
        if (query.includes('from basemaps')) {
            return { rows: MOCK_DATA.basemaps.map(b => ({
                id: b.id, name: b.name, url: b.url, type: b.type, 
                isDefault: b.is_active, visible: b.is_active, useProxy: false
            })) };
        }
        if (query.includes('select * from users')) {
            if (params && params.length > 0) {
                const email = params[0];
                const user = MOCK_DATA.users.find(u => u.email === email);
                return { rows: user ? [user] : [] };
            }
            return { rows: MOCK_DATA.users };
        }
        if (query.includes('from spatial_tables_registry')) {
            return { rows: MOCK_DATA.spatial_tables.map(t => ({
                table_name: t.table_name, display_name: t.table_label, description: '', created_at: new Date()
            })) };
        }
        if (query.includes('from information_schema.columns')) {
            return { rows: [
                { column_name: 'gid' }, { column_name: 'sodoto' }, { column_name: 'sothua' }, 
                { column_name: 'tenchu' }, { column_name: 'diachi' }, { column_name: 'loaidat' }, 
                { column_name: 'dientich' }, { column_name: 'image_url' }, { column_name: 'geometry' }
            ] };
        }
        if (query.includes('from geometry_columns')) {
            return { rows: [{ srid: 4326 }] };
        }
        if (query.includes('select 1')) {
            return { rows: [{ '1': 1 }] };
        }
        if (query.includes('count(*)::int as count')) {
            return { rows: [{ count: 1500, area: 50000 }] };
        }
        if (query.includes('group by')) {
            return { rows: [
                { type: 'ONT', count: 800 }, { type: 'ODT', count: 400 }, { type: 'CLN', count: 300 }
            ] };
        }
        if (query.includes('select * from internal_messages')) {
            return { rows: [] };
        }
        if (query.includes('select * from system_notifications')) {
            return { rows: [] };
        }
        if (query.includes('select * from system_logs')) {
            return { rows: [] };
        }
        if (query.includes('insert into') || query.includes('update') || query.includes('delete')) {
            return { rowCount: 1, rows: [] };
        }

        return { rows: [] };
    }

    on(event, callback) {
        // Mock event emitter
    }
}
