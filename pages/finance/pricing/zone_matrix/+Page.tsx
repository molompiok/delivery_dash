import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ArrowLeft, Plus, Search, Grid, MapPin,
    Save, Minimize2, ZoomIn, ZoomOut, Check, ArrowRightLeft
} from 'lucide-react';
import { zoneService } from '../../../../api/zones';
import { paymentsService } from '../../../../api/payments';
import { Zone, PricingFilter, ZoneMatrixPair } from '../../../../api/types';

export default function ZoneMatrixPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [filters, setFilters] = useState<PricingFilter[]>([]);
    const [selectedFilterId, setSelectedFilterId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Which zones are actively used in the matrix (by ID)
    const [activeZoneIds, setActiveZoneIds] = useState<Set<string>>(new Set());

    // Matrix state: record of fromZoneId -> toZoneId -> { basePrice, bidirectional }
    const [matrix, setMatrix] = useState<Record<string, Record<string, { basePrice: number, bidirectional?: boolean }>>>({});

    // Pan & Zoom state
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Active input for the FAB
    const [focusedCell, setFocusedCell] = useState<{ from: string, to: string } | null>(null);

    // Mobile Sidebar Toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [zonesData, filtersData] = await Promise.all([
                zoneService.list(),
                paymentsService.getPricingFilters()
            ]);

            setZones(zonesData);
            setFilters(filtersData);

            if (filtersData.length > 0) {
                const activeFilter = filtersData.find(f => f.isActive) || filtersData[0];
                setSelectedFilterId(activeFilter.id);
                loadFilterMatrix(activeFilter);
            }
        } catch (error) {
            console.error("Failed to load data for matrix:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadFilterMatrix = (filter: PricingFilter) => {
        const pairs = filter.zoneMatrix?.pairs || [];
        const newMatrix: Record<string, Record<string, { basePrice: number, bidirectional?: boolean }>> = {};
        const activeIds = new Set<string>();

        pairs.forEach(pair => {
            if (!newMatrix[pair.fromZoneId]) newMatrix[pair.fromZoneId] = {};
            newMatrix[pair.fromZoneId][pair.toZoneId] = {
                basePrice: pair.basePrice,
                bidirectional: pair.bidirectional
            };
            activeIds.add(pair.fromZoneId);
            activeIds.add(pair.toZoneId);
        });

        setMatrix(newMatrix);
        setActiveZoneIds(prev => {
            const merged = new Set(prev);
            activeIds.forEach(id => merged.add(id));
            return merged;
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedFilterId(id);
        const filter = filters.find(f => f.id === id);
        if (filter) {
            loadFilterMatrix(filter);
        }
    };

    const handleSave = async () => {
        if (!selectedFilterId) return;
        setSaving(true);
        try {
            const pairs: ZoneMatrixPair[] = [];
            Object.entries(matrix).forEach(([fromId, toMap]) => {
                Object.entries(toMap).forEach(([toId, data]) => {
                    if (data.basePrice > 0 && activeZoneIds.has(fromId) && activeZoneIds.has(toId)) {
                        pairs.push({
                            fromZoneId: fromId,
                            toZoneId: toId,
                            basePrice: data.basePrice,
                            bidirectional: data.bidirectional
                        });
                    }
                });
            });

            const updatedFilter = await paymentsService.updatePricingFilter(selectedFilterId, {
                zoneMatrixEnabled: true,
                zoneMatrix: { pairs }
            });

            // Update local memory so changing filters doesn't use stale data
            setFilters(prev => prev.map(f => f.id === updatedFilter.id ? updatedFilter : f));

            // Show success toast (mocked for now)
            alert("Matrice enregistrée avec succès !");
        } catch (error) {
            console.error("Failed to save matrix:", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    const toggleZone = (zoneId: string) => {
        setActiveZoneIds(prev => {
            const next = new Set(prev);
            if (next.has(zoneId)) next.delete(zoneId);
            else next.add(zoneId);
            return next;
        });
    };

    const updateMatrixCell = (fromId: string, toId: string, val: number) => {
        setMatrix(prev => {
            const next = { ...prev };
            if (!next[fromId]) next[fromId] = {};
            const existing = next[fromId][toId] || { bidirectional: false };

            // If bidirection is broken, remove the flag
            let isBidirectional = existing.bidirectional;
            if (next[toId]?.[fromId]?.bidirectional && next[toId][fromId].basePrice !== val) {
                next[toId][fromId] = { ...next[toId][fromId], bidirectional: false };
                isBidirectional = false;
            }

            next[fromId] = {
                ...next[fromId],
                [toId]: { basePrice: val, bidirectional: isBidirectional }
            };
            return next;
        });
    };

    const applyBidirectional = (fromId: string, toId: string) => {
        setMatrix(prev => {
            const targetVal = prev[fromId]?.[toId]?.basePrice || 0;
            if (targetVal <= 0) return prev;

            const next = { ...prev };
            if (!next[fromId]) next[fromId] = {};
            if (!next[toId]) next[toId] = {};

            next[fromId] = {
                ...next[fromId],
                [toId]: { basePrice: targetVal, bidirectional: true }
            };
            next[toId] = {
                ...next[toId],
                [fromId]: { basePrice: targetVal, bidirectional: true }
            };
            return next;
        });
    };

    // Canvas panning logic
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.01;
            setScale(s => Math.min(Math.max(0.2, s + delta), 3));
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only drag on the background, not if clicking inputs or buttons
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'input' ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'button') {
            return;
        }
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Prevent default browser zoom when inside the canvas
        const preventDefault = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        };
        container.addEventListener('wheel', preventDefault, { passive: false });
        // Clean up global drag state
        const stopDrag = () => setIsDragging(false);
        window.addEventListener('mouseup', stopDrag);

        return () => {
            container.removeEventListener('wheel', preventDefault);
            window.removeEventListener('mouseup', stopDrag);
        };
    }, []);

    const activeZonesList = zones.filter(z => activeZoneIds.has(z.id));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Chargement de la matrice...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
            {/* Header */}
            <header className="h-16 md:h-20 shrink-0 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-30 shadow-sm relative">
                <div className="flex items-center gap-2 md:gap-6">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                    >
                        <Grid size={24} />
                    </button>

                    <a href="/finance/pricing" className="hidden md:flex p-2 -ml-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all">
                        <ArrowLeft size={24} />
                    </a>
                    <div className="hidden sm:block">
                        <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Grid className="text-emerald-500 hidden md:block" size={24} />
                            Zone Matrix Interactive
                        </h1>
                        <p className="hidden md:block text-xs text-slate-500 font-medium">Configurez les tarifs croisés {`(Surpasse le calcul au km)`}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                    <div className="flex flex-col items-end md:mr-4 flex-1 md:flex-initial max-w-[150px] md:max-w-none">
                        <label className="hidden md:block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Cible Tarifaire</label>
                        <select
                            value={selectedFilterId}
                            onChange={handleFilterChange}
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs md:text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500 outline-none truncate"
                        >
                            {filters.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.template || 'Général'})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none shrink-0"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        <span className="hidden md:inline">Enregistrer Matrix</span>
                        <span className="md:hidden">Save</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex ">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Visual Settings Sidebar */}
                <aside className={`absolute   left-0 bottom-0 md:relative h-[calc(100vh-70px)] w-full min-[500px]:w-72 md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 md:z-20 shadow-2xl md:shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                    <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 space-y-4 shrink-0">
                        <div className="flex items-center justify-between md:hidden mb-2">
                            <h3 className="font-black text-slate-800 dark:text-slate-200">Zones</h3>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <ArrowLeft size={16} />
                            </button>
                        </div>
                        <a
                            href="/map?tab=zones"
                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                        >
                            <Plus size={16} /> Ajouter une Zone
                        </a>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Filtrer les zones..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {zones.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase())).map(zone => {
                            const isActive = activeZoneIds.has(zone.id);
                            return (
                                <button
                                    key={zone.id}
                                    onClick={() => toggleZone(zone.id)}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group ${isActive
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                            style={{ backgroundColor: zone.color }}
                                        />
                                        <span className={`text-sm font-bold truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {zone.name}
                                        </span>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                                        }`}>
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 shrink-0">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex justify-between">
                            <span>Zones Actives</span>
                            <span className="text-emerald-500">{activeZoneIds.size} / {zones.length}</span>
                        </p>
                    </div>
                </aside>

                {/* Infinite Canvas */}
                <main
                    className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-950 cursor-grab active:cursor-grabbing outline-none"
                    ref={containerRef}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    tabIndex={0}
                >
                    {/* Grid Pattern Background */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-[0.05]"
                        style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                            backgroundSize: `${40 * scale}px ${40 * scale}px`,
                            backgroundPosition: `${pan.x}px ${pan.y}px`,
                            color: '#94a3b8'
                        }}
                    />

                    {/* Transform Container */}
                    <div
                        className="absolute origin-top-left flex pointer-events-none"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        }}
                    >
                        {/* Table Render Wrapper (Enable pointer events inside) */}
                        <div className="p-20 pointer-events-auto">
                            {activeZoneIds.size === 0 ? (
                                <div className="p-8 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center text-center max-w-sm">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mb-4">
                                        <MapPin size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Sélectionnez des zones</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-2">Activez des zones dans la barre latérale pour commencer à construire votre matrice de tarification croisée.</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform-gpu">

                                    <div className="flex">
                                        {/* Top Left Corner */}
                                        <div className="w-48 h-16 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-end p-3 relative overflow-hidden">
                                            <div className="absolute top-2 right-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Destination →</div>
                                            <div className="absolute bottom-2 left-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">↓ Départ</div>
                                            <div className="absolute top-1/2 left-0 w-[200%] h-px bg-slate-200 dark:bg-slate-700/50 -rotate-[15deg] origin-top-left -translate-y-1/2"></div>
                                        </div>

                                        {/* Column Headers (To Zones) */}
                                        <div className="flex">
                                            {activeZonesList.map(toZone => (
                                                <div key={`col-${toZone.id}`} className="w-56 h-16 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 flex items-center justify-center gap-2">
                                                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: toZone.color }} />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{toZone.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rows */}
                                    <div className="flex flex-col">
                                        {activeZonesList.map(fromZone => (
                                            <div key={`row-${fromZone.id}`} className="flex">
                                                {/* Row Header (From Zones) */}
                                                <div className="w-48 border-r border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full shadow-sm shrink-0" style={{ backgroundColor: fromZone.color }} />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{fromZone.name}</span>
                                                </div>

                                                {/* Cells */}
                                                <div className="flex">
                                                    {activeZonesList.map(toZone => {
                                                        const isSelf = fromZone.id === toZone.id;
                                                        const cellData = matrix[fromZone.id]?.[toZone.id];
                                                        const val = cellData?.basePrice || '';
                                                        const isBidi = cellData?.bidirectional;
                                                        const isFocused = focusedCell?.from === fromZone.id && focusedCell?.to === toZone.id;

                                                        return (
                                                            <div
                                                                key={`cell-${fromZone.id}-${toZone.id}`}
                                                                className={`w-56 h-20 border-r border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-center p-2 relative group focus-within:bg-emerald-50/50 dark:focus-within:bg-emerald-500/5 transition-colors ${isSelf ? 'bg-slate-50 dark:bg-slate-800/30' : 'bg-transparent'}`}
                                                            >
                                                                <input
                                                                    type="number"
                                                                    value={val}
                                                                    min="0"
                                                                    onChange={(e) => updateMatrixCell(fromZone.id, toZone.id, Number(e.target.value))}
                                                                    onFocus={() => setFocusedCell({ from: fromZone.id, to: toZone.id })}
                                                                    placeholder={isSelf ? "Même zone" : "--"}
                                                                    className={`w-full h-full text-center bg-transparent focus:outline-none font-black text-lg ${val ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'} placeholder:text-slate-300 dark:placeholder:text-slate-700`}
                                                                />

                                                                {/* Top-right Bidirection indicator */}
                                                                {!isSelf && isBidi && Number(val) > 0 && (
                                                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none">
                                                                        <ArrowRightLeft size={10} strokeWidth={3} />
                                                                        <span className="text-[8px] font-black uppercase tracking-tighter">Bidi</span>
                                                                    </div>
                                                                )}

                                                                {/* FAB for Bidi link when Focused */}
                                                                {!isSelf && isFocused && Number(val) > 0 && !isBidi && (
                                                                    <button
                                                                        onMouseDown={(e) => { e.preventDefault(); applyBidirectional(fromZone.id, toZone.id); }}
                                                                        className="absolute bottom-2 right-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white p-1.5 rounded-lg shadow-lg shadow-emerald-500/30 transform transition-all active:scale-90 z-10 animate-in fade-in zoom-in group-focus-within:block hidden"
                                                                        title="Appliquer dans l'autre sens"
                                                                    >
                                                                        <ArrowRightLeft size={14} />
                                                                    </button>
                                                                )}

                                                                {/* Subtle label on hover */}
                                                                {val === '' && (
                                                                    <span className="absolute bottom-1 right-2 text-[8px] font-bold text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                        FCFA
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Canvas Controls Overlay */}
                    <div className="absolute bottom-6 right-6 flex items-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-1">
                        <button
                            onClick={() => setScale(s => Math.min(3, s + 0.2))}
                            className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                            title="Zoom avant"
                        >
                            <ZoomIn size={20} />
                        </button>
                        <div className="w-16 text-center text-xs font-black text-slate-700 dark:text-slate-300">
                            {Math.round(scale * 100)}%
                        </div>
                        <button
                            onClick={() => setScale(s => Math.max(0.2, s - 0.2))}
                            className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                            title="Zoom arrière"
                        >
                            <ZoomOut size={20} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                        <button
                            onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
                            className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                            title="Recentrer"
                        >
                            <Minimize2 size={20} />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
