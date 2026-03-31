
import React from 'react';
import { Edit, Trash2, Eye, FileDown, Search, AlertTriangle } from 'lucide-react';
import { ParcelDTO } from '../../../services/parcelApi';

interface ParcelListProps {
    parcels: ParcelDTO[];
    hasSearched: boolean;
    error: string | null;
    loading: boolean;
    onQuickView: (p: any) => void;
    onDownload: (p: any) => void;
    onEdit: (p: any) => void;
    onDelete: (gid: number) => void;
    getFieldValue: (obj: any, aliases: string[]) => any;
}

const ParcelList: React.FC<ParcelListProps> = ({ 
    parcels, hasSearched, error, loading, onQuickView, onDownload, onEdit, onDelete, getFieldValue 
}) => {
    const getLandType = (p: any) => getFieldValue(p, ['loaidat', 'kyhieumucd', 'mucdich']) || 'N/A';
    const getOwner = (p: any) => getFieldValue(p, ['tenchu', 'owner', 'chusudung']) || '--';
    const getAreaVal = (p: any) => parseFloat(getFieldValue(p, ['dientich', 'dien_tich', 'area']) || 0);
    const getAddressVal = (p: any) => getFieldValue(p, ['diachi', 'address']) || '--';
    const getSheetNo = (p: any) => getFieldValue(p, ['sodoto', 'so_to', 'shbando']) || '--';
    const getParcelNo = (p: any) => getFieldValue(p, ['sothua', 'so_thua', 'shthua']) || '--';

    if (error) return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-red-400 gap-4">
            <AlertTriangle size={64} className="opacity-20" />
            <div className="text-center">
                <p className="text-sm font-black uppercase tracking-widest mb-1">{error}</p>
                <p className="text-xs text-gray-500">Vui lòng kiểm tra lại kết nối Backend hoặc cấu hình Database.</p>
            </div>
        </div>
    );

    if (!hasSearched) return (
        <div className="flex flex-col items-center justify-center h-full py-40 text-gray-700">
            <Search size={80} className="opacity-10 mb-4" />
            <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-30">Chế độ chờ tìm kiếm</p>
        </div>
    );

    return (
        <div className="overflow-auto flex-1 custom-scrollbar animate-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-950 text-gray-500 uppercase text-[10px] sticky top-0 z-10 font-black tracking-widest border-b border-gray-800">
                    <tr>
                        <th className="p-4">Tờ/Thửa</th>
                        <th className="p-4">Chủ sử dụng</th>
                        <th className="p-4">Loại đất</th>
                        <th className="p-4 text-right">Diện tích (m²)</th>
                        <th className="p-4">Địa chỉ</th>
                        <th className="p-4 text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                    {parcels.length === 0 ? (
                        <tr><td colSpan={6} className="p-20 text-center text-gray-500 italic">Không tìm thấy dữ liệu phù hợp</td></tr>
                    ) : parcels.map(p => (
                        <tr key={p.gid} className="hover:bg-blue-600/5 transition-colors group">
                            <td className="p-4">
                                <div className="flex flex-col">
                                    <span className="font-black text-blue-400 text-sm">{getSheetNo(p)}/{getParcelNo(p)}</span>
                                    <span className="text-[9px] text-gray-600 font-mono">GID: {p.gid}</span>
                                </div>
                            </td>
                            <td className="p-4 font-bold text-gray-200">{getOwner(p)}</td>
                            <td className="p-4">
                                <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-1 rounded-lg font-black border border-gray-700 uppercase">
                                    {getLandType(p)}
                                </span>
                            </td>
                            <td className="p-4 text-right font-mono text-emerald-500 font-black">
                                {getAreaVal(p) ? Math.round(getAreaVal(p)).toLocaleString() : '--'}
                            </td>
                            <td className="p-4 text-xs text-gray-500 max-w-xs truncate">{getAddressVal(p)}</td>
                            <td className="p-4">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => onQuickView(p)} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all" title="Xem sơ đồ"><Eye size={16}/></button>
                                    <button onClick={() => onDownload(p)} className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all" title="Tải GeoJSON"><FileDown size={16}/></button>
                                    <button onClick={() => onEdit(p)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><Edit size={16}/></button>
                                    <button onClick={() => onDelete(p.gid!)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ParcelList;
