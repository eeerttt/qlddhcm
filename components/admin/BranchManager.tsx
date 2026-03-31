
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/mockBackend';
import { Branch } from '../../types';
import { Building2, Plus, Edit2, Trash2, X, Save, MapPin, Mail } from 'lucide-react';

const BranchManager: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const data = await adminService.getBranches();
            setBranches(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        try {
            if (editingId) await adminService.updateBranch({ ...formData, id: editingId });
            else await adminService.addBranch(formData);
            setIsModalOpen(false);
            loadData();
        } catch (e: any) {
            alert("Lỗi: " + e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) {
            try {
                await adminService.deleteBranch(id);
                loadData();
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    return (
        <div className="p-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                <div className="p-4 flex justify-between border-b border-gray-700 bg-gray-800/50">
                    <span className="font-semibold text-gray-300 flex items-center gap-2">
                        <Building2 size={18} /> Quản lý Chi nhánh
                    </span>
                    <button 
                        onClick={() => { setEditingId(null); setFormData({}); setIsModalOpen(true); }} 
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm font-medium"
                    >
                        + Thêm Chi nhánh
                    </button>
                </div>
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-4">Mã</th>
                            <th className="p-4">Tên Chi nhánh</th>
                            <th className="p-4">Địa chỉ</th>
                            <th className="p-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {branches.map(b => (
                            <tr key={b.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-mono text-blue-400">{b.code}</td>
                                <td className="p-4 font-medium text-white">{b.name}</td>
                                <td className="p-4 text-gray-400 text-xs">{b.address}</td>
                                <td className="p-4 flex justify-end gap-3">
                                    <button onClick={() => { setEditingId(b.id); setFormData(b); setIsModalOpen(true); }} className="text-blue-400 hover:text-white">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-white">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                            <h3 className="text-xl font-bold text-white">{editingId ? "Sửa chi nhánh" : "Thêm chi nhánh mới"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase">Mã Chi nhánh</label>
                                <input className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white outline-none focus:border-green-500" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: CN_HCM" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase">Tên Chi nhánh</label>
                                <input className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white outline-none focus:border-green-500" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Chi nhánh TP. Hồ Chí Minh" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase">Địa chỉ</label>
                                <textarea className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white outline-none focus:border-green-500 h-20" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Nhập địa chỉ trụ sở..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Hủy</button>
                            <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg flex items-center gap-2">
                                <Save size={18} /> Lưu lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManager;
