
import React from 'react';
import { X, Info } from 'lucide-react';
import { WMSLayerConfig } from '../../types';

interface MapLegendProps {
    isOpen: boolean;
    onClose: () => void;
    visibleLayers?: WMSLayerConfig[];
}

const MapLegend: React.FC<MapLegendProps> = ({ isOpen, onClose, visibleLayers = [] }) => {
    const legendItems = [
        { color: '#FF0000', label: 'ONT', desc: 'Đất ở tại nông thôn' },
        { color: '#FF00FF', label: 'ODT', desc: 'Đất ở tại đô thị' },
        { color: '#FFFF00', label: 'LUC', desc: 'Đất chuyên trồng lúa nước' },
        { color: '#00FF00', label: 'CLN', desc: 'Đất trồng cây lâu năm' },
        { color: '#008000', label: 'RSX', desc: 'Đất rừng sản xuất' },
        { color: '#FFA500', label: 'TMD', desc: 'Đất thương mại, dịch vụ' },
        { color: '#808080', label: 'SKC', desc: 'Đất cơ sở sản xuất phi nông nghiệp' },
        { color: '#ADD8E6', label: 'SON', desc: 'Đất sông, ngòi, kênh, rạch' },
        { color: '#A52A2A', label: 'DGT', desc: 'Đất giao thông' },
        { color: '#FFC0CB', label: 'DGD', desc: 'Đất giáo dục và đào tạo' },
    ];

    const visibleLayerItems = visibleLayers.filter(Boolean);

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-24 right-4 z-[450] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 w-64 md:w-72 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Info size={16} className="text-blue-600" />
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Chú giải ký hiệu</h4>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                    <X size={16} />
                </button>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto custom-scrollbar space-y-4">
                {visibleLayerItems.length > 0 && (
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">
                            Lớp đang bật ({visibleLayerItems.length})
                        </p>
                        {visibleLayerItems.map((layer) => (
                            <div key={layer.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-black text-slate-900">{layer.name}</div>
                                <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                                    {layer.category === 'PLANNING' ? 'Quy hoạch' : layer.category === 'ADMINISTRATIVE' ? 'Hành chính' : 'Chuyên đề'}
                                </div>
                                {layer.description && (
                                    <div className="text-[9px] text-slate-500 leading-snug mt-1">{layer.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-3">
                    {legendItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 group">
                            <div 
                                className="w-4 h-4 rounded shadow-sm border border-black/10 shrink-0 group-hover:scale-110 transition-transform" 
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-900">{item.label}</span>
                                <span className="text-[9px] text-slate-500 leading-tight">{item.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Theo Thông tư 27/2018/TT-BTNMT</p>
            </div>
        </div>
    );
};

export default MapLegend;
