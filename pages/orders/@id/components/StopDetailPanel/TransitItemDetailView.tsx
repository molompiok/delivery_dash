import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, Boxes, Droplets, AlertCircle, AlertTriangle, ThermometerSnowflake, Plus, Loader2 } from 'lucide-react';
import EditableField from '../EditableField';
import { variants, transition, NewItemFormState, ViewType } from './types';

interface TransitItemDetailViewProps {
    direction: number;
    transitItemForm: NewItemFormState;
    isCreatingTransitItem: boolean;
    isEditing?: boolean;
    setDirection: (dir: number) => void;
    setView: (view: ViewType) => void;
    setTransitItemForm: (form: NewItemFormState) => void;
    handleConfirmCreateTransitItem: () => Promise<void>;
    handleTransitItemChange?: (field: string, value: any) => Promise<void>;
}

const TransitItemDetailView: React.FC<TransitItemDetailViewProps> = ({
    direction,
    transitItemForm: newItemForm,
    isCreatingTransitItem,
    isEditing = false,
    setDirection,
    setView,
    setTransitItemForm: setNewItemForm,
    handleConfirmCreateTransitItem,
    handleTransitItemChange
}) => {
    const onFieldChange = (field: string, value: any) => {
        setNewItemForm({ ...newItemForm, [field]: value });
        if (isEditing && handleTransitItemChange) {
            handleTransitItemChange(field, value);
        }
    };

    const onDimensionChange = (dim: 'width_cm' | 'height_cm' | 'depth_cm', value: number) => {
        const newDims = { ...newItemForm.dimensions, [dim]: value };
        setNewItemForm({ ...newItemForm, dimensions: newDims });
        if (isEditing && handleTransitItemChange) {
            handleTransitItemChange('dimensions', newDims);
        }
    };

    const toggleRequirement = (reqId: string) => {
        const isSelected = newItemForm.requirements.includes(reqId);
        const newReqs = isSelected
            ? newItemForm.requirements.filter((r) => r !== reqId)
            : [...newItemForm.requirements, reqId];

        setNewItemForm({ ...newItemForm, requirements: newReqs });
        if (isEditing && handleTransitItemChange) {
            handleTransitItemChange('metadata', { requirements: newReqs });
        }
    };

    return (
        <motion.div
            key="transit-item-detail"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 flex flex-col bg-[#f8fafc]"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('product');
                        }}
                        className="p-2 bg-gray-50 text-gray-500 hover:text-gray-900 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                            {isEditing ? 'Edit Transit Item' : 'New Transit Item'}
                        </span>
                        <h2 className="text-xl tracking-tight font-bold text-gray-900">
                            {newItemForm.name || (isEditing ? 'Chargement...' : 'Nouveau Produit')}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-8">
                {/* Product Name */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Package size={16} />
                        </div>
                        <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Product Name</h3>
                    </div>
                    <EditableField
                        label=""
                        value={newItemForm.name}
                        placeholder="Nom du produit..."
                        onChange={(val) => onFieldChange('name', val)}
                    />
                </section>

                {/* Logistics & Physical */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Boxes size={16} />
                        </div>
                        <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Logistics & Physical</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField
                                label="Weight (g)"
                                value={newItemForm.weight}
                                type="number"
                                placeholder="0"
                                onChange={(val) => onFieldChange('weight', Number(val))}
                            />
                            <EditableField
                                label="Unitary Price (€)"
                                value={newItemForm.unitary_price}
                                type="number"
                                placeholder="0"
                                onChange={(val) => onFieldChange('unitary_price', Number(val))}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">Packaging Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onFieldChange('packaging_type', 'box')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${newItemForm.packaging_type === 'box'
                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                        }`}
                                >
                                    <Package size={16} />
                                    <span className="text-xs font-bold">Carton</span>
                                </button>
                                <button
                                    onClick={() => onFieldChange('packaging_type', 'fluid')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${newItemForm.packaging_type === 'fluid'
                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                        }`}
                                >
                                    <Droplets size={16} />
                                    <span className="text-xs font-bold">Fluide</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dimensions */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Boxes size={16} />
                            </div>
                            <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Dimensions (cm)</h3>
                        </div>
                        <span className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold">
                            {((newItemForm.dimensions.width_cm || 0) * (newItemForm.dimensions.height_cm || 0) * (newItemForm.dimensions.depth_cm || 0) / 1000).toFixed(2)}L
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <EditableField
                            label="W"
                            value={newItemForm.dimensions.width_cm}
                            type="number"
                            placeholder="0"
                            onChange={(val) => onDimensionChange('width_cm', Number(val))}
                        />
                        <EditableField
                            label="H"
                            value={newItemForm.dimensions.height_cm}
                            type="number"
                            placeholder="0"
                            onChange={(val) => onDimensionChange('height_cm', Number(val))}
                        />
                        <EditableField
                            label="D"
                            value={newItemForm.dimensions.depth_cm}
                            type="number"
                            placeholder="0"
                            onChange={(val) => onDimensionChange('depth_cm', Number(val))}
                        />
                    </div>
                </section>

                {/* Special Handling */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                            <AlertCircle size={16} />
                        </div>
                        <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Special Handling</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-8">
                        {[
                            { id: 'froid', label: 'Cold Chain', icon: ThermometerSnowflake, activeClass: 'border-blue-500 bg-blue-50/50 text-blue-700', iconColor: 'text-blue-600' },
                            { id: 'fragile', label: 'Fragile', icon: AlertCircle, activeClass: 'border-rose-500 bg-rose-50/50 text-rose-700', iconColor: 'text-rose-600' },
                            { id: 'dangerous', label: 'Dangerous', icon: AlertTriangle, activeClass: 'border-orange-500 bg-orange-50/50 text-orange-700', iconColor: 'text-orange-600' },
                            { id: 'sec', label: 'Dry / Ambient', icon: Package, activeClass: 'border-emerald-500 bg-emerald-50/50 text-emerald-700', iconColor: 'text-emerald-600' },
                        ].map((req) => {
                            const isSelected = newItemForm.requirements.includes(req.id);
                            return (
                                <button
                                    key={req.id}
                                    onClick={() => toggleRequirement(req.id)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isSelected
                                        ? req.activeClass
                                        : 'border-gray-50 bg-white hover:border-gray-200 text-gray-400'
                                        }`}
                                >
                                    <req.icon size={14} className={isSelected ? req.iconColor : 'text-gray-300'} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">{req.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                {isEditing ? (
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('product');
                        }}
                        className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        Save & Back
                    </button>
                ) : (
                    <button
                        onClick={handleConfirmCreateTransitItem}
                        disabled={isCreatingTransitItem || !newItemForm.name.trim()}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isCreatingTransitItem || !newItemForm.name.trim()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                            }`}
                    >
                        {isCreatingTransitItem ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Création en cours...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Créer le Produit
                            </>
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default TransitItemDetailView;
