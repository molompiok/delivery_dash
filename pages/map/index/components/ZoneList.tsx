import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, Plus, X, Circle as CircleIcon, Square, Activity, Layers, ChevronDown, ChevronUp, ChevronRight, Download, Eye, Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { Zone, Driver } from '../../../../api/mock';
import { zoneService } from '../../../../api/zones';

interface ZoneListProps {
    zones: Zone[];
    drivers: Driver[];
    activeZoneId: string | null;
    onSelectZone: (id: string | null) => void;
    onOpenDetail: (id: string) => void;
    showZones: boolean;
    setShowZones: (val: boolean) => void;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    drawingMode: google.maps.drawing.OverlayType | 'hexagon' | null;
    setDrawingMode: (mode: google.maps.drawing.OverlayType | 'hexagon' | null) => void;
    addHexagonPreset: () => void;
    cancelEditing: () => void;
    collapsedSectors: string[];
    setCollapsedSectors: (val: string[]) => void;
    onZoneImported?: (zone: Zone) => void;  // Callback when a zone is imported
    onFocusZone?: (zone: Zone) => void;  // Callback to focus map on a zone
}

type ViewMode = 'list' | 'import';

export const ZoneList: React.FC<ZoneListProps> = ({
    zones,
    drivers,
    activeZoneId,
    onSelectZone,
    onOpenDetail,
    showZones,
    setShowZones,
    isEditing,
    setIsEditing,
    drawingMode,
    setDrawingMode,
    addHexagonPreset,
    cancelEditing,
    collapsedSectors,
    setCollapsedSectors,
    onZoneImported,
    onFocusZone
}) => {
    const [viewMode, setViewMode] = React.useState<ViewMode>('list');
    const [importingZoneId, setImportingZoneId] = React.useState<string | null>(null);

    // Filter zones by type
    const companyZones = zones.filter(z => z.ownerType === 'Company' || z.ownerType === 'User');
    const sublymusZones = zones.filter(z => z.ownerType === 'Sublymus');

    const grouped = companyZones.reduce((acc, zone) => {
        const sector = zone.sector || 'NON CLASSE';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(zone);
        return acc;
    }, {} as Record<string, Zone[]>);

    const sublymusGrouped = sublymusZones.reduce((acc, zone) => {
        const sector = zone.sector || 'GLOBAL';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(zone);
        return acc;
    }, {} as Record<string, Zone[]>);

    const handleImportZone = async (zone: Zone) => {
        setImportingZoneId(zone.id);
        try {
            const result = await zoneService.installFromSublymus(zone.id);
            if (onZoneImported) {
                onZoneImported(result.zone);
            }
            // Go back to list and open detail of newly created zone
            setViewMode('list');
            onOpenDetail(result.zone.id);
        } catch (error: any) {
            console.error('Failed to import zone:', error);
            alert(error?.response?.data?.message || 'Erreur lors de l\'importation');
        } finally {
            setImportingZoneId(null);
        }
    };

    const handleViewZone = (zone: Zone) => {
        if (onFocusZone) {
            onFocusZone(zone);
        }
        onSelectZone(zone.id);
    };

    // Render Import View (Sublymus zones)
    if (viewMode === 'import') {
        return (
            <motion.div
                key="import-list"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="space-y-4 h-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                <div className="flex items-center gap-2 sticky top-0 bg-white/80 backdrop-blur pb-2 pt-1 z-10 border-b border-gray-100">
                    <button
                        onClick={() => setViewMode('list')}
                        className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft size={14} />
                    </button>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Zones Sublymus</p>
                        <p className="text-[9px] text-gray-400">Importez une zone globale prédéfinie</p>
                    </div>
                </div>

                {Object.entries(sublymusGrouped).map(([sector, sectorZones]) => (
                    <div key={sector} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Globe size={12} className="text-indigo-400" />
                            <span>{sector} ({sectorZones.length})</span>
                        </div>

                        {sectorZones.map(z => {
                            const geom = z.geometry || {};
                            const isImporting = importingZoneId === z.id;
                            // Check if already imported
                            const alreadyImported = companyZones.some(cz => cz.sourceZoneId === z.id);

                            return (
                                <div
                                    key={z.id}
                                    className="p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: z.color }}></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{z.name}</h3>
                                                    <span className="px-1 py-0.5 rounded-[4px] bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-tighter">
                                                        Global
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium capitalize">
                                                    {z.type} · {geom.radiusKm ? `${geom.radiusKm.toFixed(1)}km` : geom.paths ? `${geom.paths.length} pts` : 'Rect'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleViewZone(z)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Voir sur la carte"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            {alreadyImported ? (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[9px] font-bold uppercase rounded-lg">
                                                    Importée
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleImportZone(z)}
                                                    disabled={isImporting}
                                                    className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isImporting ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Download size={12} />
                                                    )}
                                                    {isImporting ? 'Import...' : 'Importer'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {sublymusZones.length === 0 && (
                    <div className="text-center py-10">
                        <Globe size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">Aucune zone Sublymus disponible</p>
                    </div>
                )}
            </motion.div>
        );
    }

    // Render main zone list
    return (
        <motion.div
            key="zone-list"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="space-y-4 h-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur pb-2 pt-1 z-10 border-b border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Liste des Zones</p>
                <div className="flex gap-2">
                    <button onClick={() => setShowZones(!showZones)} className={`p-1.5 rounded-lg transition-all ${showZones ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`} title={showZones ? "Masquer les zones" : "Afficher les zones"}>
                        <MapIcon size={14} />
                    </button>
                    {!isEditing ? (
                        <button onClick={() => { setIsEditing(true); setDrawingMode(google.maps.drawing.OverlayType.CIRCLE); }} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                            <Plus size={12} /> Nouvelle
                        </button>
                    ) : (
                        <button onClick={cancelEditing} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase hover:bg-red-100 transition-colors">
                            <X size={12} /> Stop
                        </button>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in fade-in zoom-in duration-200">
                    <p className="text-xs text-blue-800 font-medium mb-2">Mode édition actif : <br /><span className="text-[10px] opacity-70">Choisissez un outil et dessinez sur la carte.</span></p>
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => setDrawingMode(google.maps.drawing.OverlayType.CIRCLE)} className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${drawingMode === google.maps.drawing.OverlayType.CIRCLE ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><CircleIcon size={14} /> <span className="text-[9px] font-bold uppercase">Cercle</span></button>
                        <button onClick={() => setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE)} className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${drawingMode === google.maps.drawing.OverlayType.RECTANGLE ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><Square size={14} /> <span className="text-[9px] font-bold uppercase">Carré</span></button>
                        <button onClick={() => setDrawingMode(google.maps.drawing.OverlayType.POLYGON)} className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${drawingMode === google.maps.drawing.OverlayType.POLYGON ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><Activity size={14} /> <span className="text-[9px] font-bold uppercase">Points</span></button>
                        <button onClick={addHexagonPreset} className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${drawingMode === 'hexagon' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><Layers size={14} /> <span className="text-[9px] font-bold uppercase">Hexa</span></button>
                    </div>

                    {/* Import button */}
                    {sublymusZones.length > 0 && (
                        <button
                            onClick={() => { setViewMode('import'); cancelEditing(); }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                        >
                            <Globe size={14} />
                            <span className="text-[10px] font-bold uppercase">Importer une zone Sublymus</span>
                            <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-700 text-[9px] font-bold rounded-full">{sublymusZones.length}</span>
                        </button>
                    )}
                </div>
            )}

            {Object.entries(grouped).map(([sector, sectorZones]) => {
                const isCollapsed = collapsedSectors.includes(sector);
                return (
                    <div key={sector} className="space-y-2">
                        <button
                            onClick={() => setCollapsedSectors(isCollapsed ? collapsedSectors.filter(s => s !== sector) : [...collapsedSectors, sector])}
                            className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                        >
                            <span>{sector} ({sectorZones.length})</span>
                            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>

                        {!isCollapsed && sectorZones.map(z => {
                            const assignedDrivers = (z.assignedDriverIds || []).map(id => drivers.find(d => d.id === id)).filter(Boolean) as Driver[];
                            const geom = z.geometry || {};
                            const isFromSublymus = !!z.sourceZoneId;
                            return (
                                <div
                                    key={z.id}
                                    onClick={() => onSelectZone(activeZoneId === z.id ? null : z.id)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer group relative bg-white ${activeZoneId === z.id ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-gray-100 hover:border-emerald-200'} ${!z.isActive ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: z.color }}></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{z.name}</h3>
                                                    <span className={`px-1 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter ${z.ownerType === 'Company' ? 'bg-emerald-50 text-emerald-600' : z.ownerType === 'Sublymus' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                                                        {z.ownerType === 'Company' ? 'Entr.' : z.ownerType === 'Sublymus' ? 'Global' : 'Perso'}
                                                    </span>
                                                    {isFromSublymus && (
                                                        <span className="px-1 py-0.5 rounded-[4px] bg-indigo-50 text-indigo-400 text-[7px] font-bold uppercase" title="Importée depuis Sublymus">
                                                            <Globe size={8} className="inline -mt-0.5" />
                                                        </span>
                                                    )}
                                                    {!z.isActive && <span className="px-1 py-0.5 rounded-[4px] bg-gray-100 text-gray-500 text-[8px] font-black uppercase tracking-tighter">Off</span>}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium capitalize">
                                                    {z.type} · {geom.radiusKm ? `${geom.radiusKm.toFixed(1)}km` : geom.paths ? `${geom.paths.length} pts` : 'Rect'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {assignedDrivers.length > 0 && (
                                                <div className="flex -space-x-2 mr-2">
                                                    {assignedDrivers.slice(0, 3).map((d, i) => (
                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 shadow-sm flex items-center justify-center text-[8px] font-bold text-gray-500 overflow-hidden">
                                                            {d.photo ? <img src={d.photo} alt={d.lastName} className="w-full h-full object-cover" /> : `${d.firstName[0]}${d.lastName[0]}`}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => { e.stopPropagation(); onOpenDetail(z.id); }}
                                                className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </motion.div>
    );
};
