import React from 'react';
import { motion } from 'framer-motion';
import { X, Package, ChevronLeft, ChevronRight, Trash2, Plus, Loader2, ArrowUp, ArrowDown, Wrench, Timer, Search, Camera, QrCode, PenTool, AlertTriangle } from 'lucide-react';
import EditableField from '../EditableField';
import { variants, transition, ViewType } from './types';

interface ProductDetailViewProps {
    direction: number;
    stop: any;
    editingProductIdx: number | null;
    isCreatingAction: boolean;
    creationError: string | null;
    pendingActionType: string | null;
    transitItemSearch: string;
    isSearchingTransitItems: boolean;
    isCreatingTransitItem: boolean;
    confirmDeleteKey: string | null;
    availableTransitItems: any[];
    setDirection: (dir: number) => void;
    setView: (view: ViewType) => void;
    setCreationError: (err: string | null) => void;
    setTransitItemSearch: (search: string) => void;
    setIsSearchingTransitItems: (val: boolean) => void;
    setConfirmDeleteKey: (key: string | null) => void;
    setSelectedValidationType: (type: 'photo' | 'code' | null) => void;
    setEditingValidationIdx: (idx: number | null) => void;
    handleProductChange: (idx: number, field: string, value: any) => void;
    handleTransitItemChange: (itemId: string, field: string, value: any) => Promise<void>;
    handleCreateTransitItem: () => void;
    performAddAction: (type: string) => Promise<void>;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
    direction,
    stop,
    editingProductIdx,
    isCreatingAction,
    creationError,
    pendingActionType,
    transitItemSearch,
    isSearchingTransitItems,
    isCreatingTransitItem,
    confirmDeleteKey,
    availableTransitItems,
    setDirection,
    setView,
    setCreationError,
    setTransitItemSearch,
    setIsSearchingTransitItems,
    setConfirmDeleteKey,
    setSelectedValidationType,
    setEditingValidationIdx,
    handleProductChange,
    handleTransitItemChange,
    handleCreateTransitItem,
    performAddAction
}) => {
    if (isCreatingAction) {
        return (
            <motion.div
                key="product-loading"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white p-12 text-center"
            >
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
                    <Loader2 size={32} className="text-blue-600 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Création du produit...</h3>
                <p className="text-xs text-gray-500">Un instant, nous préparons la fiche produit sur le serveur.</p>
            </motion.div>
        );
    }

    if (creationError) {
        return (
            <motion.div
                key="product-error"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white p-12 text-center"
            >
                <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center mb-6">
                    <AlertTriangle size={32} className="text-rose-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Oups ! Erreur de création</h3>
                <p className="text-xs text-gray-500 mb-8">{creationError}</p>
                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={() => performAddAction(pendingActionType!)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        Réessayer
                    </button>
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('stop');
                            setCreationError(null);
                        }}
                        className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                        Annuler
                    </button>
                </div>
            </motion.div>
        );
    }

    if (editingProductIdx === null) return null;
    const product = stop.actions?.[editingProductIdx] || {};

    // Collect all validations for unified list
    const photoValidations = Array.isArray(product.confirmation?.photo) ? product.confirmation.photo : [];
    const codeValidations = Array.isArray(product.confirmation?.code) ? product.confirmation.code : [];
    const allValidations = [
        ...photoValidations.map((v: any, idx: number) => ({ ...v, type: 'photo', globalIdx: idx })),
        ...codeValidations.map((v: any, idx: number) => ({ ...v, type: 'code', globalIdx: idx }))
    ];

    return (
        <motion.div
            key="product-detail"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 flex flex-col bg-[#f8fafc]"
        >
            <div className={`flex items-center justify-between p-6 border-b transition-colors ${stop.isPendingChange ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('stop');
                        }}
                        className="p-2 bg-gray-50 text-gray-500 hover:text-gray-900 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                            Product Details
                        </span>
                        <div className="flex flex-col">
                            <h2 className="text-xl tracking-tight line-clamp-1 break-all">
                                {product.productName || 'New Product'}
                            </h2>
                            {product.productId && (
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-0.5 bg-gray-50 px-1.5 py-0.5 rounded w-fit">
                                    #{product.productId}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Type Switcher Inline (up, down, service) */}
                    <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden h-[40px]">
                        <button
                            onClick={() => handleProductChange(editingProductIdx, 'type', 'pickup')}
                            title="Pickup"
                            className={`flex items-center justify-center w-[36px] rounded-lg transition-all text-sm font-black ${product.type === 'pickup'
                                ? 'bg-white text-orange-600 shadow-sm shadow-orange-100'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <ArrowUp size={16} />
                        </button>
                        <button
                            onClick={() => handleProductChange(editingProductIdx, 'type', 'delivery')}
                            title="Delivery"
                            className={`flex items-center justify-center w-[36px] rounded-lg transition-all text-sm font-black ${product.type === 'delivery'
                                ? 'bg-white text-emerald-600 shadow-sm shadow-emerald-100'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <ArrowDown size={16} />
                        </button>
                        <button
                            onClick={() => handleProductChange(editingProductIdx, 'type', 'service')}
                            title="Service"
                            className={`flex items-center justify-center w-[36px] rounded-lg transition-all text-sm font-black ${product.type === 'service'
                                ? 'bg-white text-blue-600 shadow-sm shadow-blue-100'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Wrench size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-8">
                {/* General Info */}

                {/* General Info */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                {product.type === 'service' ? <Wrench size={16} /> : <Package size={16} />}
                            </div>
                            <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">
                                {product.type === 'service' ? 'Service Information' : 'General Information'}
                            </h3>
                        </div>

                        {/* Type Switcher Inline Removed from here - moved to header */}
                    </div>
                    <div className="space-y-4">
                        {!product.transitItemId ? (
                            <div className="space-y-4">
                                {product.type === 'service' ? (
                                    /* Service Mode: Name Input + Duration */
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">Nom du Service</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all"
                                                placeholder="Installation, Réparation, Maintenance..."
                                                value={product.productName || ''}
                                                onChange={(e) => handleProductChange(editingProductIdx, 'productName', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">Durée Estimée</label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all pl-10"
                                                        placeholder="15"
                                                        value={Math.round((product.service_time || 900) / 60)}
                                                        onChange={(e) => handleProductChange(editingProductIdx, 'service_time', parseInt(e.target.value || '15', 10) * 60)}
                                                    />
                                                    <Timer size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 uppercase">minutes</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Pickup / Delivery Mode: Search + Create */
                                    <>
                                        <div className="flex flex-col gap-1.5 relative">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all pl-10"
                                                    placeholder="ID ou Nom du produit..."
                                                    value={transitItemSearch}
                                                    onChange={(e) => setTransitItemSearch(e.target.value)}
                                                    onFocus={() => setIsSearchingTransitItems(true)}
                                                />
                                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                            </div>

                                            {isSearchingTransitItems && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setIsSearchingTransitItems(false)}
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden max-h-[240px] overflow-y-auto scrollbar-hide"
                                                    >
                                                        {availableTransitItems
                                                            .filter((it: any) =>
                                                                it.name?.toLowerCase().includes(transitItemSearch.toLowerCase()) ||
                                                                it.id?.toLowerCase().includes(transitItemSearch.toLowerCase())
                                                            )
                                                            .map((item: any) => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleProductChange(editingProductIdx, 'transitItemId', item.id);
                                                                        setIsSearchingTransitItems(false);
                                                                        setTransitItemSearch('');
                                                                    }}
                                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                                                >
                                                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                                                        <Package size={14} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-bold text-gray-900 truncate">{item.name}</span>
                                                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">#{item.id.slice(-6)}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        {availableTransitItems.length === 0 && (
                                                            <div className="p-8 text-center text-xs text-gray-400">Aucun produit en transit</div>
                                                        )}
                                                    </motion.div>
                                                </>
                                            )}
                                        </div>
                                        {product.type === 'pickup' && (
                                            <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Ou créer un nouvel article</p>
                                                <button
                                                    onClick={handleCreateTransitItem}
                                                    disabled={isCreatingTransitItem}
                                                    className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                                                >
                                                    {isCreatingTransitItem ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Plus size={14} /> Nouveau Produit
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-2xl mb-4 group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                                            <Package size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-gray-900 uppercase">Article Lié</span>
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">ID: {product.transitItemId}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleProductChange(editingProductIdx, 'transitItemId', null)}
                                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <EditableField
                                    label={product.type === 'service' ? "Service Name" : "Product Name"}
                                    value={product.productName || product.transitItem?.name || ''}
                                    placeholder={product.type === 'service' ? "Installation, Maintenance..." : "iPhone 15 Pro..."}
                                    onChange={(val) => {
                                        if (product.transitItemId) {
                                            handleTransitItemChange(product.transitItemId, 'name', val);
                                        } else {
                                            handleProductChange(editingProductIdx, 'productName', val);
                                        }
                                    }}
                                />

                                {product.type === 'service' ? (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                                            <Timer size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <EditableField
                                                label="Service Duration (minutes)"
                                                value={product.service_time || 10}
                                                type="number"
                                                onChange={(val) => handleProductChange(editingProductIdx, 'service_time', Number(val))}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <EditableField
                                            label="Quantity"
                                            value={product.quantity || 1}
                                            type="number"
                                            onChange={(val) => handleProductChange(editingProductIdx, 'quantity', Number(val))}
                                        />
                                        <EditableField
                                            label="Packaging"
                                            value={product.transitItem?.packaging_type || 'box'}
                                            onChange={(val) => {
                                                if (product.transitItemId) {
                                                    handleTransitItemChange(product.transitItemId, 'packaging_type', val);
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                <EditableField
                                    label="Description"
                                    value={product.productDescription || product.transitItem?.description || ''}
                                    type="textarea"
                                    placeholder={product.type === 'service' ? "Service details..." : "Product description..."}
                                    onChange={(val) => {
                                        if (product.transitItemId) {
                                            handleTransitItemChange(product.transitItemId, 'description', val);
                                        } else {
                                            handleProductChange(editingProductIdx, 'productDescription', val);
                                        }
                                    }}
                                    collapsible={true}
                                    collapseLimit={500}
                                    maxLength={500}
                                />

                                {product.type !== 'service' && !product.transitItemId && (
                                    <EditableField
                                        label="Product URL"
                                        value={product.productUrl || ''}
                                        placeholder="https://..."
                                        onChange={(val) => handleProductChange(editingProductIdx, 'productUrl', val)}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Validation Rules */}
                {product.type !== 'delivery' && (
                    <section className="pb-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <PenTool size={16} />
                                </div>
                                <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Validation Rules</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setDirection(1);
                                    setView('validation-edit');
                                    setEditingValidationIdx(null);
                                    setSelectedValidationType(null);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all text-[11px] font-black uppercase tracking-wider"
                            >
                                <Plus size={14} /> Add
                            </button>
                        </div>

                        <div className="space-y-3">
                            {allValidations.map((v: any) => {
                                const typeColor = v.type === 'photo' ? 'blue' : 'emerald';
                                const TypeIcon = v.type === 'photo' ? Camera : QrCode;
                                const itemKey = `${v.type}-${v.globalIdx}`;
                                const isConfirmingDelete = confirmDeleteKey === itemKey;

                                return (
                                    <div key={itemKey} className="flex items-center gap-3 overflow-hidden rounded-3xl group">
                                        {/* Confirmation Buttons */}
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
                                                        const arrayKey = `confirmation.${v.type}`;
                                                        const currentArray = Array.isArray(product.confirmation?.[v.type]) ? product.confirmation[v.type] : [];
                                                        const newArray = currentArray.filter((_: any, i: number) => i !== v.globalIdx);
                                                        handleProductChange(editingProductIdx, arrayKey, newArray);
                                                        setConfirmDeleteKey(null);
                                                    }}
                                                    className="px-4 py-3 flex items-center gap-2 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-colors text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}

                                        {/* Main Item Content */}
                                        <div
                                            onClick={() => {
                                                if (isConfirmingDelete) return;
                                                setSelectedValidationType(v.type);
                                                setEditingValidationIdx(v.globalIdx);
                                                setDirection(1);
                                                setView('validation-edit');
                                            }}
                                            className={`flex-1 flex items-center justify-between p-4 bg-white rounded-3xl border border-transparent ${isConfirmingDelete ? 'pointer-events-none' : 'hover:border-' + typeColor + '-200 shadow-sm hover:shadow-md cursor-pointer'} transition-all`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-xl bg-${typeColor}-50 text-${typeColor}-600 flex-shrink-0`}>
                                                    <TypeIcon size={18} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                        {v.name}
                                                    </span>
                                                    <div className="flex gap-2 mt-1">
                                                        {v.pickup && <span className="text-[8px] uppercase tracking-tighter bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">Pickup</span>}
                                                        {v.delivery && <span className="text-[8px] uppercase tracking-tighter bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">Delivery</span>}
                                                        {v.compare && <span className={`text-[8px] uppercase tracking-tighter bg-${typeColor}-50 text-${typeColor}-600 px-1.5 py-0.5 rounded`}>Compare</span>}
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
                            {allValidations.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No validations configured</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div >

            {/* Footer */}
            < div className="p-6 bg-white border-t border-gray-100 flex gap-3" >
                <button
                    onClick={() => {
                        setDirection(-1);
                        setView('stop');
                    }}
                    className="flex-1 px-6 py-3 text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-200 transition-all"
                >
                    Back to Stop
                </button>
            </div >
        </motion.div >
    );
};

export default ProductDetailView;
