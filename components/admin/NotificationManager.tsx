
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/mockBackend';
import { SystemNotification, UserRole } from '../../types';
import { Bell, Send, Trash2, Plus, X, Loader2, AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

const NotificationManager: React.FC = () => {
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', type: 'INFO', targetRole: 'ALL' });

    // System Dialog State
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm' | 'success' | 'error' | 'warning';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ isOpen: false, type: 'alert', title: '', message: '' });

    const showDialog = (type: any, title: string, message: string, onConfirm?: () => void) => {
        setDialog({ isOpen: true, type, title, message, onConfirm });
    };

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (e) {
            console.error("Load notifications failed", e);
        } finally { setLoading(false); }
    };

    const handleSend = async () => {
        if (!formData.title || !formData.content) {
            showDialog('warning', 'Thiếu dữ liệu', 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.');
            return;
        }
        setLoading(true);
        try {
            await notificationService.sendNotification(formData);
            setIsModalOpen(false);
            setFormData({ title: '', content: '', type: 'INFO', targetRole: 'ALL' });
            await loadData();
            showDialog('success', 'Thành công', 'Thông báo đã được phát đi cho đối tượng mục tiêu.');
        } catch (e: any) {
            showDialog('error', 'Lỗi gửi tin', e.message);
        } finally { setLoading(false); }
    };

    const handleDelete = (id: number) => {
        showDialog('confirm', 'Xác nhận xóa', 'Bạn có chắc chắn muốn xóa vĩnh viễn thông báo này khỏi hệ thống không?', async () => {
            setLoading(true);
            try {
                await notificationService.deleteNotification(id);
                await loadData();
                showDialog('success', 'Đã xóa', 'Xóa thông báo thành công.');
            } catch (e: any) {
                showDialog('error', 'Lỗi xóa', e.message || 'Không thể xóa thông báo vào lúc này.');
            } finally {
                setLoading(false);
            }
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                        <Bell className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Quản lý Thông báo Hệ thống</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gửi tin nhắn công khai đến người dùng</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
                    <Plus size={18}/> SOẠN THÔNG BÁO MỚI
                </button>
            </div>

            <div className="bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-700">
                        <tr>
                            <th className="p-5">Loại</th>
                            <th className="p-5">Tiêu đề</th>
                            <th className="p-5">Đối tượng</th>
                            <th className="p-5">Ngày gửi</th>
                            <th className="p-5 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 text-gray-300">
                        {loading && notifications.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" size={32}/> Đang tải...</td></tr>
                        ) : notifications.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-gray-500 italic">Chưa có thông báo nào được phát đi.</td></tr>
                        ) : notifications.map(n => (
                            <tr key={n.id} className="hover:bg-gray-700/50 transition-colors group">
                                <td className="p-5">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                                        n.type === 'DANGER' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                        n.type === 'WARNING' ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
                                        n.type === 'SUCCESS' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                                        'bg-blue-900/30 text-blue-400 border-blue-800'
                                    }`}>
                                        {n.type}
                                    </span>
                                </td>
                                <td className="p-5 font-bold text-white max-w-xs truncate">{n.title}</td>
                                <td className="p-5"><span className="text-gray-500 font-mono text-[10px]">{n.target_role}</span></td>
                                <td className="p-5 text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</td>
                                <td className="p-5 text-right">
                                    <button 
                                        onClick={() => handleDelete(n.id)} 
                                        disabled={loading}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-30"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL SOẠN TIN */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2"><Send size={20} className="text-blue-500"/> Soạn thông báo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-all"><X size={24}/></button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Loại thông báo</label>
                                    <select className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                        <option value="INFO">Thông tin (Blue)</option>
                                        <option value="WARNING">Cảnh báo (Orange)</option>
                                        <option value="DANGER">Quan trọng (Red)</option>
                                        <option value="SUCCESS">Thành công (Green)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Đối tượng nhận</label>
                                    <select className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" value={formData.targetRole} onChange={e => setFormData({...formData, targetRole: e.target.value})}>
                                        <option value="ALL">Tất cả người dùng</option>
                                        <option value="ADMIN">Chỉ Quản trị viên</option>
                                        <option value="EDITOR">Chỉ Biên tập viên</option>
                                        <option value="VIEWER">Chỉ Người xem</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Tiêu đề ngắn *</label>
                                <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500" placeholder="vd: Bảo trì hệ thống tối nay..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Nội dung chi tiết *</label>
                                <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 h-32 resize-none" placeholder="Nhập nội dung thông báo..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                            </div>

                            <button onClick={handleSend} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/30 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" size={20}/> : <><Send size={18}/> PHÁT THÔNG BÁO NGAY</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SYSTEM DIALOG --- */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-sm border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 text-center flex flex-col items-center">
                            {dialog.type === 'success' && <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={28}/></div>}
                            {dialog.type === 'error' && <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={28}/></div>}
                            {dialog.type === 'confirm' && <div className="w-14 h-14 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mb-4"><Info size={28}/></div>}
                            {dialog.type === 'warning' && <div className="w-14 h-14 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={28}/></div>}
                            {dialog.type === 'alert' && <div className="w-14 h-14 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-4"><Info size={28}/></div>}
                            
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{dialog.title}</h3>
                            <p className="text-gray-400 text-xs leading-relaxed mb-6">{dialog.message}</p>
                            
                            <div className="flex gap-2 w-full">
                                {dialog.type === 'confirm' ? (
                                    <>
                                        <button onClick={() => setDialog({ ...dialog, isOpen: false })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">HỦY BỎ</button>
                                        <button onClick={() => { setDialog({ ...dialog, isOpen: false }); dialog.onConfirm?.(); }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all">XÁC NHẬN</button>
                                    </>
                                ) : (
                                    <button onClick={() => setDialog({ ...dialog, isOpen: false })} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all">OK</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationManager;
