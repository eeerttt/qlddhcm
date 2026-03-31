
import React, { useState, useEffect } from 'react';
import { adminService, PERMISSIONS_LIST } from '../../services/mockBackend';
import { RoleConfig, UserRole } from '../../types';
import { ShieldCheck, Save, Loader2, Info } from 'lucide-react';

const PermissionManager: React.FC = () => {
    const [rolePermissions, setRolePermissions] = useState<RoleConfig[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await adminService.getRolePermissions();
            setRolePermissions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = async (role: UserRole, permissionCode: string, checked: boolean) => {
        const roleConfig = rolePermissions.find(rp => rp.role === role);
        let newPermissions = roleConfig ? [...roleConfig.permissions] : [];

        if (checked) {
            if (!newPermissions.includes(permissionCode)) {
                newPermissions.push(permissionCode);
            }
        } else {
            newPermissions = newPermissions.filter(p => p !== permissionCode);
        }

        try {
            await adminService.saveRolePermissions(role, newPermissions);
            setRolePermissions(prev => {
                const index = prev.findIndex(rp => rp.role === role);
                if (index === -1) return [...prev, { role, permissions: newPermissions }];
                const next = [...prev];
                next[index] = { ...next[index], permissions: newPermissions };
                return next;
            });
        } catch (e: any) {
            alert("Lỗi lưu phân quyền: " + e.message);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex justify-center items-center text-blue-400 gap-3">
                <Loader2 className="animate-spin" />
                <span>Đang tải ma trận phân quyền...</span>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <ShieldCheck className="text-green-500" /> Ma trận Phân quyền & Vai trò
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Cấp quyền truy cập các tính năng cho từng nhóm người dùng.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-4 w-1/3">Chức năng / Module</th>
                                <th className="p-4 text-center">ADMIN</th>
                                <th className="p-4 text-center">EDITOR</th>
                                <th className="p-4 text-center">VIEWER</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {PERMISSIONS_LIST.map(permission => (
                                <tr key={permission.code} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-200">{permission.name}</div>
                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{permission.code}</div>
                                    </td>
                                    {[UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER].map(role => {
                                        const config = rolePermissions.find(rp => rp.role === role);
                                        const hasPermission = config?.permissions.includes(permission.code);
                                        return (
                                            <td key={role} className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700 cursor-pointer"
                                                    checked={!!hasPermission}
                                                    disabled={role === UserRole.ADMIN && permission.code === 'MANAGE_SYSTEM'}
                                                    onChange={e => handlePermissionChange(role, permission.code, e.target.checked)}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-500 italic">
                    <Info size={14} />
                    Lưu ý: Mọi thay đổi sẽ có hiệu lực ngay lập tức sau khi người dùng tải lại trang.
                </div>
            </div>
        </div>
    );
};

export default PermissionManager;
