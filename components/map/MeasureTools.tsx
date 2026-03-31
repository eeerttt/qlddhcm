
import React from 'react';
import { Ruler, Square, Trash2 } from 'lucide-react';

interface MeasureToolsProps {
    activeMode: 'LineString' | 'Polygon' | null;
    onModeChange: (mode: 'LineString' | 'Polygon' | null) => void;
    onClear: () => void;
}

const MeasureTools: React.FC<MeasureToolsProps> = ({ activeMode, onModeChange, onClear }) => {
    return (
        <div className="absolute top-16 md:top-4 left-1/2 -translate-x-1/2 z-[400] bg-white rounded-full shadow-2xl border border-gray-100 flex items-center px-1 md:px-2 py-1 gap-1 animate-in fade-in slide-in-from-top-4 duration-500">
            <button
                onClick={() => onModeChange(activeMode === "LineString" ? null : "LineString")}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300 ${
                    activeMode === "LineString" 
                    ? "bg-blue-600 text-white scale-105 shadow-md" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Đo khoảng cách"
            >
                <Ruler size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-tighter">Đo mét</span>
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-0.5 md:mx-1" />
            
            <button
                onClick={() => onModeChange(activeMode === "Polygon" ? null : "Polygon")}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300 ${
                    activeMode === "Polygon" 
                    ? "bg-blue-600 text-white scale-105 shadow-md" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Đo diện tích"
            >
                <Square size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-tighter">Diện tích</span>
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-0.5 md:mx-1" />
            
            <button
                onClick={onClear}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Xóa kết quả đo"
            >
                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
        </div>
    );
};

export default MeasureTools;
