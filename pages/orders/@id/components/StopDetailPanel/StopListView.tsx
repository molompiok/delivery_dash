import React from 'react';
import { motion } from 'framer-motion';
import { formatId } from '../../../../../api/utils';
import { ChevronLeft, ChevronRight, Trash2, MapPin, User, Package, Check, Save, Plus, Clock, Calendar, Map as MapIcon, ArrowUpRight, ArrowDownLeft, Wrench } from 'lucide-react';
import EditableField from '../EditableField';
import LocationSearchBar from '../../../../../components/LocationSearchBar';
import SequentialDatePicker from './SequentialDatePicker';
import { variants, transition, ViewType } from './types';

interface StopListViewProps {
    direction: number;
    stop: any;
    isEditingAddress: boolean;
    confirmDeleteKey: string | null;
    setDirection: (dir: number) => void;
    setView: (view: ViewType) => void;
    setIsEditingAddress: (val: boolean) => void;
    setMapCenter: (center: google.maps.LatLngLiteral) => void;
    setSelectedLocation: (loc: google.maps.LatLngLiteral | null) => void;
    setEditingProductIdx: (idx: number | null) => void;
    setConfirmDeleteKey: (key: string | null) => void;
    setIsConfirmingStopDelete: (val: boolean) => void;
    handleFieldChange: (fieldPath: string, value: any) => void;
    performAddAction: (type: string) => Promise<void>;
    onClose: () => void;
}

const StopListView: React.FC<StopListViewProps> = ({
    direction,
    stop,
    isEditingAddress,
    confirmDeleteKey,
    setDirection,
    setView,
    setIsEditingAddress,
    setMapCenter,
    setSelectedLocation,
    setEditingProductIdx,
    setConfirmDeleteKey,
    setIsConfirmingStopDelete,
    handleFieldChange,
    performAddAction,
    onClose
}) => (
    <motion.div
        key="stop-list"
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="absolute inset-0 flex flex-col bg-[#f8fafc]"
    >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b shrink-0 transition-colors ${stop.isPendingChange ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3">
                <button
                    onClick={onClose}
                    className="p-2 bg-gray-50/50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                    <ChevronRight size={22} />
                </button>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                        Stop Details
                    </span>
                    <h2 className="text-xl tracking-tight line-clamp-1 break-all font-bold text-gray-900">
                        {formatId(stop.id)}
                    </h2>
                </div>
            </div>
            <button
                onClick={() => setIsConfirmingStopDelete(true)}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
                title="Delete Stop"
            >
                <Trash2 size={20} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-8">

            {/* Address Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MapPin size={16} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Location & Address</h3>
                        </div>
                    </div>

                    {/* TODO: Add logic to save location to private enterprise directory */}
                    <button
                        onClick={() => {
                            if (stop.address?.addressId) return;
                            const mockId = `LOC-${Math.floor(1000 + Math.random() * 9000)}`;
                            handleFieldChange('address.addressId', mockId);
                        }}
                        disabled={!!stop.address?.addressId}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${stop.address?.addressId
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                            }`}
                    >
                        {stop.address?.addressId ? (
                            <><Check size={12} /> Imported</>
                        ) : (
                            <><Save size={12} /> Import</>
                        )}
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest px-1">
                                Street Address
                            </label>
                            {(!stop.address?.street && !isEditingAddress) || isEditingAddress ? (
                                <LocationSearchBar
                                    placeholder="123 Main St"
                                    initialValue={stop.address?.street || ''}
                                    onLocationSelect={(loc) => {
                                        handleFieldChange('address.street', loc.address);
                                        handleFieldChange('address.lat', loc.lat);
                                        handleFieldChange('address.lng', loc.lng);
                                        setIsEditingAddress(false);

                                        // Auto-fill City and Country if empty
                                        if (loc.address) {
                                            const parts = loc.address.split(',').map(p => p.trim());
                                            if (parts.length > 0) {
                                                // Always assume last part is Country
                                                if (!stop.address?.country) {
                                                    handleFieldChange('address.country', parts[parts.length - 1]);
                                                }

                                                // Try to find City (ignoring ZIP codes)
                                                if (!stop.address?.city && parts.length >= 2) {
                                                    let cityCandidate = parts[parts.length - 2];
                                                    // If candidate looks like a ZIP code (numeric/alphanumeric short), look one part back
                                                    if (/^[\d-]{3,10}$/.test(cityCandidate) && parts.length >= 3) {
                                                        cityCandidate = parts[parts.length - 3];
                                                    }
                                                    handleFieldChange('address.city', cityCandidate);
                                                }
                                            }
                                        }
                                    }}
                                    wrapperClassName={`bg-white border rounded-xl px-1 py-0.5 transition-all ${isEditingAddress
                                        ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                                        : 'border-gray-100'}`}
                                    inputClassName="text-sm font-bold text-gray-900"
                                />
                            ) : (
                                <div
                                    onClick={() => setIsEditingAddress(true)}
                                    className="group relative min-h-[42px] flex items-center bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 cursor-text hover:border-gray-200 transition-all overflow-hidden w-full max-w-[340px]"
                                    title={stop.address?.street}
                                >
                                    <span className="truncate w-full block">
                                        {stop.address?.street || 'Select an address'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                // Initialize map with current location if available
                                if (stop.address?.lat && stop.address?.lng) {
                                    setMapCenter({ lat: stop.address.lat, lng: stop.address.lng });
                                    setSelectedLocation({ lat: stop.address.lat, lng: stop.address.lng });
                                }
                                setDirection(1);
                                setView('map');
                            }}
                            className="mt-6 w-[50px] flex items-center justify-center bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all group"
                            title="Select on Map"
                        >
                            <MapIcon size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <EditableField
                            label="City"
                            value={stop.address?.city || ''}
                            placeholder="New York"
                            onChange={(val) => handleFieldChange('address.city', val)}
                        />
                        <EditableField
                            label="Country"
                            value={stop.address?.country || 'USA'}
                            placeholder="USA"
                            onChange={(val) => handleFieldChange('address.country', val)}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                        <EditableField
                            label="Call"
                            value={stop.address?.call || ''}
                            placeholder="Code"
                            onChange={(val) => handleFieldChange('address.call', val)}
                        />
                        <EditableField
                            label="Room"
                            value={stop.address?.room || ''}
                            placeholder="Room"
                            onChange={(val) => handleFieldChange('address.room', val)}
                        />
                        <EditableField
                            label="Stage"
                            value={stop.address?.stage || ''}
                            placeholder="Floor"
                            onChange={(val) => handleFieldChange('address.stage', val)}
                        />
                    </div>
                </div>
            </section>

            {/* Client Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <User size={16} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Client & Contact</h3>
                        </div>
                    </div>

                    {/* TODO: Add logic to save client to private enterprise directory */}
                    <button
                        onClick={() => {
                            if (stop.client?.clientId) return;
                            const mockId = `CL-${Math.floor(1000 + Math.random() * 9000)}`;
                            handleFieldChange('client.clientId', mockId);
                        }}
                        disabled={!!stop.client?.clientId}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${stop.client?.clientId
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100'
                            }`}
                    >
                        {stop.client?.clientId ? (
                            <><Check size={12} /> Imported</>
                        ) : (
                            <><Save size={12} /> Import</>
                        )}
                    </button>
                </div>
                <div className="space-y-4">
                    <EditableField
                        label="Name"
                        value={stop.client?.name || ''}
                        placeholder="Client name"
                        onChange={(val) => handleFieldChange('client.name', val)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <EditableField
                            label="Phone"
                            value={stop.client?.phone || ''}
                            placeholder="+33..."
                            onChange={(val) => handleFieldChange('client.phone', val)}
                        />
                        <EditableField
                            label="Email"
                            value={stop.client?.email || ''}
                            placeholder="email@example.com"
                            onChange={(val) => handleFieldChange('client.email', val)}
                        />
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                        <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold mb-1.5 block">Estimated Time on Site</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus-within:border-orange-200 transition-all">
                                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                                    <Clock size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold leading-none">Hours</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        className="bg-transparent text-sm font-bold text-gray-900 outline-none w-full"
                                        value={Math.floor(Number(stop.client?.opening_hours?.duration || 0)) || ''}
                                        onChange={(e) => {
                                            const h = parseInt(e.target.value) || 0;
                                            const m = (Number(stop.client?.opening_hours?.duration || 0) % 1) * 60;
                                            handleFieldChange('client.opening_hours.duration', h + (m / 60));
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus-within:border-orange-200 transition-all">
                                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                                    <Clock size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold leading-none">Minutes</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        placeholder="0"
                                        className="bg-transparent text-sm font-bold text-gray-900 outline-none w-full"
                                        value={Math.round((Number(stop.client?.opening_hours?.duration || 0) % 1) * 60) || ''}
                                        onChange={(e) => {
                                            const h = Math.floor(Number(stop.client?.opening_hours?.duration || 0));
                                            const m = parseInt(e.target.value) || 0;
                                            handleFieldChange('client.opening_hours.duration', h + (m / 60));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <SequentialDatePicker
                            label="Start Window"
                            value={stop.client?.opening_hours?.start}
                            onChange={(iso: string) => handleFieldChange('client.opening_hours.start', iso)}
                            icon={Calendar}
                            color="blue"
                        />
                        <SequentialDatePicker
                            label="End Window"
                            value={stop.client?.opening_hours?.end}
                            onChange={(iso: string) => handleFieldChange('client.opening_hours.end', iso)}
                            icon={Calendar}
                            color="blue"
                        />
                    </div>
                </div>
            </section>

            {/* Actions / Products Section */}
            <section className="pb-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Package size={16} />
                        </div>
                        <h3 className="text-[12px] uppercase tracking-widest">
                            Produit & Service
                        </h3>
                    </div>
                    <button
                        onClick={() => {
                            const type = stop.type === 'Pick-Up' ? 'pickup' : 'service';
                            performAddAction(type);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        title="Add Product"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    {(stop.actions || []).map((action: any, idx: number) => {
                        const itemKey = `action-${idx}`;
                        const isConfirmingDelete = confirmDeleteKey === itemKey;
                        const typeColor = action.type === 'service' ? 'blue' : action.type === 'pickup' ? 'orange' : 'emerald';
                        const ActionIcon = action.type === 'service' ? Wrench : action.type === 'pickup' ? ArrowUpRight : ArrowDownLeft;

                        return (
                            <div key={action.id || itemKey} className="flex items-center gap-3 overflow-hidden rounded-3xl group">
                                {/* Deletion Confirmation */}
                                {isConfirmingDelete && (
                                    <div className="flex items-center gap-2 pr-2 border-r border-gray-100 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDeleteKey(null);
                                            }}
                                            className="px-4 py-3 flex items-center gap-2 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-colors text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <ChevronLeft size={14} /> Cancel
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Prevent deleting last action -> Reset instead
                                                if (stop.actions.length <= 1) {
                                                    const resetAction = {
                                                        id: Date.now(),
                                                        productName: stop.type === 'Pick-Up' ? 'Produit' : 'Service',
                                                        quantity: 1,
                                                        service_time: 10,
                                                        type: stop.type === 'Pick-Up' ? 'pickup' : 'service',
                                                        status: 'Pending',
                                                        secure: 'none',
                                                        requirements: []
                                                    };
                                                    handleFieldChange('actions', [resetAction]);
                                                } else {
                                                    const newActions = stop.actions.filter((_: any, i: number) => i !== idx);
                                                    handleFieldChange('actions', newActions);
                                                }
                                                setConfirmDeleteKey(null);
                                            }}
                                            className="px-4 py-3 flex items-center gap-2 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-colors text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
                                        >
                                            <Trash2 size={14} /> {stop.actions.length <= 1 ? 'Reset' : 'Delete'}
                                        </button>
                                    </div>
                                )}

                                {/* Main Action Item */}
                                <div
                                    onClick={() => {
                                        if (isConfirmingDelete) return;
                                        setEditingProductIdx(idx);
                                        setDirection(1);
                                        setView('product');
                                    }}
                                    className={`flex-1 flex items-center justify-between p-3 bg-white rounded-3xl border border-transparent ${isConfirmingDelete ? 'pointer-events-none' : 'hover:border-' + typeColor + '-200 shadow-sm hover:shadow-md cursor-pointer'} transition-all`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`p-2 rounded-xl bg-${typeColor}-50 text-${typeColor}-600 flex-shrink-0`}>
                                            <ActionIcon size={18} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                {action.productName || action.product?.name || 'New Product'}
                                            </span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400">
                                                    {action.type === 'service'
                                                        ? `Time: ${action.service_time || 10} min`
                                                        : `Qty: ${action.quantity || 1}`}
                                                </span>
                                                <span className={`text-[8px] uppercase tracking-tighter bg-${typeColor}-50 text-${typeColor}-600 px-1.5 py-0.5 rounded font-black`}>
                                                    {action.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        {!isConfirmingDelete && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteKey(itemKey);
                                                    }}
                                                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-0.5 transition-all" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {(!stop.actions || stop.actions.length === 0) && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            No products added
                        </div>
                    )}
                </div>
            </section>
        </div>

        {/* Footer Removed - Everything is Auto-Saved */}
    </motion.div>
);

export default StopListView;
