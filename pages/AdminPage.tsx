
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminMenu from '../components/AdminMenu';
import ParcelManager from './ParcelManager';
import { adminService } from '../services/mockBackend';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

import UserManager from '../components/admin/UserManager';
import PermissionManager from '../components/admin/PermissionManager';
import BranchManager from '../components/admin/BranchManager';
import LandPrice2026Manager from '../components/admin/LandPriceManager';
import LayerManager from '../components/admin/LayerManager';
import SystemSettingsManager from '../components/admin/SystemSettingsManager';
import LogViewer from '../components/admin/LogViewer';
import MenuManager from '../components/admin/MenuManager';
import NotificationManager from '../components/admin/NotificationManager';

interface AdminPageProps {
    systemName?: string;
    logoUrl?: string;
}

const AdminPage: React.FC<AdminPageProps> = ({ systemName, logoUrl }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'PARCEL_MANAGER';
    
    const [dbStatus, setDbStatus] = useState<any>({ status: 'checking' });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const setActiveTab = (tab: string) => {
        setSearchParams({ tab });
    };

    const checkDB = async () => {
        setIsRefreshing(true);
        try {
            const status = await adminService.checkDbConnection();
            setDbStatus(status);
        } catch (e: any) { 
            setDbStatus({ status: 'error', message: e.message }); 
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        checkDB();
    }, []);

    const renderModule = () => {
        switch (activeTab) {
            case 'PARCEL_MANAGER': return <ParcelManager />;
            case 'MENU_MANAGER': return <MenuManager />;
            case 'USERS': return <UserManager />;
            case 'NOTIFICATIONS': return <NotificationManager />;
            case 'PERMISSIONS': return <PermissionManager />;
            case 'BRANCHES': return <BranchManager />;
            case 'PRICES_2026': return <LandPrice2026Manager />;
            case 'DATA_LAYERS': return <LayerManager dbStatus={dbStatus} />;
            case 'SETTINGS': return <SystemSettingsManager />;
            case 'LOGS': return <LogViewer />;
            default: return <div className="p-8 text-gray-500 italic">Module đang phát triển...</div>;
        }
    };

    return (
        <div className="flex h-full bg-gray-900 text-white overflow-hidden font-sans">
            <AdminMenu 
                activeTab={activeTab} 
                onSelect={setActiveTab} 
                systemName={systemName} 
                logoUrl={logoUrl} 
            />
            
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-900">
                <div className="bg-gray-800 p-3 md:p-4 border-b border-gray-700 flex justify-between items-center shadow-md z-10 pr-14 md:pr-4">
                    <div className="flex flex-col pl-10 md:pl-0">
                        <h2 className="text-sm md:text-xl font-bold text-gray-100 tracking-tight uppercase truncate max-w-[120px] md:max-w-none">
                            {activeTab.replace('_', ' ')}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3">
                        {dbStatus.status === 'connected' ? (
                            <div className="text-green-400 text-[9px] md:text-xs flex items-center gap-1.5 md:gap-2 bg-green-900/20 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-green-800/50">
                                <CheckCircle size={12} className="md:w-[14px] md:h-[14px]"/> 
                                <span className="font-mono hidden sm:inline">{dbStatus.host}</span>
                                <span className="text-gray-500 hidden sm:inline">|</span>
                                <span className="truncate max-w-[60px] md:max-w-none">{dbStatus.dbName}</span>
                            </div>
                        ) : (
                            <div className="text-red-400 text-[10px] md:text-xs flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 bg-red-900/20 px-3 py-1 rounded-full border border-red-800/50">
                                    <AlertCircle size={14} className="animate-pulse"/> Mất kết nối Database
                                </div>
                                {dbStatus.message && (
                                    <span className="text-[9px] text-red-500 italic max-w-[200px] truncate" title={dbStatus.message}>
                                        {dbStatus.message}
                                    </span>
                                )}
                            </div>
                        )}
                        <button 
                            onClick={checkDB} 
                            disabled={isRefreshing}
                            className={`p-2 rounded-full hover:bg-gray-700 transition-colors ${isRefreshing ? 'animate-spin text-blue-400' : 'text-gray-400'}`}
                        >
                            <RefreshCw size={18}/>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-900 relative custom-scrollbar">
                    {renderModule()}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
