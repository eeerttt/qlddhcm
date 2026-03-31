
import { LandParcel } from '../types';

const PRODUCTION_API_URL = 'https://apigeo.gisvn.space';

const getApiUrl = () => {
    const { hostname, protocol } = window.location;
    const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

    if (configuredApiUrl) {
        return configuredApiUrl.replace(/\/$/, '');
    }
    
    // Whitelist Production Domains
    if (['geo.gisvn.space', 'www.geo.gisvn.space', 'qlddhcm.io.vn', 'www.qlddhcm.io.vn'].includes(hostname)) {
        return PRODUCTION_API_URL; 
    }

    // Local Development
    const isLocal = 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.');

    if (isLocal) {
        return `${protocol}//${hostname}:3004`;
    }
    
    // Fallback cho môi trường khác (Codespace, Tunnel, etc)
    return `${protocol}//${hostname}:3004`;
};

export const API_URL = getApiUrl();

export interface ParcelDTO {
    gid?: number; 
    sothua: string;
    sodoto: string;
    tenchu?: string;
    diachi?: string;
    loaidat?: string; 
    dientich?: number;
    geometry?: any; 
    file?: File | null; 
    imageFile?: File | null;
    imageUrl?: string;
    [key: string]: any; 
}

export interface SpatialTable {
    table_name: string;
    display_name: string;
    description?: string;
}

const getAuthHeaders = () => {
    const headers: any = { 'Content-Type': 'application/json' };
    const userStr = localStorage.getItem('geo_user');
    const token = localStorage.getItem('geo_token'); // Lấy JWT token

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (userStr) {
        try {
            const u = JSON.parse(userStr);
            headers['x-user-id'] = u.id;
            headers['x-user-name'] = encodeURIComponent(u.name);
            headers['x-branch-id'] = u.branchId || u.branch_id;
        } catch (e) {}
    }
    return headers;
};

const handleResponse = async (res: Response) => {
    // Handle 401/403
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('geo_token');
        localStorage.removeItem('geo_user');
        window.location.reload();
        throw new Error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
    }

    const responseText = await res.text();
    let responseData: any = null;
    if (responseText) {
        try { responseData = JSON.parse(responseText); } catch (e) {}
    }
    if (!res.ok) {
        let message = `Lỗi API (${res.status})`;
        if (responseData && (responseData.error || responseData.message)) {
            message = responseData.error || responseData.message;
        }
        throw new Error(message);
    }
    return responseData || { status: 'ok' };
};

export const parcelApi = {
    getAll: async (layer: string, filters?: { sodoto?: string, sothua?: string, tenchu?: string, diachi?: string }) => {
        let queryString = `?t=${Date.now()}`;
        if (filters) {
            if (filters.sodoto) queryString += `&sodoto=${encodeURIComponent(filters.sodoto)}`;
            if (filters.sothua) queryString += `&sothua=${encodeURIComponent(filters.sothua)}`;
            if (filters.tenchu) queryString += `&tenchu=${encodeURIComponent(filters.tenchu)}`;
            if (filters.diachi) queryString += `&diachi=${encodeURIComponent(filters.diachi)}`;
        }
        const res = await fetch(`${API_URL}/api/data/${layer}${queryString}`, { headers: { ...getAuthHeaders() } });
        return await handleResponse(res);
    },

    getExtent: async (layer: string) => {
        const res = await fetch(`${API_URL}/api/data/${layer}/extent`, { headers: { ...getAuthHeaders() } });
        return await handleResponse(res);
    },

    create: async (layer: string, data: ParcelDTO) => {
        const res = await fetch(`${API_URL}/api/data/${layer}`, { method: 'POST', headers: { ...getAuthHeaders() }, body: JSON.stringify(data) });
        return await handleResponse(res);
    },

    bulkCreate: async (layer: string, items: ParcelDTO[]) => {
        const res = await fetch(`${API_URL}/api/data/${layer}/bulk`, { 
            method: 'POST', 
            headers: { ...getAuthHeaders() }, 
            body: JSON.stringify({ items }) 
        });
        return await handleResponse(res);
    },

    createWithUpload: async (layer: string, data: ParcelDTO) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'file' && data[key]) formData.append('file', data[key] as File);
            else if (key === 'imageFile' && data[key]) formData.append('imageFile', data[key] as File);
            else if (key === 'geometry' && data[key]) formData.append(key, JSON.stringify(data[key]));
            else if (data[key] !== undefined && data[key] !== null) formData.append(key, String(data[key]));
        });
        const headers = { ...getAuthHeaders() };
        delete headers['Content-Type'];
        const res = await fetch(`${API_URL}/api/data/${layer}/upload`, { method: 'POST', headers, body: formData });
        return await handleResponse(res);
    },

    update: async (layer: string, gid: number, data: ParcelDTO) => {
        const res = await fetch(`${API_URL}/api/data/${layer}/${gid}`, { method: 'PUT', headers: { ...getAuthHeaders() }, body: JSON.stringify(data) });
        return await handleResponse(res);
    },

    updateGeometry: async (layer: string, gid: number, geometry: any, area: number) => {
        const res = await fetch(`${API_URL}/api/data/${layer}/${gid}/geometry`, { method: 'PUT', headers: { ...getAuthHeaders() }, body: JSON.stringify({ geometry, area }) });
        return await handleResponse(res);
    },

    delete: async (layer: string, gid: number) => {
        const res = await fetch(`${API_URL}/api/data/${layer}/${gid}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
        return await handleResponse(res);
    },

    manageTables: {
        getAll: async (): Promise<SpatialTable[]> => {
            const res = await fetch(`${API_URL}/api/spatial-tables?t=${Date.now()}`, { headers: { ...getAuthHeaders() } });
            return await handleResponse(res);
        },
        create: async (tableName: string, displayName?: string, description?: string) => {
            const name = (tableName || '').toLowerCase().trim();
            const res = await fetch(`${API_URL}/api/spatial-tables`, {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({ tableName: name, displayName, description })
            });
            return await handleResponse(res);
        },
        link: async (tableName: string, displayName?: string, description?: string) => {
            const name = (tableName || '').toLowerCase().trim();
            const res = await fetch(`${API_URL}/api/spatial-tables/link`, {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({ tableName: name, displayName, description })
            });
            return await handleResponse(res);
        },
        rename: async (oldName: string, newName: string, displayName: string, description?: string, renamePhysical?: boolean) => {
            const res = await fetch(`${API_URL}/api/spatial-tables/rename`, {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({ 
                    oldName: oldName.toLowerCase().trim(), 
                    newName: newName.toLowerCase().trim(), 
                    displayName, 
                    description,
                    renamePhysical: !!renamePhysical
                })
            });
            return await handleResponse(res);
        },
        syncTable: async (tableName: string) => {
            const res = await fetch(`${API_URL}/api/spatial-tables/sync/${tableName}`, {
                method: 'POST',
                headers: { ...getAuthHeaders() }
            });
            return await handleResponse(res);
        },
        repairTable: async (tableName: string) => {
            const res = await fetch(`${API_URL}/api/spatial-tables/repair/${tableName}`, {
                method: 'POST',
                headers: { ...getAuthHeaders() }
            });
            return await handleResponse(res);
        },
        unlink: async (tableName: string) => {
            const name = (tableName || '').toLowerCase().trim();
            const res = await fetch(`${API_URL}/api/spatial-tables/unlink`, { 
                method: 'POST', 
                headers: { ...getAuthHeaders() }, 
                body: JSON.stringify({ tableName: name }) 
            });
            return await handleResponse(res);
        },
        delete: async (tableName: string) => {
            const name = (tableName || '').toLowerCase().trim();
            const res = await fetch(`${API_URL}/api/spatial-tables/${name}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
            return await handleResponse(res);
        }
    }
};
