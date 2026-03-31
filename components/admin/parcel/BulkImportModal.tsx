
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, FileUp, Database, Loader2, CheckCircle2, AlertTriangle, Layers, FileJson, Trash2, Edit2, Check, FileDigit, Map as MapIcon, Grid, Info, MousePointer2, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { parcelApi, ParcelDTO } from '../../../services/parcelApi';
import shp from 'shpjs';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetTable: string;
    onSuccess: () => void;
}

interface ParsedParcel extends ParcelDTO {
    tempId: string;
}

// Helper: Kiểm tra điểm nằm trong đa giác (Ray Casting algorithm)
const isPointInPoly = (x: number, y: number, poly: any[]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, targetTable, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedParcel[]>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const layoutRef = useRef({ scale: 1, offsetX: 0, offsetY: 0, minX: 0, minY: 0, height: 0, width: 0 });
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // View State (Zoom/Pan)
    const [viewState, setViewState] = useState({ k: 1, x: 0, y: 0 });

    // Editing State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editBuffer, setEditBuffer] = useState<ParsedParcel | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // 1. TÍNH TOÁN LAYOUT (BOUNDING BOX) KHI DỮ LIỆU THAY ĐỔI
    useEffect(() => {
        if (!canvasRef.current || parsedData.length === 0) return;
        const canvas = canvasRef.current;
        
        let allPoints: {x: number, y: number}[] = [];
        parsedData.forEach(p => {
            if (!p.geometry) return;
            const extractPoints = (coords: any[]) => {
                if (typeof coords[0] === 'number') {
                    allPoints.push({ x: coords[0], y: coords[1] });
                } else {
                    coords.forEach(c => extractPoints(c));
                }
            };
            extractPoints(p.geometry.coordinates);
        });

        if (allPoints.length === 0) return;

        const xs = allPoints.map(p => p.x);
        const ys = allPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const rangeX = maxX - minX || 0.00001;
        const rangeY = maxY - minY || 0.00001;

        const padding = 40;
        // Sử dụng kích thước thực tế của canvas để tính scale
        const scale = Math.min(
            (canvas.width - padding * 2) / rangeX,
            (canvas.height - padding * 2) / rangeY
        );

        const offsetX = (canvas.width - rangeX * scale) / 2;
        const offsetY = (canvas.height - rangeY * scale) / 2;

        layoutRef.current = { scale, offsetX, offsetY, minX, minY, height: canvas.height, width: canvas.width };
        setViewState({ k: 1, x: 0, y: 0 }); // Reset zoom/pan
    }, [parsedData]);

    // 2. HÀM VẼ CANVAS (GỌI KHI DATA, HOVER HOẶC EDIT THAY ĐỔI)
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Transform calculations
        const { scale, offsetX, offsetY, minX, minY, height, width } = layoutRef.current;
        const { k, x: panX, y: panY } = viewState;
        const cw = width / 2;
        const ch = height / 2;

        // Base transform (fit to screen) -> Center Origin -> Scale/Pan -> Restore Origin
        const tx = (x: number) => {
            const screenXBase = offsetX + (x - minX) * scale;
            return (screenXBase - cw) * k + cw + panX;
        };
        const ty = (y: number) => {
            const screenYBase = height - (offsetY + (y - minY) * scale);
            return (screenYBase - ch) * k + ch + panY;
        };

        // --- VẼ DYNAMIC GRID ---
        const gridSize = 40 * k;
        const startX = ((cw + panX) % gridSize + gridSize) % gridSize;
        const startY = ((ch + panY) % gridSize + gridSize) % gridSize;

        ctx.beginPath();
        ctx.strokeStyle = '#1e293b'; 
        ctx.lineWidth = 0.5;

        for (let x = startX; x <= canvas.width; x += gridSize) { 
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); 
        }
        for (let y = startY; y <= canvas.height; y += gridSize) { 
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); 
        }
        ctx.stroke();

        if (scale === 1 && minX === 0) return;

        // VẼ POLYGONS
        parsedData.forEach((p, i) => {
            if (!p.geometry) return;
            
            const isHovered = i === hoveredIndex;
            const isEditing = i === editingIndex;
            
            ctx.beginPath();
            
            const drawPolyPath = (coords: any[]) => {
                if (typeof coords[0][0] === 'number') {
                    coords.forEach((pt: number[], idx: number) => {
                        if (idx === 0) ctx.moveTo(tx(pt[0]), ty(pt[1]));
                        else ctx.lineTo(tx(pt[0]), ty(pt[1]));
                    });
                    ctx.closePath();
                } else {
                    coords.forEach(c => drawPolyPath(c));
                }
            };

            drawPolyPath(p.geometry.coordinates);

            if (isEditing) {
                ctx.fillStyle = 'rgba(249, 115, 22, 0.6)'; 
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2 / k;
            } else if (isHovered) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 2 / k;
            } else {
                const isInvalid = !p.sodoto || !p.sothua;
                if (isInvalid) {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; 
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
                } else {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; 
                    ctx.strokeStyle = '#3b82f6';
                }
                ctx.lineWidth = 1 / k;
            }

            ctx.fill();
            ctx.stroke();
        });
    }, [parsedData, hoveredIndex, editingIndex, viewState]);

    useEffect(() => { draw(); }, [draw]);

    // 3. XỬ LÝ SỰ KIỆN CHUỘT
    const handleCanvasWheel = (e: React.WheelEvent) => {
        e.preventDefault(); 
        e.stopPropagation();

        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Chuyển đổi tọa độ chuột màn hình sang tọa độ Canvas nội bộ
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        const scaleBy = 1.1;
        const newK = e.deltaY < 0 
            ? Math.min(viewState.k * scaleBy, 50) 
            : Math.max(viewState.k / scaleBy, 0.1);

        const cw = canvasRef.current.width / 2;
        const ch = canvasRef.current.height / 2;
        
        const newX = (mx - cw) - (mx - cw - viewState.x) * (newK / viewState.k);
        const newY = (my - ch) - (my - ch - viewState.y) * (newK / viewState.k);

        setViewState({ k: newK, x: newX, y: newY });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleCanvasMouseUp = () => { isDragging.current = false; };
    const handleCanvasMouseLeave = () => { isDragging.current = false; setHoveredIndex(null); };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        if (isDragging.current) {
            const dx = (e.clientX - lastMousePos.current.x) * scaleX;
            const dy = (e.clientY - lastMousePos.current.y) * scaleY;
            setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // --- INVERSE TRANSFORM HIT TESTING ---
        // 1. Lấy tọa độ chuột trên Canvas
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        const { scale, offsetX, offsetY, minX, minY, height, width } = layoutRef.current;
        const { k, x: panX, y: panY } = viewState;
        const cw = width / 2;
        const ch = height / 2;

        // 2. Chuyển ngược tọa độ chuột về Data Space (Tọa độ gốc của file)
        // Công thức Draw: screenX = ( (DataX - minX)*scale + offsetX - cw ) * k + cw + panX
        // => Inverse: DataX = ( (screenX - panX - cw)/k + cw - offsetX ) / scale + minX
        
        const mouseDataX = ((mx - panX - cw) / k + cw - offsetX) / scale + minX;
        // Y đảo ngược trong Draw: screenY = height - (offsetY + (DataY - minY)*scale) ...
        // => height - screenY = ...
        // => DataY = ( (height - ( (screenY - panY - ch)/k + ch )) - offsetY ) / scale + minY
        
        // Bước trung gian giải Pan/Zoom
        const screenYBase = height - ((my - panY - ch) / k + ch);
        const mouseDataY = (screenYBase - offsetY) / scale + minY;

        let found = -1;
        
        // 3. So sánh trực tiếp với dữ liệu gốc (không cần biến đổi Polygon nữa)
        for (let i = parsedData.length - 1; i >= 0; i--) {
            const p = parsedData[i];
            if (!p.geometry) continue;

            const checkPoly = (coords: any[]) => {
                if (typeof coords[0][0] === 'number') {
                    // coords là mảng các điểm [x, y] gốc
                    if (isPointInPoly(mouseDataX, mouseDataY, coords)) return true;
                } else {
                    for (let c of coords) {
                        if (checkPoly(c)) return true;
                    }
                }
                return false;
            };

            if (checkPoly(p.geometry.coordinates)) {
                found = i;
                break;
            }
        }
        
        setHoveredIndex(found !== -1 ? found : null);
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.detail === 2) {
            setViewState({ k: 1, x: 0, y: 0 });
            return;
        }

        if (hoveredIndex !== null) {
            startEditing(hoveredIndex);
            const row = document.getElementById(`row-${parsedData[hoveredIndex].tempId}`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('bg-blue-600/30');
                setTimeout(() => row.classList.remove('bg-blue-600/30'), 1000);
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        
        setFile(selectedFile);
        setIsParsing(true);
        setError(null);
        setParsedData([]);
        setEditingIndex(null);

        try {
            const reader = new FileReader();
            if (selectedFile.name.toLowerCase().endsWith('.zip')) {
                reader.onload = async (event) => {
                    try {
                        const buffer = event.target?.result as ArrayBuffer;
                        const geojson: any = await shp(buffer);
                        processGeoJSON(Array.isArray(geojson) ? geojson[0] : geojson);
                    } catch (err: any) { setError("Lỗi giải mã Shapefile: " + err.message); }
                    finally { setIsParsing(false); }
                };
                reader.readAsArrayBuffer(selectedFile);
            } else {
                reader.onload = (event) => {
                    try {
                        const content = JSON.parse(event.target?.result as string);
                        processGeoJSON(content);
                    } catch (err: any) { setError("File JSON không hợp lệ."); }
                    finally { setIsParsing(false); }
                };
                reader.readAsText(selectedFile);
            }
        } catch (err) { setError("Lỗi hệ thống."); setIsParsing(false); }
    };

    const processGeoJSON = (geojson: any) => {
        const features = geojson.features || (geojson.type === 'Feature' ? [geojson] : []);
        if (!features || features.length === 0) {
            setError("Không tìm thấy dữ liệu thửa đất nào.");
            return;
        }

        const results: ParsedParcel[] = features
            .filter((f: any) => f.geometry) 
            .map((f: any, index: number) => {
                const props = f.properties || {};
                
                const findVal = (keys: string[]) => {
                    for (const k of keys) {
                        const foundKey = Object.keys(props).find(pk => pk.toLowerCase() === k.toLowerCase());
                        if (foundKey && props[foundKey]) return props[foundKey];
                    }
                    return '';
                };

                let areaVal = parseFloat(findVal(['dientich', 'dien_tich', 'shape_area', 'area', 'dt_phaply']));
                
                return {
                    tempId: `tmp-${Date.now()}-${index}`,
                    sodoto: findVal(['sodoto', 'so_to', 'shbando', 'map_sheet', 'tobando', 'shmap']).toString(),
                    sothua: findVal(['sothua', 'so_thua', 'shthua', 'parcel_no', 'shparcel']).toString(),
                    tenchu: findVal(['tenchu', 'owner', 'ten_chu', 'chusudung']),
                    loaidat: findVal(['loaidat', 'kyhieumucd', 'mucdich', 'mdsd']).toUpperCase(),
                    diachi: findVal(['diachi', 'address', 'location']),
                    dientich: areaVal > 0 ? Math.round(areaVal * 100) / 100 : 0,
                    geometry: f.geometry 
                };
            });

        if (results.length === 0) {
            setError("Không tìm thấy đối tượng không gian hợp lệ.");
        } else {
            setParsedData(results);
        }
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setEditBuffer({ ...parsedData[index] });
    };

    const saveRow = () => {
        if (editingIndex !== null && editBuffer) {
            const newData = [...parsedData];
            newData[editingIndex] = editBuffer;
            setParsedData(newData);
            setEditingIndex(null);
            setEditBuffer(null);
        }
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setEditBuffer(null);
    };

    const handleImport = async () => {
        const invalidOnes = parsedData.filter(p => !p.sodoto || !p.sothua);
        if (invalidOnes.length > 0) {
            setError(`Còn ${invalidOnes.length} thửa đất thiếu Số Tờ/Số Thửa (màu đỏ). Vui lòng sửa trước khi nạp.`);
            return;
        }

        setImporting(true);
        try {
            await parcelApi.bulkCreate(targetTable, parsedData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally { setImporting(false); }
    };

    if (!isOpen) return null;

    const totalCount = parsedData.length;
    const validCount = parsedData.filter(p => p.sodoto && p.sothua).length;
    const invalidCount = totalCount - validCount;

    return (
        <div className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600/20 p-2.5 rounded-2xl border border-indigo-500/30">
                            <Layers className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase text-white leading-none mb-1">Kiểm soát dữ liệu nhập tệp</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Database size={10}/> PostGIS: {targetTable}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-2 hover:bg-gray-800 rounded-full transition-all"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* LEFT PANEL: MAP PREVIEW (CANVAS) & STATUS */}
                    <div className="flex-1 bg-gray-950 relative border-r border-gray-800 flex flex-col">
                        
                        {/* CANVAS AREA */}
                        <div className="flex-1 relative flex items-center justify-center bg-gray-900/50 overflow-hidden group">
                            {isParsing ? (
                                <div className="flex flex-col items-center gap-4 animate-in fade-in">
                                    <Loader2 className="animate-spin text-blue-500" size={48} />
                                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Đang đọc file...</p>
                                </div>
                            ) : parsedData.length > 0 ? (
                                <>
                                    <canvas 
                                        ref={canvasRef} 
                                        width={600} 
                                        height={600} 
                                        className={`w-full h-full object-contain transition-all duration-75 animate-in zoom-in-95 ${hoveredIndex !== null ? 'cursor-pointer' : isDragging.current ? 'cursor-grabbing' : 'cursor-grab'}`}
                                        onMouseMove={handleCanvasMouseMove}
                                        onMouseDown={handleCanvasMouseDown}
                                        onMouseUp={handleCanvasMouseUp}
                                        onMouseLeave={handleCanvasMouseLeave}
                                        onWheel={handleCanvasWheel}
                                        onClick={handleCanvasClick}
                                    />
                                    
                                    {/* INFO BADGES */}
                                    <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700 flex items-center gap-2 pointer-events-none">
                                        <MapIcon size={12} className="text-blue-400"/>
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">Xem trước hình dáng</span>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700 flex items-center gap-2 pointer-events-none">
                                        <MousePointer2 size={12} className="text-slate-500"/>
                                        <span className="text-[9px] font-mono text-slate-500">
                                            {hoveredIndex !== null 
                                                ? `Đang chọn: ${parsedData[hoveredIndex].sodoto}/${parsedData[hoveredIndex].sothua}` 
                                                : `Zoom: ${Math.round(viewState.k * 100)}%`}
                                        </span>
                                    </div>

                                    {/* ZOOM CONTROLS */}
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <button onClick={() => setViewState(p => ({ ...p, k: Math.min(p.k * 1.2, 20) }))} className="p-2 bg-gray-800 hover:bg-blue-600 rounded-lg text-white shadow-lg transition-all"><ZoomIn size={16}/></button>
                                        <button onClick={() => setViewState(p => ({ ...p, k: Math.max(p.k / 1.2, 0.1) }))} className="p-2 bg-gray-800 hover:bg-blue-600 rounded-lg text-white shadow-lg transition-all"><ZoomOut size={16}/></button>
                                        <button onClick={() => setViewState({ k: 1, x: 0, y: 0 })} className="p-2 bg-gray-800 hover:bg-orange-600 rounded-lg text-white shadow-lg transition-all" title="Reset View"><RotateCcw size={16}/></button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center opacity-30 flex flex-col items-center gap-4">
                                    <FileUp size={64} className="text-gray-500" />
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Chưa có dữ liệu không gian</p>
                                </div>
                            )}
                        </div>

                        {/* STATUS BAR */}
                        <div className="h-24 bg-gray-950 border-t border-gray-800 p-4 flex items-center justify-between shrink-0">
                            {parsedData.length > 0 ? (
                                <div className="flex items-center gap-6 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg"><FileJson size={18} className="text-white"/></div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Tổng số thửa</p>
                                            <p className="text-xl font-black text-white leading-none">{totalCount}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-800"></div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-900/20 rounded-lg"><CheckCircle2 size={18} className="text-emerald-500"/></div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Hợp lệ</p>
                                            <p className="text-xl font-black text-emerald-500 leading-none">{validCount}</p>
                                        </div>
                                    </div>
                                    {invalidCount > 0 && (
                                        <>
                                            <div className="w-px h-8 bg-gray-800"></div>
                                            <div className="flex items-center gap-3 animate-pulse">
                                                <div className="p-2 bg-red-900/20 rounded-lg"><AlertTriangle size={18} className="text-red-500"/></div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Thiếu thông tin</p>
                                                    <p className="text-xl font-black text-red-500 leading-none">{invalidCount}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-600 w-full justify-center">
                                    <Info size={16}/>
                                    <span className="text-[10px] font-bold uppercase">Vui lòng chọn file để bắt đầu</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: DATA TABLE */}
                    <div className="w-full lg:w-[500px] flex flex-col bg-gray-900 shrink-0 border-l border-gray-800">
                        <div className="p-6 border-b border-gray-800 space-y-6">
                            <div 
                                className={`p-5 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex items-center gap-4 ${file ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-800 hover:border-indigo-500/50 bg-gray-950'}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className={`p-3 rounded-2xl ${file ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                    <FileUp size={24}/>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-white uppercase mb-0.5">{file ? "Thay đổi tệp nguồn" : "Chọn tệp dữ liệu"}</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase truncate max-w-[200px]">{file ? file.name : "ZIP (SHP) hoặc GEOJSON"}</p>
                                </div>
                                <input ref={fileInputRef} type="file" className="hidden" accept=".zip,.geojson,.json" onChange={handleFileChange} />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
                                    <AlertTriangle className="text-red-500 shrink-0" size={18}/>
                                    <p className="text-[10px] text-red-400 font-black leading-tight uppercase tracking-tighter">{error}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-auto custom-scrollbar bg-gray-950/20">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-950 text-gray-600 uppercase text-[9px] font-black tracking-widest sticky top-0 z-10 border-b border-gray-800">
                                        <tr>
                                            <th className="p-4 w-12 text-center">STT</th>
                                            <th className="p-4 w-28">Số tờ/thửa</th>
                                            <th className="p-4">Thông tin</th>
                                            <th className="p-4 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {parsedData.map((p, i) => {
                                            const isEditing = editingIndex === i;
                                            const isInvalid = !p.sodoto || !p.sothua;

                                            return (
                                                <tr 
                                                    key={p.tempId} 
                                                    id={`row-${p.tempId}`}
                                                    className={`transition-all ${isEditing ? 'bg-orange-600/10' : isInvalid ? 'bg-red-600/5' : 'hover:bg-indigo-600/5'}`}
                                                >
                                                    <td className="p-4 text-center text-gray-700 font-mono text-[10px]">{i + 1}</td>
                                                    <td className="p-2">
                                                        {isEditing ? (
                                                            <div className="flex gap-1">
                                                                <input className="w-full bg-gray-950 border border-orange-500/50 rounded px-2 py-1.5 text-[11px] text-white font-black" value={editBuffer?.sodoto} onChange={e=>setEditBuffer({...editBuffer!, sodoto: e.target.value})} placeholder="Tờ" />
                                                                <input className="w-full bg-gray-950 border border-orange-500/50 rounded px-2 py-1.5 text-[11px] text-white font-black" value={editBuffer?.sothua} onChange={e=>setEditBuffer({...editBuffer!, sothua: e.target.value})} placeholder="Thửa" />
                                                            </div>
                                                        ) : (
                                                            <span className={`font-black text-sm ${isInvalid ? 'text-red-500' : 'text-blue-400'}`}>
                                                                {p.sodoto || '?'}/{p.sothua || '?'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {isEditing ? (
                                                            <div className="space-y-1.5">
                                                                <input className="w-full bg-gray-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-white" value={editBuffer?.tenchu || ''} onChange={e=>setEditBuffer({...editBuffer!, tenchu: e.target.value})} placeholder="Chủ sử dụng" />
                                                                <input className="w-full bg-gray-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-blue-300 font-bold uppercase" value={editBuffer?.loaidat || ''} onChange={e=>setEditBuffer({...editBuffer!, loaidat: e.target.value.toUpperCase()})} placeholder="Loại đất" />
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <p className="text-[11px] font-bold text-gray-300 truncate max-w-[200px]">{p.tenchu || <span className="italic opacity-30">Chưa nhập tên</span>}</p>
                                                                <div className="flex gap-2">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase px-1.5 py-0.5 bg-gray-900 rounded border border-gray-800">{p.loaidat || '--'}</span>
                                                                    <span className="text-[9px] font-mono text-emerald-600 flex items-center gap-1"><FileDigit size={8}/> {p.dientich} m²</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {isEditing ? (
                                                            <div className="flex gap-1 justify-end">
                                                                <button onClick={saveRow} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500"><Check size={14}/></button>
                                                                <button onClick={cancelEditing} className="p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-gray-700"><X size={14}/></button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => startEditing(i)} className="p-1.5 text-gray-500 hover:text-blue-400"><Edit2 size={14}/></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 bg-gray-950 border-t border-gray-800 flex justify-end gap-2">
                                <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-white font-black text-[10px] uppercase tracking-widest">HỦY BỎ</button>
                                <button 
                                    onClick={handleImport} 
                                    disabled={importing || parsedData.length === 0 || editingIndex !== null}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-xl shadow-indigo-900/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {importing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                                    XÁC NHẬN NẠP DB
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
