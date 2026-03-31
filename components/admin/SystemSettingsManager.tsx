
import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/mockBackend';
import { SystemSetting } from '../../types';
import { Settings, Save, DatabaseBackup, Download, RefreshCw, AlertTriangle, Image as ImageIcon, Trash2, Map as MapIcon, CheckCircle2, X, Info, Table, CheckSquare, Square, Check, Globe, Mail, Activity, Cpu, HardDrive, Clock, FileText } from 'lucide-react';

const SETTING_METADATA: Record<string, { label: string; description: string; type: 'text' | 'number' | 'boolean' | 'image' }> = {
    'system_name': { label: 'Tên hệ thống', description: 'Tên hiển thị chính trên website và tiêu đề trình duyệt', type: 'text' },
    'site_logo': { label: 'Logo Website', description: 'Logo hiển thị trên Sidebar (Ảnh nền trong suốt)', type: 'image' },
    'site_favicon': { label: 'Favicon', description: 'Biểu tượng nhỏ trên tab trình duyệt', type: 'image' },
    'maintenance_mode': { label: 'Chế độ bảo trì', description: 'Chỉ cho phép Admin truy cập hệ thống', type: 'boolean' },
    'allow_registration': { label: 'Cho phép đăng ký', description: 'Bật/Tắt nút đăng ký tài khoản mới ở trang login', type: 'boolean' },
    'seo_title': { label: 'Tiêu đề SEO (Suffix)', description: 'Phần mở rộng tiêu đề trang (VD: Tra cứu quy hoạch 2026)', type: 'text' },
    'seo_description': { label: 'Mô tả Meta SEO', description: 'Mô tả ngắn gọn để Google tìm kiếm và hiển thị', type: 'text' },
    'seo_keywords': { label: 'Từ khóa SEO', description: 'Các từ khóa cách nhau bởi dấu phẩy', type: 'text' },
    'seo_og_image': { label: 'Ảnh chia sẻ MXH', description: 'Ảnh hiển thị khi gửi link qua Zalo, Facebook', type: 'image' },
    'mail_host': { label: 'SMTP Server Host', description: 'Địa chỉ máy chủ (VD: smtp.gmail.com)', type: 'text' },
    'mail_port': { label: 'SMTP Port', description: 'Cổng gửi thư (VD: 465 hoặc 587)', type: 'number' },
    'mail_user': { label: 'Tài khoản Email', description: 'Email dùng để gửi thư hệ thống', type: 'text' },
    'mail_pass': { label: 'Mật khẩu ứng dụng', description: 'Mật khẩu ứng dụng (App Password) của Gmail/Outlook', type: 'text' },
    'mail_from_name': { label: 'Tên người gửi', description: 'Tên hiển thị khi khách nhận được email', type: 'text' },
    'footer_text': { label: 'Thông tin chân trang', description: 'Thông tin bản quyền và liên hệ cuối trang', type: 'text' },
    'map_center_lat': { label: 'Vĩ độ trung tâm (Lat)', description: 'Vĩ độ mặc định khi tải bản đồ', type: 'number' },
    'map_center_lng': { label: 'Kinh độ trung tâm (Lng)', description: 'Kinh độ mặc định khi tải bản đồ', type: 'number' },
    'default_zoom': { label: 'Mức Zoom mặc định', description: 'Mức zoom khi mới mở bản đồ (VD: 12)', type: 'number' },
    'map_max_zoom': { label: 'Mức Zoom tối đa', description: 'Mức zoom lớn nhất cho phép', type: 'number' },
    'map_min_zoom': { label: 'Mức Zoom tối thiểu', description: 'Mức zoom nhỏ nhất cho phép', type: 'number' },
    'pdf_header_text': { label: 'Tiêu đề Header PDF', description: 'Dòng chữ in trên đầu trang PDF', type: 'text' },
    'pdf_footer_text': { label: 'Tiêu đề Footer PDF', description: 'Dòng chữ in dưới cùng trang PDF', type: 'text' }
};

const SystemSettingsManager: React.FC = () => {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [subTab, setSubTab] = useState<'GENERAL' | 'MAP' | 'PDF' | 'SEO' | 'MAIL' | 'STATUS' | 'BACKUP'>('GENERAL');
    const [loading, setLoading] = useState(false);
    const [serverInfo, setServerInfo] = useState<any>(null);

    // Backup States
    const [backupTables, setBackupTables] = useState<{system: string[], spatial: string[]}>({ system: [], spatial: [] });
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    // System Dialog State
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        type: 'alert' | 'success' | 'error';
        title: string;
        message: string;
    }>({ isOpen: false, type: 'alert', title: '', message: '' });

    const showDialog = (type: any, title: string, message: string) => {
        setDialog({ isOpen: true, type, title, message });
    };

    useEffect(() => { loadData(); }, []);

    // Effect for Server Status Polling
    useEffect(() => {
        let timer: any;
        if (subTab === 'STATUS') {
            const fetchInfo = async () => {
                try {
                    const info = await adminService.getServerInfo();
                    setServerInfo(info);
                } catch (e) {}
            };
            fetchInfo();
            timer = setInterval(fetchInfo, 10000); // Refresh mỗi 10s
        }
        return () => clearInterval(timer);
    }, [subTab]);

    useEffect(() => {
        if (subTab === 'BACKUP') {
            loadBackupTables();
        }
    }, [subTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data: SystemSetting[] = await adminService.getSettings();
            setSettings(data);
        } catch (e) { 
            console.error(e); 
        } finally {
            setLoading(false);
        }
    };

    const loadBackupTables = async () => {
        setLoading(true);
        try {
            const tables = await adminService.getBackupTables();
            setBackupTables(tables);
            setSelectedTables([...tables.system, ...tables.spatial]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleTableSelection = (tableName: string) => {
        setSelectedTables(prev => 
            prev.includes(tableName) 
            ? prev.filter(t => t !== tableName) 
            : [...prev, tableName]
        );
    };

    const handleSelectAll = (selectAll: boolean) => {
        if (selectAll) {
            setSelectedTables([...backupTables.system, ...backupTables.spatial]);
        } else {
            setSelectedTables([]);
        }
    };

    const updateSettingValue = (key: string, value: string) => {
        setSettings(prev => {
            const exists = prev.some(s => s.key === key);
            if (exists) {
                return prev.map(s => s.key === key ? { ...s, value } : s);
            } else {
                return [...prev, { key, value, type: SETTING_METADATA[key]?.type || 'text' } as SystemSetting];
            }
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await adminService.saveSettings(settings);
            showDialog('success', 'Đã lưu', "Hệ thống đã ghi nhận các thay đổi cấu hình mới.");
        } catch (e: any) {
            showDialog('error', 'Lỗi lưu trữ', e.message);
        } finally { setLoading(false); }
    };

    const handleStartBackup = async () => {
        if (selectedTables.length === 0) {
            showDialog('error', 'Lỗi', 'Vui lòng chọn ít nhất một bảng để sao lưu.');
            return;
        }
        setLoading(true);
        try {
            await adminService.createBackup(selectedTables);
            showDialog('success', 'Thành công', 'File SQL đã được tạo và đang tải xuống.');
        } catch (e: any) {
            showDialog('error', 'Lỗi Backup', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showDialog('error', 'File quá lớn', "Vui lòng chọn ảnh dưới 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            updateSettingValue(key, base64);
        };
        reader.readAsDataURL(file);
    };

    const renderSettingInput = (key: string) => {
        const setting = settings.find(s => s.key === key) || { key, value: '', type: SETTING_METADATA[key]?.type || 'text' };
        const metadata = SETTING_METADATA[key];

        if (metadata?.type === 'image') {
            const isFavicon = key === 'site_favicon';
            return (
                <div className="space-y-3">
                    {setting.value && (
                        <div className={`relative ${isFavicon ? 'w-16 h-16' : 'w-32 h-32'} bg-gray-900 rounded border border-gray-700 overflow-hidden group`}>
                            <img src={setting.value} alt={key} className="w-full h-full object-contain p-1" />
                            <button 
                                onClick={() => updateSettingValue(key, '')}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="text-red-400" size={isFavicon ? 14 : 20} />
                            </button>
                        </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer w-fit text-sm transition-colors border border-gray-600">
                        <ImageIcon size={16} />
                        <span>{setting.value ? "Thay đổi" : "Tải lên"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(key, e)} />
                    </label>
                </div>
            );
        }

        if (metadata?.type === 'boolean') {
            const isTrue = setting.value === 'true';
            return (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => updateSettingValue(key, isTrue ? 'false' : 'true')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTrue ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTrue ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">{isTrue ? "ĐANG BẬT" : "ĐANG TẮT"}</span>
                </div>
            );
        }

        return (
            <input 
                className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white focus:border-blue-500 outline-none font-medium" 
                value={setting.value || ''} 
                type={metadata?.type === 'number' ? 'number' : (key.includes('pass') ? 'password' : 'text')}
                step={metadata?.type === 'number' ? 'any' : undefined}
                onChange={e => updateSettingValue(key, e.target.value)}
            />
        );
    };

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        return `${d} ngày, ${h} giờ, ${m} phút`;
    };

    const isAllSelected = selectedTables.length === (backupTables.system.length + backupTables.spatial.length);

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 text-white relative">
            <div className="flex gap-2 border-b border-gray-700 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                <button onClick={() => setSubTab('GENERAL')} className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${subTab === 'GENERAL' ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent'}`}><Settings size={16}/> Web & Bảo mật</button>
                <button onClick={() => setSubTab('MAP')} className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${subTab === 'MAP' ? 'text-cyan-400 border-cyan-400' : 'text-gray-500 border-transparent'}`}><MapIcon size={16}/> Bản đồ</button>
                <button onClick={() => setSubTab('PDF')} className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${subTab === 'PDF' ? 'text-orange-400 border-orange-400' : 'text-gray-500 border-transparent'}`}><FileText size={16}/> Xuất PDF</button>
                <button onClick={() => setSubTab('SEO')} className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${subTab === 'SEO' ? 'text-indigo-400 border-indigo-400' : 'text-gray-500 border-transparent'}`}><Globe size={16}/> SEO</button>
                <button onClick={() => setSubTab('MAIL')} className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${subTab === 'MAIL' ? 'text-rose-400 border-rose-400' : 'text-gray-500 border-transparent'}`}><Mail size={16}/> Mail Server</button>
                <button onClick={() => setSubTab('STATUS')} className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${subTab === 'STATUS' ? 'text-emerald-400 border-emerald-400' : 'text-gray-500 border-transparent'}`}><Activity size={16}/> Máy chủ</button>
                <button onClick={() => setSubTab('BACKUP')} className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${subTab === 'BACKUP' ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent'}`}><DatabaseBackup size={16}/> Sao lưu SQL</button>
            </div>

            <div className="bg-gray-800 rounded-xl md:rounded-lg p-4 md:p-6 border border-gray-700 shadow-xl min-h-[300px] md:min-h-[450px]">
                {subTab === 'GENERAL' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {['system_name', 'site_logo', 'site_favicon', 'maintenance_mode', 'allow_registration', 'footer_text'].map(key => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700/50 pb-6 last:border-0 last:pb-0">
                                <div className="col-span-1">
                                    <label className="text-sm font-bold text-gray-200 block mb-1">{SETTING_METADATA[key]?.label || key}</label>
                                    <span className="text-xs text-gray-500 italic">{SETTING_METADATA[key]?.description}</span>
                                </div>
                                <div className="col-span-2">{renderSettingInput(key)}</div>
                            </div>
                        ))}
                    </div>
                )}

                {subTab === 'MAP' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {['map_center_lat', 'map_center_lng', 'default_zoom', 'map_max_zoom', 'map_min_zoom'].map(key => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700/50 pb-6 last:border-0 last:pb-0">
                                <div className="col-span-1">
                                    <label className="text-sm font-bold text-gray-200 block mb-1">{SETTING_METADATA[key]?.label || key}</label>
                                    <span className="text-[10px] text-gray-500 font-mono italic">{SETTING_METADATA[key]?.description}</span>
                                </div>
                                <div className="col-span-2">{renderSettingInput(key)}</div>
                            </div>
                        ))}
                    </div>
                )}

                {subTab === 'PDF' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {['pdf_header_text', 'pdf_footer_text'].map(key => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700/50 pb-6 last:border-0 last:pb-0">
                                <div className="col-span-1">
                                    <label className="text-sm font-bold text-gray-200 block mb-1">{SETTING_METADATA[key]?.label || key}</label>
                                    <span className="text-xs text-gray-500 italic">{SETTING_METADATA[key]?.description}</span>
                                </div>
                                <div className="col-span-2">{renderSettingInput(key)}</div>
                            </div>
                        ))}
                    </div>
                )}

                {subTab === 'STATUS' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {!serverInfo ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                                <RefreshCw className="animate-spin" size={40} />
                                <p className="text-xs font-bold uppercase tracking-widest">Đang kết nối máy chủ API...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-950/40 p-6 rounded-3xl border border-gray-700 space-y-4 shadow-inner">
                                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                        <Cpu size={24}/>
                                        <h4 className="font-black uppercase tracking-tight">Tài nguyên Hệ thống</h4>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-gray-400">Hệ điều hành:</span>
                                                <span className="text-white uppercase">{serverInfo.osType}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-gray-400">Bộ nhớ (Free RAM):</span>
                                                <span className="text-emerald-400 font-mono">{(serverInfo.freeMem / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 animate-pulse" style={{ width: `${Math.min(100, (serverInfo.freeMem / serverInfo.totalMem) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-gray-400">Thời gian hoạt động:</span>
                                                <span className="text-white"><Clock className="inline mr-1" size={12}/> {formatUptime(serverInfo.uptime)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-950/40 p-6 rounded-3xl border border-gray-700 space-y-4 shadow-inner">
                                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                                        <HardDrive size={24}/>
                                        <h4 className="font-black uppercase tracking-tight">Cơ sở dữ liệu</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-emerald-900/10 border border-emerald-800/30 rounded-2xl flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Trạng thái kết nối</p>
                                                <p className="text-sm font-bold text-emerald-400">ĐÃ KẾT NỐI (PostgreSQL)</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Dung lượng DB</p>
                                                <p className="text-xs font-mono text-white">Xấp xỉ 240 MB</p>
                                            </div>
                                            <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Phiên bản API</p>
                                                <p className="text-xs font-mono text-white">v2.5.0-PRO</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 flex items-start gap-3">
                                            <Info className="text-blue-500 shrink-0" size={16}/>
                                            <p className="text-[10px] text-gray-500 leading-relaxed italic">Hệ thống đang hoạt động ổn định. Các bản sao lưu SQL hàng ngày được lưu trữ tự động trên Cloud Storage.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {subTab === 'SEO' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-4 bg-indigo-900/10 border border-indigo-800/30 rounded flex gap-3 items-center mb-4">
                            <Globe className="text-indigo-400" size={24}/>
                            <p className="text-xs text-indigo-300 italic">Cấu hình cách Google và Facebook hiển thị thông tin trang web của bạn.</p>
                        </div>
                        {['seo_title', 'seo_description', 'seo_keywords', 'seo_og_image'].map(key => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700/50 pb-6 last:border-0 last:pb-0">
                                <div className="col-span-1">
                                    <label className="text-sm font-bold text-gray-200 block mb-1">{SETTING_METADATA[key]?.label || key}</label>
                                    <span className="text-xs text-gray-500 italic">{SETTING_METADATA[key]?.description}</span>
                                </div>
                                <div className="col-span-2">{renderSettingInput(key)}</div>
                            </div>
                        ))}
                    </div>
                )}

                {subTab === 'MAIL' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-4 bg-rose-900/10 border border-rose-800/30 rounded flex gap-3 items-center mb-4">
                            <Mail className="text-rose-400" size={24}/>
                            <p className="text-xs text-rose-300 italic">Cấu hình máy chủ gửi thư SMTP (Gmail, Outlook, Private Mail...) để gửi mã OTP.</p>
                        </div>
                        {['mail_host', 'mail_port', 'mail_user', 'mail_pass', 'mail_from_name'].map(key => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700/50 pb-6 last:border-0 last:pb-0">
                                <div className="col-span-1">
                                    <label className="text-sm font-bold text-gray-200 block mb-1">{SETTING_METADATA[key]?.label || key}</label>
                                    <span className="text-xs text-gray-500 italic">{SETTING_METADATA[key]?.description}</span>
                                </div>
                                <div className="col-span-2">{renderSettingInput(key)}</div>
                            </div>
                        ))}
                    </div>
                )}

                {subTab === 'BACKUP' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-gray-950/40 rounded-2xl border border-gray-700 p-6 space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                                <div className="flex items-center gap-3">
                                    <DatabaseBackup className="text-green-500" size={24} />
                                    <div>
                                        <h4 className="font-bold text-lg uppercase tracking-tight">Sao lưu SQL</h4>
                                        <p className="text-xs text-gray-500">Chọn các bảng cần kết xuất dữ liệu</p>
                                    </div>
                                </div>
                                <button onClick={() => handleSelectAll(!isAllSelected)} className="text-xs font-black uppercase text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                    {isAllSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                                    {isAllSelected ? "Bỏ chọn" : "Chọn tất cả"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Settings size={12}/> Hệ thống ({backupTables.system.length})</h5>
                                    <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {backupTables.system.map(table => (
                                            <div key={table} onClick={() => toggleTableSelection(table)} className="flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-800 rounded-xl cursor-pointer border border-gray-800 transition-all group">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedTables.includes(table) ? 'bg-green-600 border-green-600' : 'border-gray-600'}`}>
                                                    {selectedTables.includes(table) && <Check size={14}/>}
                                                </div>
                                                <span className="text-xs font-mono text-gray-300 group-hover:text-white">{table}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Table size={12}/> Bản đồ ({backupTables.spatial.length})</h5>
                                    <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {backupTables.spatial.map(table => (
                                            <div key={table} onClick={() => toggleTableSelection(table)} className="flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-800 rounded-xl cursor-pointer border border-gray-800 transition-all group">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedTables.includes(table) ? 'bg-blue-600 border-blue-600' : 'border-gray-600'}`}>
                                                    {selectedTables.includes(table) && <Check size={14}/>}
                                                </div>
                                                <span className="text-xs font-mono text-gray-300 group-hover:text-white">{table}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-700 flex justify-between items-center">
                                <div className="text-xs text-gray-500">Đã chọn: <span className="text-white">{selectedTables.length}</span> bảng</div>
                                <button onClick={handleStartBackup} disabled={loading || selectedTables.length === 0} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-30 transition-all">
                                    {loading ? <RefreshCw className="animate-spin" size={16}/> : <Download size={16}/>} SAO LƯU SQL
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex flex-col md:flex-row justify-end gap-3 pt-6 border-t border-gray-700">
                    <button onClick={loadData} className="px-4 py-2 text-gray-400 hover:text-white font-bold uppercase text-[10px] tracking-widest order-2 md:order-1">Làm mới</button>
                    {subTab !== 'BACKUP' && subTab !== 'STATUS' && (
                        <button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 md:py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 order-1 md:order-2">
                            {loading ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>} Lưu cấu hình
                        </button>
                    )}
                </div>
            </div>

            {dialog.isOpen && (
                <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 rounded-[2rem] w-full max-w-sm border border-gray-800 shadow-2xl overflow-hidden p-8 text-center flex flex-col items-center">
                        {dialog.type === 'success' && <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={28}/></div>}
                        {dialog.type === 'error' && <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={28}/></div>}
                        {dialog.type === 'alert' && <div className="w-14 h-14 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-4"><Info size={28}/></div>}
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{dialog.title}</h3>
                        <p className="text-gray-400 text-xs leading-relaxed mb-6">{dialog.message}</p>
                        <button onClick={() => setDialog({ ...dialog, isOpen: false })} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95">OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettingsManager;
