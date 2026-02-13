import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Activity, Trash2, Plus, X, Users, Check } from 'lucide-react';
import { Zone, Driver } from '../../../../api/mock';

interface ZoneDetailProps {
    zone: Zone;
    allDrivers: Driver[];
    onBack: () => void;
    onEdit: (data: Partial<Zone>) => void;
    onDelete: () => void;
    onToggleAssignment: (driverId: string) => void;
    assignMode: boolean;
    setAssignMode: (val: boolean) => void;
    showColorPicker: boolean;
    setShowColorPicker: (val: boolean) => void;
    existingSectors: string[];
}

export const ZoneDetail: React.FC<ZoneDetailProps> = ({
    zone,
    allDrivers,
    onBack,
    onEdit,
    onDelete,
    onToggleAssignment,
    assignMode,
    setAssignMode,
    showColorPicker,
    setShowColorPicker,
    existingSectors
}) => {
    if (!zone) return null;

    const [isGroupFocused, setIsGroupFocused] = React.useState(false);
    const [groupSearch, setGroupSearch] = React.useState('');
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [editedName, setEditedName] = React.useState(zone.name);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const nameInputRef = React.useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    React.useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    // Update edited name when zone changes
    React.useEffect(() => {
        setEditedName(zone.name);
    }, [zone.name]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsGroupFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allSectors = Array.from(new Set([...existingSectors, 'ABIDJAN', 'YAMOUSSOUKRO', 'INTERIEUR']));
    const filteredSectors = allSectors.filter(s =>
        s.toLowerCase().includes(groupSearch.toLowerCase())
    );

    const assignedDrivers = (zone.assignedDriverIds || [])
        .map(id => allDrivers.find(d => d.id === id))
        .filter(Boolean) as Driver[];

    const extendedColors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4',
        '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
        '#f43f5e', '#64748b', '#78716c', '#000000'
    ];

    return (
        <motion.div
            key="zone-detail"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            {!assignMode ? (
                <div className="space-y-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 mb-2 font-medium text-xs uppercase tracking-wide group"
                    >
                        <div className="p-1 bg-gray-100 dark:bg-slate-800 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors">
                            <ChevronLeft size={14} />
                        </div>
                        Retour à la liste
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                {isEditingName ? (
                                    <input
                                        ref={nameInputRef}
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onBlur={() => {
                                            if (editedName.trim() && editedName !== zone.name) {
                                                onEdit({ name: editedName.trim() });
                                            }
                                            setIsEditingName(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (editedName.trim() && editedName !== zone.name) {
                                                    onEdit({ name: editedName.trim() });
                                                }
                                                setIsEditingName(false);
                                            } else if (e.key === 'Escape') {
                                                setEditedName(zone.name);
                                                setIsEditingName(false);
                                            }
                                        }}
                                        className="text-2xl font-black text-gray-900 leading-none bg-transparent border-b-2 border-emerald-500 outline-none px-1 -ml-1"
                                    />
                                ) : (
                                    <h1
                                        onClick={() => setIsEditingName(true)}
                                        className="text-2xl font-black text-gray-900 leading-none cursor-pointer hover:text-emerald-600 transition-colors"
                                        title="Cliquer pour modifier"
                                    >
                                        {zone.name}
                                    </h1>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => onEdit({ isActive: !zone.isActive })}
                                        className={`p-1.5 rounded-lg transition-all ${zone.isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 opacity-50'}`}
                                        title={zone.isActive ? 'Désactiver' : 'Activer'}
                                    >
                                        <Activity size={16} strokeWidth={3} />
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Supprimer la zone"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }}></div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{zone.sector || 'Non classé'}</span>
                                </div>
                                <button
                                    onClick={() => onEdit({ isActive: !zone.isActive })}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${zone.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border border-emerald-200 dark:border-emerald-500/40' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'}`}
                                >
                                    {zone.isActive ? 'Actif' : 'Inactif'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 relative group/picker">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Couleur</label>
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {['#10b981', '#3b82f6', '#f59e0b', '#ef4444'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => onEdit({ color: c })}
                                        className={`w-5 h-5 rounded-full border-2 ${zone.color === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-110'} transition-all`}
                                        style={{ backgroundColor: c }}
                                    ></button>
                                ))}
                            </div>

                            {showColorPicker && (
                                <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-48 grid grid-cols-4 gap-2 animate-in fade-in zoom-in duration-200">
                                    {extendedColors.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                onEdit({ color: c });
                                                setShowColorPicker(false);
                                            }}
                                            className={`w-6 h-6 rounded-full border-2 ${zone.color === c ? 'border-gray-900 scale-110' : 'border-gray-100 hover:scale-110'} transition-all`}
                                            style={{ backgroundColor: c }}
                                        ></button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div ref={containerRef} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between relative">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">Groupe</label>
                            <div className="relative">
                                <input
                                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-slate-100"
                                    value={isGroupFocused ? groupSearch : (zone.sector || '')}
                                    placeholder="Nouveau groupe..."
                                    onFocus={() => {
                                        setIsGroupFocused(true);
                                        setGroupSearch(''); // Show full list on focus
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setGroupSearch(val);
                                        onEdit({ sector: val });
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setIsGroupFocused(false);
                                            (e.target as HTMLInputElement).blur();
                                        }
                                    }}
                                />

                                <AnimatePresence>
                                    {isGroupFocused && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden flex flex-col"
                                            style={{ maxHeight: '220px' }}
                                        >

                                            <div className="overflow-y-auto content-scrollbar py-1">
                                                {filteredSectors.length > 0 ? (
                                                    filteredSectors.map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => {
                                                                onEdit({ sector: s });
                                                                setIsGroupFocused(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between group/item"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${zone.sector === s ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                                {s}
                                                            </div>
                                                            {zone.sector === s && <Check size={12} className="text-emerald-500" strokeWidth={3} />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-6 text-center">
                                                        <div className="text-[10px] text-gray-400 mb-1">Aucune correspondance</div>
                                                        <p className="text-[9px] font-bold text-emerald-600 uppercase italic">Appuyez sur Entrée pour créer "{groupSearch}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>


                            </div>
                        </div>
                    </div>

                    {/* Assigned Drivers */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Chauffeurs ({assignedDrivers.length})</h3>
                            <button
                                onClick={() => setAssignMode(true)}
                                className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                            >
                                <Plus size={12} /> Assigner
                            </button>
                        </div>

                        <div className="space-y-2">
                            {assignedDrivers.length > 0 ? (
                                assignedDrivers.map(d => (
                                    <div key={d.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-500 dark:text-slate-400 text-xs">
                                                {d.photo ? <img src={d.photo} alt="" className="w-full h-full rounded-full object-cover" /> : `${d.firstName[0]}${d.lastName[0]}`}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{d.firstName} {d.lastName}</p>
                                                <p className="text-[10px] text-gray-400">ID: {d.id}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onToggleAssignment(d.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Retirer le chauffeur"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                    <Users size={24} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-xs text-gray-400">Aucun chauffeur assigné</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => setAssignMode(false)}
                            className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase">Assigner des chauffeurs</h2>
                            <p className="text-[10px] text-gray-500">
                                Zone: <span className="font-bold">{zone.name}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 content-scrollbar">
                        {allDrivers.map(d => {
                            const isAssigned = (zone.assignedDriverIds || []).includes(d.id);

                            return (
                                <button
                                    key={d.id}
                                    onClick={() => onToggleAssignment(d.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${isAssigned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                                            {d.photo ? <img src={d.photo} alt="" className="w-full h-full object-cover" /> : `${d.firstName[0]}${d.lastName[0]}`}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-gray-900">{d.firstName} {d.lastName}</p>
                                            <p className="text-[10px] text-gray-400">Status: {d.status}</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${isAssigned ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}>
                                        {isAssigned && <Check size={12} strokeWidth={4} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
