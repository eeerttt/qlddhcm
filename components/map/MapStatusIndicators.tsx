
import React from 'react';
import { Loader2, Printer, Zap } from 'lucide-react';

interface MapStatusIndicatorsProps {
    isInitialLoading: boolean;
    isQuerying: boolean;
    isPrinting: boolean;
}

const MapStatusIndicators: React.FC<MapStatusIndicatorsProps> = ({ isInitialLoading, isQuerying, isPrinting }) => {
    return (
        <>
            {isInitialLoading && (
                <div className="absolute inset-0 z-[1000] bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="font-display uppercase tracking-[0.3em] text-[10px] text-blue-400 font-black animate-pulse">GeoMaster Engine Loading...</p>
                </div>
            )}

            {isQuerying && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/90 backdrop-blur-md border border-blue-500/30 px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Loader2 className="animate-spin text-blue-500" size={20} />
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">Đang lấy thông tin thửa đất...</span>
                </div>
            )}

            {isPrinting && (
                <div className="absolute inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-white gap-6 animate-in fade-in duration-500">
                    <div className="relative">
                        <Printer className="animate-bounce text-blue-500" size={64} />
                        <div className="absolute -top-2 -right-2">
                            <Zap className="text-yellow-400 animate-pulse" size={24}/>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="font-display font-black text-2xl uppercase tracking-tighter">Đang kết xuất trích lục</p>
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Vui lòng không đóng trình duyệt...</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default MapStatusIndicators;
