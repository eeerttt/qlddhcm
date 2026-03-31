import React from 'react';
import { Navigation, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EditorModalsProps {
    searchModal: {
        isOpen: boolean;
        setOpen: (val: boolean) => void;
        coords: { x: string, y: string };
        setCoords: (val: { x: string, y: string }) => void;
        onGoTo: () => void;
    };
    manualModal: {
        isOpen: boolean;
        setOpen: (val: boolean) => void;
        text: string;
        setText: (val: string) => void;
        onProcess: (text: string) => void;
    };
    dialog: {
        isOpen: boolean;
        type: 'success' | 'error' | 'info';
        title: string;
        message: string;
        onClose: () => void;
    };
}

const EditorModals: React.FC<EditorModalsProps> = ({ searchModal, manualModal, dialog }) => {
    return (
        <>
            {searchModal.isOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2"><Navigation size={20} className="text-blue-500"/> Di chuyển đến điểm</h3>
                            <button onClick={() => searchModal.setOpen(false)} className="text-gray-500 hover:text-white transition-all"><X size={24}/></button>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">X (VN2000) hoặc Kinh độ</label>
                                <input className="w-full bg-slate-950 border border-gray-700 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-blue-500 transition-all" value={searchModal.coords.x} onChange={e => searchModal.setCoords({...searchModal.coords, x: e.target.value})}/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Y (VN2000) hoặc Vĩ độ</label>
                                <input className="w-full bg-slate-950 border border-gray-700 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-blue-500 transition-all" value={searchModal.coords.y} onChange={e => searchModal.setCoords({...searchModal.coords, y: e.target.value})}/>
                            </div>
                            <button onClick={searchModal.onGoTo} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">DI CHUYỂN NGAY</button>
                        </div>
                    </div>
                </div>
            )}

            {manualModal.isOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Nhập tọa độ thủ công</h3>
                            <button onClick={() => manualModal.setOpen(false)} className="text-gray-500 hover:text-white transition-all"><X size={24}/></button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] text-gray-400 italic">Hỗ trợ dán tọa độ VN-2000 hoặc WGS84 trực tiếp.</p>
                            <textarea value={manualModal.text} onChange={e => manualModal.setText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-6 text-sm font-mono text-blue-400 focus:border-blue-500 outline-none h-64 shadow-inner resize-none" placeholder="597937.797, 1229843.202..." />
                            <button onClick={() => manualModal.onProcess(manualModal.text)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">DỰNG HÌNH</button>
                        </div>
                    </div>
                </div>
            )}
            
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 rounded-[2rem] w-full max-sm border border-gray-800 shadow-2xl overflow-hidden p-8 text-center flex flex-col items-center">
                        {dialog.type === 'success' ? <CheckCircle2 size={40} className="text-emerald-500 mb-4"/> : <AlertTriangle size={40} className="text-red-500 mb-4"/>}
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{dialog.title}</h3>
                        <p className="text-gray-400 text-xs leading-relaxed mb-6">{dialog.message}</p>
                        <button onClick={dialog.onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Đã hiểu</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditorModals;