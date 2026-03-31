
import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface MapDialogProps {
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    onClose: () => void;
}

const MapDialog: React.FC<MapDialogProps> = ({ isOpen, type, title, message, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 rounded-[2rem] w-full max-w-sm border border-gray-800 shadow-2xl overflow-hidden">
                <div className="p-8 text-center flex flex-col items-center">
                    {type === 'success' && <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={28}/></div>}
                    {type === 'error' && <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={28}/></div>}
                    {type === 'info' && <div className="w-14 h-14 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-4"><Info size={28}/></div>}
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed mb-6">{message}</p>
                    <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">OK</button>
                </div>
            </div>
        </div>
    );
};

export default MapDialog;
