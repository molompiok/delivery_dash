import React from 'react';
import { User, Layers, Package, Truck } from 'lucide-react';

type MapTab = 'DRIVERS' | 'ZONES' | 'ORDERS' | 'VEHICLES';

interface TabNavigationProps {
    activeTab: MapTab;
    onTabChange: (tab: MapTab) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => (
    <div className="flex border-b border-gray-100">
        <button onClick={() => onTabChange('DRIVERS')} className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'DRIVERS' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600'}`}>
            <User size={18} />
            <span className="text-[10px] font-bold uppercase">Drivers</span>
        </button>
        <button onClick={() => onTabChange('ZONES')} className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'ZONES' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}>
            <Layers size={18} />
            <span className="text-[10px] font-bold uppercase">Zones</span>
        </button>
        <button onClick={() => onTabChange('ORDERS')} className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'ORDERS' ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/30' : 'text-gray-400 hover:text-gray-600'}`}>
            <Package size={18} />
            <span className="text-[10px] font-bold uppercase">Cmds</span>
        </button>
        <button onClick={() => onTabChange('VEHICLES')} className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'VEHICLES' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:text-gray-600'}`}>
            <Truck size={18} />
            <span className="text-[10px] font-bold uppercase">Vehs</span>
        </button>
    </div>
);
