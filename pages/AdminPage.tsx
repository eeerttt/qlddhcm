
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminMenu from '../components/AdminMenu';
import ParcelManager from './ParcelManager';
import { adminService } from '../services/mockBackend';

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

    const setActiveTab = (tab: string) => {
        setSearchParams({ tab });
    };

    const checkDB = async () => {
        try {
            const status = await adminService.checkDbConnection();
            setDbStatus(status);
        } catch (e: any) { 
            setDbStatus({ status: 'error', message: e.message }); 
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
                <div className="flex-1 overflow-auto bg-gray-900 relative custom-scrollbar">
                    {renderModule()}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
