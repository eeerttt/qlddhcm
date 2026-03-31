
import React from 'react';
import { MousePointer2 } from 'lucide-react';
import { Coordinate } from 'ol/coordinate';

interface MapInfoOverlayProps {
    mouseCoord: Coordinate | null;
    mapZoom: number;
}

const MapInfoOverlay: React.FC<MapInfoOverlayProps> = ({ mouseCoord, mapZoom }) => {
    return (
        <div className="absolute bottom-6 left-6 z-[400] flex flex-col gap-2 pointer-events-none">
            {mouseCoord && (
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-1.5 text-blue-400"><MousePointer2 size={12}/><span className="text-[9px] font-black uppercase tracking-[0.1em]">Tọa độ</span></div>
                    <div className="flex gap-4 font-mono text-[11px] font-bold text-gray-100">
                        <div className="flex items-baseline gap-1"><span className="text-gray-500 text-[9px]">X:</span><span>{mouseCoord[0].toFixed(6)}</span></div>
                        <div className="flex items-baseline gap-1"><span className="text-gray-500 text-[9px]">Y:</span><span>{mouseCoord[1].toFixed(6)}</span></div>
                    </div>
                </div>
            )}
            <div className="w-fit bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-2.5 py-1 rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zoom: <span className="text-white ml-1">{Math.round(mapZoom)}</span></span>
            </div>
        </div>
    );
};

export default MapInfoOverlay;
