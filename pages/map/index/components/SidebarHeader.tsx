import React from 'react';
import { Navigation, Activity } from 'lucide-react';

interface SidebarHeaderProps {
    isFollowing: boolean;
    onToggleFollow: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isFollowing, onToggleFollow }) => (
    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <button
            onClick={onToggleFollow}
            className={`flex flex-col items-center gap-1 group px-3 py-1.5 rounded-xl border transition-all ${isFollowing ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400 hover:border-emerald-200 hover:text-emerald-600'}`}
            title={isFollowing ? "Désactiver le suivi" : "Activer le suivi automatique"}
        >
            <span className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                {isFollowing ? <Activity size={12} className="animate-pulse" /> : <Navigation size={12} />}
                {isFollowing ? 'ON' : 'OFF'}
            </span>
        </button>
        <div className="flex items-center gap-3 flex-row-reverse text-right">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Navigation size={20} />
            </div>
            <div>
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">Suivi Flotte</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Dashboard Map</p>
            </div>
        </div>
    </div>
);
