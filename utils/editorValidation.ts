import { Polygon, MultiPolygon } from 'ol/geom';
import { getArea } from 'ol/sphere';

export const validateGeometry = (geometry: any): string | null => {
    if (!geometry) return 'Hình vẽ không hợp lệ';
    
    let coords: any[] = [];
    
    if (geometry instanceof Polygon) {
        coords = geometry.getCoordinates()[0];
    } else if (geometry instanceof MultiPolygon) {
        const polyCoords = geometry.getCoordinates();
        if (polyCoords.length > 0 && polyCoords[0].length > 0) {
            coords = polyCoords[0][0];
        }
    } else {
        return 'Loại hình học không hỗ trợ';
    }
    
    if (coords.length < 4) return 'Polygon cần tối thiểu 3 đỉnh (≥4 khi tính điểm khóp)';
    
    const area = getArea(geometry);
    if (area === 0) return 'Polygon có diện tích bằng 0';
    if (area < 1) return `Diện tích quá nhỏ (${area.toFixed(2)}m²). Kiểm tra lại tọa độ.`;
    
    // Check for self-intersection using line segment crossing test
    for (let i = 0; i < coords.length - 2; i++) {
        for (let j = i + 2; j < coords.length - 1; j++) {
            const [x1, y1] = coords[i];
            const [x2, y2] = coords[i + 1];
            const [x3, y3] = coords[j];
            const [x4, y4] = coords[j + 1];
            
            const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (Math.abs(denom) < 0.0001) continue;
            
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
            
            if (t > 0.0001 && t < 0.9999 && u > 0.0001 && u < 0.9999) {
                return 'Polygon tự giao nhau (self-intersection). Kiểm tra lại đỉnh.';
            }
        }
    }
    
    // Check polygon closure
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (Math.abs(first[0] - last[0]) > 0.01 || Math.abs(first[1] - last[1]) > 0.01) {
        return 'Polygon chưa khép lại (đỉnh đầu≠đỉnh cuối).';
    }
    
    return null;
};
