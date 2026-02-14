import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Camera, QrCode, ArrowUpRight, ArrowDownLeft, CheckCircle2, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import EditableField from '../EditableField';
import { variants, transition, ViewType } from './types';

interface ValidationDetailViewProps {
    direction: number;
    editingProductIdx: number | null;
    selectedValidationType: 'photo' | 'code' | null;
    editingValidationIdx: number | null;
    stop: any;
    setDirection: (dir: number) => void;
    setView: (view: ViewType) => void;
    setSelectedValidationType: (type: 'photo' | 'code' | null) => void;
    setEditingValidationIdx: (idx: number | null) => void;
    handleProductChange: (idx: number, field: string, value: any) => void;
}

const ValidationDetailView: React.FC<ValidationDetailViewProps> = ({
    direction,
    editingProductIdx,
    selectedValidationType,
    editingValidationIdx,
    stop,
    setDirection,
    setView,
    setSelectedValidationType,
    setEditingValidationIdx,
    handleProductChange
}) => {
    if (editingProductIdx === null) return null;
    const product = stop.actions?.[editingProductIdx] || {};

    // If no type selected, we are in "Choose Type" mode
    if (!selectedValidationType) {
        return (
            <motion.div
                key="validation-type-choice"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 flex flex-col bg-[#f8fafc] dark:bg-slate-950"
            >
                <div className={`flex items-center gap-4 p-6 border-b transition-colors ${stop.isPendingChange ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'}`}>
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('product');
                        }}
                        className="p-2 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-0.5">
                            New Rule
                        </span>
                        <h2 className="text-xl tracking-tight text-gray-900 dark:text-slate-100">Choose Type</h2>
                    </div>
                </div>

                <div className="flex-1 p-6 space-y-3">
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Select Type</h3>

                    <button
                        onClick={() => {
                            const photoValidations = Array.isArray(product.confirmation?.photo) ? product.confirmation.photo : [];
                            const newValidation = {
                                id: Date.now(),
                                name: 'New Photo Validation',
                                pickup: true,
                                delivery: true,
                                compare: false,
                                reference: null
                            };
                            handleProductChange(editingProductIdx, 'confirmation.photo', [...photoValidations, newValidation]);
                            setSelectedValidationType('photo');
                            setEditingValidationIdx(photoValidations.length);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-md  group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:text-white">
                                <Camera size={20} />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Photo Validation</span>
                                <span className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-tighter">Capture evidence</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 " />
                    </button>

                    <button
                        onClick={() => {
                            const codeValidations = Array.isArray(product.confirmation?.code) ? product.confirmation.code : [];
                            const newValidation = {
                                id: Date.now(),
                                name: 'New Code Scan',
                                pickup: true,
                                delivery: true,
                                compare: false,
                                reference: null
                            };
                            handleProductChange(editingProductIdx, 'confirmation.code', [...codeValidations, newValidation]);
                            setSelectedValidationType('code');
                            setEditingValidationIdx(codeValidations.length);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-md  group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:text-white">
                                <QrCode size={20} />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Code Scan</span>
                                <span className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-tighter">QR or Barcode</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 " />
                    </button>
                </div>
            </motion.div>
        );
    }

    // Edit Mode
    const rawValidations = product.confirmation?.[selectedValidationType];
    const validations = Array.isArray(rawValidations) ? rawValidations : [];
    const validation = validations[editingValidationIdx!] || {};
    const typeInfo = selectedValidationType === 'photo'
        ? { label: 'Photo', icon: Camera, color: 'emerald' }
        : { label: 'QR / Barcode', icon: QrCode, color: 'emerald' };

    const updateValidation = (field: string, value: any) => {
        const newValidations = [...validations];
        newValidations[editingValidationIdx!] = { ...validation, [field]: value };
        handleProductChange(editingProductIdx, `confirmation.${selectedValidationType}`, newValidations);
    };

    return (
        <motion.div
            key="validation-detail"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 flex flex-col bg-[#f8fafc] dark:bg-slate-950"
        >
            {/* Header */}
            <div className={`flex items-center gap-4 p-6 border-b transition-colors ${stop.isPendingChange ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'}`}>
                <button
                    onClick={() => {
                        setDirection(-1);
                        setView('product');
                    }}
                    className="p-2 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col">
                    <span className={`text-[10px] text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400 uppercase tracking-[0.2em] mb-0.5`}>
                        {validation.name || 'Validation Setting'}
                    </span>
                    <h2 className="text-xl tracking-tight text-gray-900 dark:text-slate-100">Configure Rules</h2>
                </div>
            </div>

            {/* Sub-Header / Name */}
            <div className="p-6 bg-white/50 dark:bg-slate-900/50 border-b border-gray-50 dark:border-slate-800">
                <EditableField
                    label="Validation Name"
                    value={validation.name || ''}
                    placeholder={`e.g. ${typeInfo.label} Produit`}
                    onChange={(val) => updateValidation('name', val)}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
                {/* Workflow */}
                <section>
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-1">Required Steps</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => updateValidation('pickup', !validation.pickup)}
                            className={`flex items-center gap-3 p-4 rounded-3xl border transition-all ${validation.pickup
                                ? `border-${typeInfo.color}-300 dark:border-${typeInfo.color}-500/50 bg-${typeInfo.color}-50 dark:bg-${typeInfo.color}-500/10 text-${typeInfo.color}-700 dark:text-${typeInfo.color}-300`
                                : 'border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500'
                                }`}
                        >
                            <ArrowUpRight size={18} className={validation.pickup ? `text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400` : ''} />
                            <span className="text-[11px] font-black uppercase tracking-widest">Pickup</span>
                        </button>
                        <button
                            onClick={() => updateValidation('delivery', !validation.delivery)}
                            className={`flex items-center gap-3 p-4 rounded-3xl border transition-all ${validation.delivery
                                ? `border-${typeInfo.color}-300 dark:border-${typeInfo.color}-500/50 bg-${typeInfo.color}-50 dark:bg-${typeInfo.color}-500/10 text-${typeInfo.color}-700 dark:text-${typeInfo.color}-300`
                                : 'border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500'
                                }`}
                        >
                            <ArrowDownLeft size={18} className={validation.delivery ? `text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400` : ''} />
                            <span className="text-[11px] font-black uppercase tracking-widest">Delivery</span>
                        </button>
                    </div>
                </section>

                {/* Comparison */}
                <section className="space-y-4">
                    <button
                        onClick={() => updateValidation('compare', !validation.compare)}
                        className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all ${validation.compare
                            ? `border-${typeInfo.color}-300 dark:border-${typeInfo.color}-500/50 bg-${typeInfo.color}-50 dark:bg-${typeInfo.color}-500/10 text-${typeInfo.color}-700 dark:text-${typeInfo.color}-300 shadow-sm`
                            : 'border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={20} className={validation.compare ? `text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400` : ''} />
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[12px] font-black uppercase tracking-widest">Compare Reference</span>
                                <span className="text-[9px] font-medium opacity-60">Validate input against a source of truth</span>
                            </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${validation.compare ? `bg-${typeInfo.color}-500` : 'bg-gray-200 dark:bg-slate-600'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${validation.compare ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {validation.compare && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pt-2"
                            >
                                {selectedValidationType === 'code' ? (
                                    <EditableField
                                        label="Reference Code Value"
                                        value={validation.reference || ''}
                                        placeholder="e.g. SKU-123456"
                                        onChange={(val) => updateValidation('reference', val)}
                                    />
                                ) : (
                                    <div className={`border-2 border-dashed rounded-3xl p-6 transition-colors flex flex-col items-center justify-center gap-3 ${validation.reference ? `border-${typeInfo.color}-200 dark:border-${typeInfo.color}-800 bg-${typeInfo.color}-50/30 dark:bg-${typeInfo.color}-900/10` : 'border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30'
                                        }`}>
                                        {validation.reference ? (
                                            <div className="flex items-center gap-4 w-full">
                                                <div className={`p-3 rounded-2xl bg-${typeInfo.color}-100 dark:bg-${typeInfo.color}-900/30 text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400`}>
                                                    <ImageIcon size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300 block truncate">reference_photo.jpg</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-black">Ready for comparison</span>
                                                </div>
                                                <button
                                                    onClick={() => updateValidation('reference', null)}
                                                    className="p-2 text-gray-300 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm text-gray-300 dark:text-slate-600">
                                                    <Upload size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">Reference Source Needed</p>
                                                    <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 px-4">Import the photo that the driver must match during the operation.</p>
                                                </div>
                                                <button
                                                    onClick={() => updateValidation('reference', 'mock_id')}
                                                    className={`mt-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 text-[11px] font-black uppercase text-gray-500 dark:text-slate-400 hover:border-${typeInfo.color}-300 dark:hover:border-${typeInfo.color}-700 hover:text-${typeInfo.color}-600 dark:hover:text-${typeInfo.color}-400 hover:shadow-lg transition-all`}
                                                >
                                                    Choose Reference Photo
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                <button
                    onClick={() => {
                        setDirection(-1);
                        setView('stop');
                    }}
                    className={`w-full py-4 text-[12px] font-black text-white bg-${typeInfo.color}-600 hover:bg-${typeInfo.color}-700 rounded-3xl uppercase tracking-widest shadow-lg shadow-${typeInfo.color}-200 dark:shadow-${typeInfo.color}-500/20 transition-all`}
                >
                    Continuer
                </button>
            </div>
        </motion.div >
    );
};

export default ValidationDetailView;
