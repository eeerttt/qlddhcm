
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { authService, API_URL } from '../services/mockBackend';
import { User as UserIcon, Camera, Save, Lock, Mail, Building, Shield, RefreshCw, CheckCircle2, AlertTriangle, Key, Loader2 } from 'lucide-react';

interface UserProfileProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [processingImage, setProcessingImage] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user.avatar) {
            if (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) {
                setAvatarPreview(user.avatar);
            } else {
                const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
                const cleanPath = user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`;
                setAvatarPreview(`${baseUrl}${cleanPath}?v=${Date.now()}`);
            }
        } else {
            setAvatarPreview('');
        }
    }, [user.avatar]);

    /**
     * Hàm nén ảnh: Chuyển đổi file nặng thành ảnh JPEG nhẹ (max 400px)
     */
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 400; // Kích thước tối đa cho Avatar

                    // Tính toán tỷ lệ để giảm kích thước
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Xuất ra dạng Blob JPEG chất lượng 0.7 (70%)
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error("Không thể nén ảnh"));
                        }
                    }, 'image/jpeg', 0.7);
                };
                img.onerror = () => reject(new Error("Lỗi nạp ảnh"));
            };
            reader.onerror = () => reject(new Error("Lỗi đọc file"));
        });
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProcessingImage(true);
            setMessage(null);
            try {
                // Thực hiện nén ảnh ngay lập tức
                const compressed = await compressImage(file);
                setSelectedFile(compressed);
                
                // Hiển thị preview từ file đã nén
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatarPreview(reader.result as string);
                };
                reader.readAsDataURL(compressed);
                
                console.log(`[Optimizer] Gốc: ${(file.size/1024).toFixed(1)}KB -> Nén: ${(compressed.size/1024).toFixed(1)}KB`);
            } catch (err) {
                setMessage({ type: 'error', text: 'Không thể xử lý ảnh này' });
            } finally {
                setProcessingImage(false);
            }
        }
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await authService.updateProfile(user.id, name, selectedFile);
            const updatedUser = { ...user, name, avatar: result.avatar || user.avatar };
            onUpdateUser(updatedUser);
            setSelectedFile(null);
            setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Lỗi cập nhật hồ sơ' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin mật khẩu' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
            return;
        }

        setPassLoading(true);
        setMessage(null);
        try {
            await authService.changePassword(user.id, oldPassword, newPassword);
            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Đổi mật khẩu thất bại' });
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="p-8 bg-slate-950 min-h-full flex justify-center animate-in fade-in duration-300">
            <div className="w-full max-w-4xl space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                    <div className="bg-blue-600/20 p-4 rounded-full border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <UserIcon className="text-blue-400 w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Hồ sơ cá nhân</h1>
                        <p className="text-gray-400 text-sm font-medium">Quản lý thông tin tài khoản hệ thống</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-bold text-sm">{message.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl relative overflow-hidden">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                Thông tin chung
                            </h3>
                            
                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                                <div className="relative group mx-auto sm:mx-0">
                                    <div className="w-32 h-32 rounded-full border-4 border-gray-800 overflow-hidden bg-gray-800 shadow-2xl relative">
                                        {processingImage && (
                                            <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center">
                                                <Loader2 className="text-white animate-spin" size={32} />
                                            </div>
                                        )}
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
                                                <UserIcon size={48} />
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={processingImage}
                                        className="absolute bottom-0 right-0 p-2.5 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-500 transition-all border-4 border-gray-900 active:scale-90 disabled:opacity-50"
                                    >
                                        <Camera size={18} />
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider">Họ và Tên</label>
                                        <input 
                                            type="text" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white font-medium focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider flex items-center gap-1"><Mail size={12}/> Email</label>
                                        <div className="w-full bg-gray-800/50 border border-gray-800 rounded-xl p-3 text-gray-400 font-mono text-sm truncate">
                                            {user.email}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider flex items-center gap-1"><Building size={12}/> Chi nhánh</label>
                                            <div className="w-full bg-gray-800/50 border border-gray-800 rounded-xl p-3 text-gray-400 font-bold text-sm">
                                                {user.branchId}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider flex items-center gap-1"><Shield size={12}/> Vai trò</label>
                                            <div className="w-full bg-gray-800/50 border border-gray-800 rounded-xl p-3 flex items-center">
                                                <div className="inline-flex items-center px-3 py-0.5 rounded-lg bg-blue-900/20 border border-blue-800 text-blue-400 text-xs font-black uppercase tracking-widest">
                                                    {user.role}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button 
                                    onClick={handleUpdateProfile} 
                                    disabled={loading || processingImage}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl h-full flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Lock size={18} className="text-orange-500"/>
                                Đổi mật khẩu
                            </h3>
                            
                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider">Mật khẩu hiện tại</label>
                                    <input 
                                        type="password" 
                                        value={oldPassword} 
                                        onChange={(e) => setOldPassword(e.target.value)} 
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:border-orange-500 outline-none transition-all"
                                        placeholder="••••••"
                                    />
                                </div>
                                <hr className="border-gray-800 my-2" />
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider">Mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:border-orange-500 outline-none transition-all"
                                        placeholder="••••••"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider">Xác nhận mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:border-orange-500 outline-none transition-all"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <button 
                                    onClick={handleChangePassword}
                                    disabled={passLoading}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {passLoading ? <RefreshCw className="animate-spin" size={18}/> : <Key size={18}/>}
                                    Cập nhật mật khẩu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
