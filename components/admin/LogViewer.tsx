
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/mockBackend';
import { SystemLog } from '../../types';
import { Activity, RefreshCw } from 'lucide-react';

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { setLogs(await adminService.getLogs()); } finally { setLoading(false); }
    };

    return (
        <div className="p-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <span className="font-semibold text-gray-300 flex items-center gap-2"><Activity size={18} className="text-orange-500"/> Nhật ký Hoạt động</span>
                    <button onClick={loadData} className="text-blue-400 hover:text-white flex items-center gap-1 text-xs">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Làm mới
                    </button>
                </div>
                <div className="max-h-[600px] overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] sticky top-0">
                            <tr><th className="p-4">Thời gian</th><th className="p-4">Người dùng</th><th className="p-4">Hành động</th><th className="p-4">Chi tiết</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-700/30">
                                    <td className="p-4 font-mono text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-4 font-bold text-white text-xs">{log.userName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.action === 'LOGIN' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LogViewer;
