
import React, { useState, useMemo } from 'react';
import { Layers, Eye, EyeOff, MapPin, MousePointerClick, Search, Map as MapIcon, Landmark, ChevronDown, ChevronUp, X, Filter, SlidersHorizontal, Sun, CheckCircle2 } from 'lucide-react';
import { WMSLayerConfig, BasemapConfig } from '../../types';

interface LayerControlProps {
    isOpen: boolean;
    onToggleMenu: () => void;
    basemaps: BasemapConfig[];
    activeBasemapId: string;
    onBaseLayerChange: (id: string) => void;
    availableLayers: WMSLayerConfig[];
    visibleLayerIds: string[];
    activeLayerId: string | null;
    onToggleWMS: (id: string) => void;
    onSetActiveWMS: (id: string) => void;
    onOpacityChange: (id: string, opacity: number) => void;
    onClearAll: () => void;
}

const LayerControl: React.FC<LayerControlProps> = ({ 
    isOpen, onToggleMenu, basemaps, activeBasemapId, onBaseLayerChange, 
    availableLayers, visibleLayerIds, activeLayerId, onToggleWMS, onSetActiveWMS, onOpacityChange,
    onClearAll
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<'PLANNING' | 'STANDARD' | 'BASEMAP' | null>('PLANNING');

    // Lọc lớp theo từ khóa tìm kiếm
    const filteredLayers = useMemo(() => {
        const layers = Array.isArray(availableLayers) ? availableLayers : [];
        if (!searchTerm || !searchTerm.trim()) return layers;
        const term = searchTerm.toLowerCase();
        return layers.filter(l => 
            (l.name || '').toLowerCase().includes(term) || 
            (l.layers || '').toLowerCase().includes(term)
        );
    }, [availableLayers, searchTerm]);

    const planningLayers = useMemo(() => 
        filteredLayers.filter(l => l.category === 'PLANNING'),
    [filteredLayers]);

    const standardLayers = useMemo(() => 
        filteredLayers.filter(l => !l.category || l.category === 'STANDARD'),
    [filteredLayers]);

    const renderLayerItem = (l: WMSLayerConfig) => {
        const isVisible = visibleLayerIds.includes(l.id);
        const isActive = activeLayerId === l.id;
        const opacityValue = Number(l.opacity ?? 1);

        return (
            <div 
                key={l.id} 
                className={`group flex flex-col p-2.5 rounded-xl transition-all border mb-1.5 ${
                    isActive 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : isVisible 
                        ? 'bg-white border-slate-200 shadow-sm' 
                        : 'bg-transparent border-transparent hover:bg-slate-100'
                }`}
            >
                <div className="flex items-center justify-between gap-3">
                    <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" 
                        onClick={() => onSetActiveWMS(l.id)}
                    >
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isVisible ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {l.category === 'PLANNING' ? <Landmark size={14}/> : <Layers size={14}/>}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className={`text-[11px] font-bold truncate ${isVisible ? 'text-slate-900' : 'text-slate-600'}`}>
                                {l.name}
                            </span>
                            {isActive && (
                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5 flex items-center gap-1 animate-pulse">
                                    <MousePointerClick size={8}/> Đang tương tác
                                </span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => onToggleWMS(l.id)} 
                        className={`p-2 rounded-lg transition-all ${
                            isVisible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isVisible ? "Tắt lớp" : "Bật lớp"}
                    >
                        {isVisible ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                </div>

                {isVisible && (
                    <div className="mt-3 px-1 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
                        <Sun size={12} className="text-slate-400"/>
                        <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={opacityValue} 
                            onChange={e => onOpacityChange(l.id, parseFloat(e.target.value))} 
                            className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                        <span className="text-[9px] text-slate-500 font-mono font-bold w-6 text-right">{Math.round(opacityValue * 100)}%</span>
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return (
        <button 
            onClick={onToggleMenu} 
            className="absolute top-16 right-4 md:top-4 md:right-4 z-[450] p-3.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-blue-600 hover:text-blue-700 transition-all border border-slate-200 active:scale-95 group"
        >
            <div className="relative">
                <Layers size={22} className="group-hover:rotate-12 transition-transform" />
                {visibleLayerIds.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {visibleLayerIds.length}
                    </span>
                )}
            </div>
        </button>
    );

    return (
        <div className={`absolute z-[500] bg-white/95 backdrop-blur-xl p-0 shadow-2xl border border-slate-200 transition-all duration-300 flex flex-col overflow-hidden
            ${isOpen 
                ? 'bottom-0 left-0 right-0 rounded-t-[2.5rem] md:bottom-auto md:left-auto md:top-4 md:right-4 md:rounded-[2rem] md:w-[360px] max-h-[90vh] md:max-h-[85vh]' 
                : 'pointer-events-none opacity-0 translate-y-10 md:translate-y-0 md:translate-x-10'
            }`}
        >
            {/* SEARCH & HEADER */}
            <div className="p-5 border-b border-slate-100 space-y-4 bg-slate-50/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg border border-blue-200">
                            <SlidersHorizontal size={16} className="text-blue-600"/>
                        </div>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">Lớp dữ liệu GIS</h4>
                    </div>
                    <div className="flex items-center gap-1">
                        {visibleLayerIds.length > 0 && (
                            <button 
                                onClick={onClearAll}
                                className="px-3 py-1.5 text-[9px] font-black text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider"
                            >
                                Tắt tất cả
                            </button>
                        )}
                        <button onClick={onToggleMenu} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18}/>
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14}/>
                    <input 
                        type="text"
                        placeholder="Tìm tên lớp hoặc mã bảng..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={12}/>
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENT SCROLL AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-50/50">
                
                {/* NHÓM 1: BẢN ĐỒ NỀN */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <button 
                        onClick={() => setExpandedGroup(expandedGroup === 'BASEMAP' ? null : 'BASEMAP')}
                        className={`w-full flex items-center justify-between p-3 transition-colors ${expandedGroup === 'BASEMAP' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <MapIcon size={14}/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Nền bản đồ</span>
                        </div>
                        {expandedGroup === 'BASEMAP' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    {expandedGroup === 'BASEMAP' && (
                        <div className="p-3 grid grid-cols-3 gap-2 bg-slate-50 animate-in fade-in zoom-in-95 duration-200 border-t border-slate-100">
                            {(Array.isArray(basemaps) ? basemaps : []).filter(bm => bm.visible).map(bm => {
                                // Chọn ảnh minh họa phù hợp với loại bản đồ
                                let thumbUrl = 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=150&q=80'; // Default Map
                                if (bm.id.toLowerCase().includes('satellite') || bm.id.toLowerCase().includes('hybrid')) {
                                    thumbUrl = 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&w=150&q=80'; // Satellite
                                } else if (bm.id.toLowerCase().includes('topo') || bm.id.toLowerCase().includes('terrain')) {
                                    thumbUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=150&q=80'; // Terrain
                                } else if (bm.id.toLowerCase().includes('dark')) {
                                    thumbUrl = 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=150&q=80'; // Dark
                                }

                                return (
                                    <button 
                                        key={bm.id} 
                                        onClick={() => onBaseLayerChange(bm.id)} 
                                        className={`group relative flex flex-col items-center gap-1.5 transition-all ${activeBasemapId === bm.id ? 'scale-105' : 'hover:scale-102'}`}
                                    >
                                        <div className={`w-full aspect-square rounded-xl border-2 overflow-hidden transition-all ${activeBasemapId === bm.id ? 'border-blue-600 shadow-lg' : 'border-white shadow-sm group-hover:border-slate-300'}`}>
                                            <img 
                                                src={thumbUrl} 
                                                alt={bm.name}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                            {activeBasemapId === bm.id && (
                                                <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                                                    <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                                                        <CheckCircle2 size={10} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-tight ${activeBasemapId === bm.id ? 'text-blue-600' : 'text-slate-500'}`}>
                                            {bm.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* NHÓM 2: QUY HOẠCH */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <button 
                        onClick={() => setExpandedGroup(expandedGroup === 'PLANNING' ? null : 'PLANNING')}
                        className={`w-full flex items-center justify-between p-3 transition-colors ${expandedGroup === 'PLANNING' ? 'bg-purple-50 text-purple-700' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Landmark size={14}/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Lớp Quy hoạch ({planningLayers.length})</span>
                        </div>
                        {expandedGroup === 'PLANNING' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    {expandedGroup === 'PLANNING' && (
                        <div className="p-2 space-y-1 bg-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 border-t border-slate-100">
                            {planningLayers.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic py-6 text-center">Không tìm thấy lớp phù hợp</p>
                            ) : planningLayers.map(l => renderLayerItem(l))}
                        </div>
                    )}
                </div>

                {/* NHÓM 3: CHUYÊN ĐỀ */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <button 
                        onClick={() => setExpandedGroup(expandedGroup === 'STANDARD' ? null : 'STANDARD')}
                        className={`w-full flex items-center justify-between p-3 transition-colors ${expandedGroup === 'STANDARD' ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Layers size={14}/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Lớp Chuyên đề ({standardLayers.length})</span>
                        </div>
                        {expandedGroup === 'STANDARD' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    {expandedGroup === 'STANDARD' && (
                        <div className="p-2 space-y-1 bg-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 border-t border-slate-100">
                            {standardLayers.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic py-6 text-center">Không tìm thấy lớp phù hợp</p>
                            ) : standardLayers.map(l => renderLayerItem(l))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* FOOTER ACTION */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
                <button 
                    onClick={() => {
                        // Tắt toàn bộ lớp WMS nhưng giữ lại bản đồ nền
                        onToggleMenu();
                    }}
                    className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest active:scale-95"
                >
                    Đóng Menu
                </button>
            </div>
        </div>
    );
};

export default LayerControl;
