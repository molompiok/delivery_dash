import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Package, Trash2, Plus, User, Phone, Mail, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Euro, Boxes, Weight, Link as LinkIcon, Camera, QrCode, PenTool, AlertTriangle, ThermometerSnowflake, AlertCircle, Image as ImageIcon, FileText, CheckCircle2, ArrowUpRight, ArrowDownLeft, Upload, Save, Check, Calendar, ArrowRight, Droplets, Wrench, Timer, Map as MapIcon, RotateCcw, Search } from 'lucide-react';
import { GoogleMap, Marker } from '../../../../components/GoogleMap';
import LocationSearchBar from '../../../../components/LocationSearchBar';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import DatePicker from 'react-datepicker';
import { format, parseISO, isValid, set } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import EditableField from './EditableField';

interface SequentialDatePickerProps {
    label: string;
    value: string | null;
    onChange: (iso: string) => void;
    icon: any;
    color?: string;
}

interface Action {

}

const SequentialDatePicker: React.FC<SequentialDatePickerProps> = ({ label, value, onChange, icon: Icon, color = "blue" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'date' | 'time'>('date');
    const [tempDate, setTempDate] = useState<Date | null>(value ? parseISO(value) : null);

    const handleDateSelect = (date: Date | null) => {
        if (!date) return;
        setTempDate(date);
        setStep('time');
    };

    const handleTimeSelect = (time: Date | null) => {
        if (!time || !tempDate) return;
        const newDateTime = set(tempDate, {
            hours: time.getHours(),
            minutes: time.getMinutes(),
            seconds: 0,
            milliseconds: 0
        });
        onChange(newDateTime.toISOString());
        setIsOpen(false);
        // Reset step after a short delay to avoid jump during close animation
        setTimeout(() => setStep('date'), 300);
    };

    return (
        <div className="flex flex-col gap-1.5 relative">
            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 p-3 bg-white rounded-2xl border cursor-pointer group/date shadow-sm hover:shadow-md ${isOpen ? 'border-' + color + '-200 ring-2 ring-' + color + '-50' : 'border-gray-100'}`}
            >
                <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-' + color + '-600 text-white' : 'bg-' + color + '-50 text-' + color + '-600'}`}>
                    <Icon size={14} />
                </div>
                <div className="flex-1">
                    {value && isValid(parseISO(value)) ? (
                        <div className="flex flex-col leading-tight">
                            <span className="text-[11px] font-bold text-gray-900">{format(parseISO(value), 'dd MMM yyyy')}</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{format(parseISO(value), 'HH:mm')}</span>
                        </div>
                    ) : (
                        <span className="text-[11px] font-bold text-gray-300 italic">Select...</span>
                    )}
                </div>
            </div>

            {/* Use a portal-like approach within the panel context */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Shadow Backdrop within the panel */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-gray-900/40 backdrop-blur-[2px]"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        />

                        {/* Centered Modal */}
                        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[111]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="pointer-events-auto bg-white rounded-[32px] shadow-2xl border border-white/20 overflow-hidden w-[320px] mx-auto"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-5 border-b border-gray-50 bg-gray-50/30">
                                    <div className="flex items-center gap-2">
                                        {step === 'time' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setStep('date'); }}
                                                className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-0.5">
                                                {label}
                                            </span>
                                            <h4 className="text-[13px] font-bold text-gray-900 leading-none">
                                                {step === 'date' ? 'Choose Date' : 'Choose Time'}
                                            </h4>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                        className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-3 overflow-hidden flex justify-center bg-white">
                                    <AnimatePresence mode="wait">
                                        {step === 'date' ? (
                                            <motion.div
                                                key="date"
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: 20, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="w-full flex justify-center"
                                            >
                                                <DatePicker
                                                    selected={tempDate}
                                                    onChange={handleDateSelect}
                                                    inline
                                                    calendarClassName="sequential-picker-calendar"
                                                />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="time"
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: -20, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="w-full flex justify-center pb-4"
                                            >
                                                <DatePicker
                                                    selected={tempDate}
                                                    onChange={handleTimeSelect}
                                                    showTimeSelect
                                                    showTimeSelectOnly
                                                    timeIntervals={15}
                                                    timeCaption="Heure"
                                                    timeFormat="HH:mm"
                                                    dateFormat="HH:mm"
                                                    inline
                                                    calendarClassName="sequential-picker-calendar"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Progress dots */}
                                <div className="bg-gray-50/50 p-4 border-t border-gray-50 flex justify-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${step === 'date' ? 'bg-blue-600 w-4' : 'bg-gray-200'}`} />
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${step === 'time' ? 'bg-blue-600 w-4' : 'bg-gray-200'}`} />
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

interface StopDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    stop: any;
    order?: any;
    pathPrefix?: string;
    onUpdate: (updatedStop: any) => void;
    onDelete: () => void;
    onRestore?: () => void;
}

const StopDetailPanel: React.FC<StopDetailPanelProps> = ({
    isOpen,
    onClose,
    stop,
    order,
    onUpdate,
    onDelete,
    onRestore,
    pathPrefix
}) => {
    const [view, setView] = useState<'stop' | 'product' | 'validation-edit' | 'map'>('stop');
    const [direction, setDirection] = useState(0);
    const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);

    const hasError = (fieldPath: string) => {
        const fullPath = pathPrefix ? `${pathPrefix}.${fieldPath}` : fieldPath;
        return order?.validationErrors?.some((e: any) => e.path === fullPath);
    };

    const getErrorClass = (path: string) => {
        return hasError(path) ? 'bg-red-50 border-red-200 ring-red-100' : '';
    };

    // Map State
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 48.8566, lng: 2.3522 }); // Default Paris
    const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [editingProductIdx, setEditingProductIdx] = useState<number | null>(null);
    const [selectedValidationType, setSelectedValidationType] = useState<'photo' | 'code' | null>(null);
    const [editingValidationIdx, setEditingValidationIdx] = useState<number | null>(null);
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    // Deletion state
    const [isConfirmingStopDelete, setIsConfirmingStopDelete] = useState(false);
    const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setView('stop');
            setEditingProductIdx(null);
            setSelectedValidationType(null);
            setEditingValidationIdx(null);
            setConfirmDeleteKey(null);
        }
    }, [isOpen]);

    if (!stop) return null;

    const handleFieldChange = (fieldPath: string, value: any) => {
        const newData = { ...stop };
        const paths = fieldPath.split('.');
        let current = newData;
        for (let i = 0; i < paths.length - 1; i++) {
            if (!current[paths[i]]) current[paths[i]] = {};
            current = current[paths[i]];
        }
        current[paths[paths.length - 1]] = value;
        onUpdate(newData);
    };

    const handleProductChange = (idx: number, field: string, value: any) => {
        handleFieldChange(`actions.${idx}.${field}`, value);
    };

    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? '-100%' : '100%',
            opacity: 0,
        }),
    };

    const transition = {
        type: "spring" as const,
        damping: 30,
        stiffness: 450,
        mass: 0.8
    };

    const renderValidationDetailView = () => {
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
                    className="absolute inset-0 flex flex-col bg-[#f8fafc]"
                >
                    <div className="flex items-center gap-4 p-6 bg-white border-b border-gray-100">
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
                            <span className="text-[10px] text-purple-600 uppercase tracking-[0.2em] mb-0.5">
                                New Rule
                            </span>
                            <h2 className="text-xl tracking-tight">Choose Type</h2>
                        </div>
                    </div>

                    <div className="flex-1 p-6 space-y-3">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select Type</h3>

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
                            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-transparent hover:border-blue-200 hover:shadow-md  group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white ">
                                    <Camera size={20} />
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-sm font-bold text-gray-900">Photo Validation</span>
                                    <span className="text-[9px] text-gray-400 uppercase tracking-tighter">Capture evidence</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 " />
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
                            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-transparent hover:border-emerald-200 hover:shadow-md  group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white ">
                                    <QrCode size={20} />
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-sm font-bold text-gray-900">Code Scan</span>
                                    <span className="text-[9px] text-gray-400 uppercase tracking-tighter">QR or Barcode</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 " />
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
            ? { label: 'Photo', icon: Camera, color: 'blue' }
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
                className="absolute inset-0 flex flex-col bg-[#f8fafc]"
            >
                {/* Header */}
                <div className="flex items-center gap-4 p-6 bg-white border-b border-gray-100">
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
                        <span className={`text-[10px] text-${typeInfo.color}-600 uppercase tracking-[0.2em] mb-0.5`}>
                            {validation.name || 'Validation Setting'}
                        </span>
                        <h2 className="text-xl tracking-tight">Configure Rules</h2>
                    </div>
                </div>

                {/* Sub-Header / Name */}
                <div className="p-6 bg-white/50 border-b border-gray-50">
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
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Required Steps</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => updateValidation('pickup', !validation.pickup)}
                                className={`flex items-center gap-3 p-4 rounded-3xl border transition-all ${validation.pickup
                                    ? `border-${typeInfo.color}-300 bg-${typeInfo.color}-50 text-${typeInfo.color}-700`
                                    : 'border-gray-50 bg-white text-gray-400'
                                    }`}
                            >
                                <ArrowUpRight size={18} className={validation.pickup ? `text-${typeInfo.color}-600` : ''} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Pickup</span>
                            </button>
                            <button
                                onClick={() => updateValidation('delivery', !validation.delivery)}
                                className={`flex items-center gap-3 p-4 rounded-3xl border transition-all ${validation.delivery
                                    ? `border-${typeInfo.color}-300 bg-${typeInfo.color}-50 text-${typeInfo.color}-700`
                                    : 'border-gray-50 bg-white text-gray-400'
                                    }`}
                            >
                                <ArrowDownLeft size={18} className={validation.delivery ? `text-${typeInfo.color}-600` : ''} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Delivery</span>
                            </button>
                        </div>
                    </section>

                    {/* Comparison */}
                    <section className="space-y-4">
                        <button
                            onClick={() => updateValidation('compare', !validation.compare)}
                            className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all ${validation.compare
                                ? `border-${typeInfo.color}-300 bg-${typeInfo.color}-50 text-${typeInfo.color}-700 shadow-sm`
                                : 'border-gray-50 bg-white text-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={20} className={validation.compare ? `text-${typeInfo.color}-600` : ''} />
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-[12px] font-black uppercase tracking-widest">Compare Reference</span>
                                    <span className="text-[9px] font-medium opacity-60">Validate input against a source of truth</span>
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${validation.compare ? `bg-${typeInfo.color}-500` : 'bg-gray-200'}`}>
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
                                        <div className={`border-2 border-dashed rounded-3xl p-6 transition-colors flex flex-col items-center justify-center gap-3 ${validation.reference ? `border-${typeInfo.color}-200 bg-${typeInfo.color}-50/30` : 'border-gray-100 bg-gray-50/30'
                                            }`}>
                                            {validation.reference ? (
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className={`p-3 rounded-2xl bg-${typeInfo.color}-100 text-${typeInfo.color}-600`}>
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-bold text-gray-700 block truncate">reference_photo.jpg</span>
                                                        <span className="text-[10px] text-gray-400 uppercase font-black">Ready for comparison</span>
                                                    </div>
                                                    <button
                                                        onClick={() => updateValidation('reference', null)}
                                                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-white rounded-full shadow-sm text-gray-300">
                                                        <Upload size={32} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Reference Source Needed</p>
                                                        <p className="text-[9px] text-gray-400 mt-1 px-4">Import the photo that the driver must match during the operation.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => updateValidation('reference', 'mock_id')}
                                                        className={`mt-2 px-6 py-3 rounded-2xl bg-white border-2 border-gray-100 text-[11px] font-black uppercase text-gray-500 hover:border-${typeInfo.color}-300 hover:text-${typeInfo.color}-600 hover:shadow-lg transition-all`}
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
                <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('product');
                        }}
                        className={`w-full py-4 text-[12px] font-black text-white bg-${typeInfo.color}-600 hover:bg-${typeInfo.color}-700 rounded-3xl uppercase tracking-widest shadow-lg shadow-${typeInfo.color}-200 transition-all`}
                    >
                        Save Validation
                    </button>
                </div>
            </motion.div>
        );
    };
    const renderProductDetailView = () => {
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
                <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
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

                    {/* TODO: Add logic to save product to private enterprise catalogue */}
                    <button
                        onClick={() => {
                            if (product.productId) return; // Already saved
                            const mockId = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
                            handleProductChange(editingProductIdx, 'productId', mockId);
                        }}
                        disabled={!!product.productId}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${product.productId
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 shadow-sm shadow-blue-50'
                            }`}
                    >
                        {product.productId ? (
                            <>
                                <Check size={14} /> Catalogued
                            </>
                        ) : (
                            <>
                                <Save size={14} /> Save to Catalog
                            </>
                        )}
                    </button>
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

                            {/* Type Switcher Inline */}
                            <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-xl">
                                <button
                                    onClick={() => handleProductChange(editingProductIdx, 'type', 'pickup')}
                                    title="Pickup / Collect"
                                    className={`p-1.5 rounded-lg transition-all ${product.type === 'pickup'
                                        ? 'bg-white text-blue-600 shadow-sm shadow-blue-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <ArrowUpRight size={14} />
                                </button>
                                <button
                                    onClick={() => handleProductChange(editingProductIdx, 'type', 'delivery')}
                                    title="Delivery / Drop-off"
                                    className={`p-1.5 rounded-lg transition-all ${product.type === 'delivery'
                                        ? 'bg-white text-emerald-600 shadow-sm shadow-emerald-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <ArrowDownLeft size={14} />
                                </button>
                                <button
                                    onClick={() => handleProductChange(editingProductIdx, 'type', 'service')}
                                    title="Service / Work"
                                    className={`p-1.5 rounded-lg transition-all ${product.type === 'service'
                                        ? 'bg-white text-purple-600 shadow-sm shadow-purple-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <Wrench size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {product.type === 'delivery' ? (
                                <>
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                        <p className="text-[10px] text-emerald-600 font-medium mb-3">
                                            Delivery actions link to items already in transit. Specify the Item ID and quantity to drop off.
                                        </p>
                                        <EditableField
                                            label="Transit Item ID"
                                            value={product.transitItemId || ''}
                                            placeholder="ITEM-12345"
                                            onChange={(val) => handleProductChange(editingProductIdx, 'transitItemId', val)}
                                        />
                                    </div>
                                    <EditableField
                                        label="Quantity to Deliver"
                                        value={product.quantity || 1}
                                        type="number"
                                        onChange={(val) => handleProductChange(editingProductIdx, 'quantity', Number(val))}
                                    />
                                </>
                            ) : (
                                <>
                                    <EditableField
                                        label={product.type === 'service' ? "Service Name" : "Product Name"}
                                        value={product.productName || ''}
                                        placeholder={product.type === 'service' ? "Installation, Maintenance..." : "iPhone 15 Pro..."}
                                        onChange={(val) => handleProductChange(editingProductIdx, 'productName', val)}
                                        hasError={hasError(`actions[${editingProductIdx}].productName`)}
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
                                                    hasError={hasError(`actions[${editingProductIdx}].service_time`)}
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
                                                hasError={hasError(`actions[${editingProductIdx}].quantity`)}
                                            />
                                            <EditableField
                                                label="Price ($)"
                                                value={product.unitaryPrice || 0}
                                                type="number"
                                                onChange={(val) => handleProductChange(editingProductIdx, 'unitaryPrice', Number(val))}
                                            />
                                        </div>
                                    )}

                                    <EditableField
                                        label="Description"
                                        value={product.productDescription || ''}
                                        type="textarea"
                                        placeholder={product.type === 'service' ? "Service details..." : "Product description..."}
                                        onChange={(val) => handleProductChange(editingProductIdx, 'productDescription', val)}
                                        collapsible={true}
                                        collapseLimit={500}
                                        maxLength={500}
                                    />

                                    {product.type !== 'service' && (
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

                    {/* Logistics */}
                    {product.type === 'pickup' && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Boxes size={16} />
                                    </div>
                                    <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Dimensions & Weight</h3>
                                </div>

                                {/* Packaging Type Toggle */}
                                <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-xl">
                                    <button
                                        onClick={() => handleProductChange(editingProductIdx, 'packagingType', 'box')}
                                        className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${product.packagingType !== 'fluid'
                                            ? 'bg-white text-blue-600 shadow-sm shadow-blue-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <Boxes size={12} />
                                        Box
                                    </button>
                                    <button
                                        onClick={() => handleProductChange(editingProductIdx, 'packagingType', 'fluid')}
                                        className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${product.packagingType === 'fluid'
                                            ? 'bg-white text-blue-600 shadow-sm shadow-blue-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <Droplets size={12} />
                                        Fluide
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {product.packagingType === 'fluid' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">Weight (kg)</label>
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus-within:border-emerald-200 transition-all">
                                                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <Weight size={14} />
                                                </div>
                                                <input
                                                    type="number"
                                                    className="flex-1 bg-transparent text-sm font-bold text-gray-900 outline-none"
                                                    value={product.weight || 0}
                                                    onChange={(e) => handleProductChange(editingProductIdx, 'weight', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">Volume (L)</label>
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus-within:border-blue-200 transition-all">
                                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Droplets size={14} />
                                                </div>
                                                <input
                                                    type="number"
                                                    className="flex-1 bg-transparent text-sm font-bold text-gray-900 outline-none"
                                                    value={product.dimensions?.volume || 0}
                                                    onChange={(e) => handleProductChange(editingProductIdx, 'dimensions.volume', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Width', key: 'width', icon: ArrowRight },
                                                { label: 'Height', key: 'height', icon: ArrowUpRight },
                                                { label: 'Depth', key: 'depth', icon: ChevronDown },
                                            ].map((dim) => (
                                                <div key={dim.key} className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">{dim.label} (cm)</label>
                                                    <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus-within:border-emerald-200 transition-all">
                                                        <input
                                                            type="number"
                                                            className="flex-1 bg-transparent text-xs font-bold text-gray-900 outline-none text-center"
                                                            value={product.dimensions?.[dim.key] || 0}
                                                            onChange={(e) => handleProductChange(editingProductIdx, `dimensions.${dim.key}`, Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 font-bold">Weight (kg)</label>
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus-within:border-emerald-200 transition-all">
                                                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <Weight size={14} />
                                                </div>
                                                <input
                                                    type="number"
                                                    className="flex-1 bg-transparent text-sm font-bold text-gray-900 outline-none"
                                                    value={product.weight || 0}
                                                    onChange={(e) => handleProductChange(editingProductIdx, 'weight', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Requirements / Special Handling */}
                    {product.type === 'pickup' && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <AlertCircle size={16} />
                                </div>
                                <h3 className="text-[12px] uppercase tracking-widest text-gray-400 font-bold">Special Handling</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'froid', label: 'Cold Chain', icon: ThermometerSnowflake, activeClass: 'border-blue-500 bg-blue-50/50 text-blue-700', iconColor: 'text-blue-600' },
                                    { id: 'fragile', label: 'Fragile', icon: AlertCircle, activeClass: 'border-rose-500 bg-rose-50/50 text-rose-700', iconColor: 'text-rose-600' },
                                    { id: 'dangerous', label: 'Dangerous', icon: AlertTriangle, activeClass: 'border-orange-500 bg-orange-50/50 text-orange-700', iconColor: 'text-orange-600' },
                                    { id: 'sec', label: 'Dry / Ambient', icon: Package, activeClass: 'border-emerald-500 bg-emerald-50/50 text-emerald-700', iconColor: 'text-emerald-600' },
                                ].map((req) => {
                                    const isSelected = (product.requirements || []).includes(req.id);
                                    return (
                                        <button
                                            key={req.id}
                                            onClick={() => {
                                                const currentReqs = product.requirements || [];
                                                const newReqs = isSelected
                                                    ? currentReqs.filter((r: string) => r !== req.id)
                                                    : [...currentReqs, req.id];
                                                handleProductChange(editingProductIdx, 'requirements', newReqs);
                                            }}
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
                    )}

                    {/* Validation Rules */}
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
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('stop');
                        }}
                        className="flex-1 px-6 py-3 text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-200 transition-all"
                    >
                        Back to Stop
                    </button>
                </div>
            </motion.div>
        );
    };

    const renderMapSelectorView = () => {
        return (
            <motion.div
                key="map-selector"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 flex flex-col bg-[#f8fafc]"
            >
                {/* Floating Header */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-start gap-3 pointer-events-none">
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('stop');
                        }}
                        className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-700 hover:text-black hover:bg-white transition-all pointer-events-auto"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Floating Search Bar */}
                    <div className="flex-1 pointer-events-auto">
                        <LocationSearchBar
                            placeholder="Search address..."
                            onLocationSelect={(loc) => {
                                setMapCenter({ lat: loc.lat, lng: loc.lng });
                                setSelectedLocation({ lat: loc.lat, lng: loc.lng });
                            }}
                        />
                    </div>
                </div>

                {/* Map Body */}
                <div className="flex-1 relative bg-gray-100 z-0">
                    <GoogleMap
                        center={mapCenter}
                        zoom={15}
                        onCenterChanged={(center) => {
                            // Update selection as map moves
                            setSelectedLocation(center);
                            // Do NOT setMapCenter here to avoid jitter/loop
                        }}
                    >
                        {/* No Marker needed, we use the fixed center target */}

                        {/* Show existing stop location as a ghost/reference marker if distinct */}
                        {stop.address?.lat && stop.address?.lng && (
                            <Marker
                                position={{ lat: stop.address.lat, lng: stop.address.lng }}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 6,
                                    fillColor: "#94a3b8", // Gray ghost
                                    fillOpacity: 0.5,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 2,
                                }}
                            />
                        )}
                    </GoogleMap>

                    {/* Fixed Center Target */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center justify-center pb-8">
                        {/* Target Icon */}
                        <div className="relative">
                            <MapPin size={42} className="text-blue-600 drop-shadow-xl animate-bounce" fill="currentColor" />
                            <div className="w-1.5 h-1.5 bg-black/20 rounded-full blur-[2px] absolute bottom-[2px] left-1/2 -translate-x-1/2"></div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex gap-3 z-10">
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setView('stop');
                        }}
                        className="flex-1 px-6 py-3 text-[11px] font-black text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl uppercase tracking-widest transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (selectedLocation) {
                                handleFieldChange('address.lat', selectedLocation.lat);
                                handleFieldChange('address.lng', selectedLocation.lng);
                                // Optional: Reverse geocode here to update address text
                            }
                            setDirection(-1);
                            setView('stop');
                        }}
                        disabled={!selectedLocation}
                        className={`flex-[2] px-6 py-3 text-[11px] font-black text-white rounded-2xl uppercase tracking-widest shadow-lg transition-all ${selectedLocation
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                            : 'bg-gray-300 cursor-not-allowed shadow-none'
                            }`}
                    >
                        Select This Location
                    </button>
                </div>
            </motion.div>
        );
    };

    const renderStopListView = () => (
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
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsConfirmingStopDelete(true)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
                        title="Delete Stop"
                    >
                        <Trash2 size={20} />
                    </button>
                    {(stop.isPendingChange || (stop.actions && stop.actions.some((a: any) => a.isPendingChange))) && (
                        <button
                            onClick={() => setIsConfirmingRestore(true)}
                            className="p-2 hover:bg-orange-50 text-orange-400 hover:text-orange-600 rounded-xl transition-colors"
                            title="Restore stable version"
                        >
                            <RotateCcw size={20} />
                        </button>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                            Stop Details
                        </span>
                        <h2 className="text-xl tracking-tight line-clamp-1 break-all font-bold text-gray-900">
                            {stop.id}
                        </h2>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                    <ChevronRight size={22} />
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
                                {stop.address?.addressId && (
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">#{stop.address.addressId}</span>
                                )}
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
                                <><Check size={12} /> Saved</>
                            ) : (
                                <><Save size={12} /> Save Address</>
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
                                {stop.client?.clientId && (
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">#{stop.client.clientId}</span>
                                )}
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
                                <><Check size={12} /> Saved</>
                            ) : (
                                <><Save size={12} /> Save Client</>
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
                                            value={Math.floor(Number(stop.client?.opening?.duration || 0)) || ''}
                                            onChange={(e) => {
                                                const h = parseInt(e.target.value) || 0;
                                                const m = (Number(stop.client?.opening?.duration || 0) % 1) * 60;
                                                handleFieldChange('client.opening.duration', h + (m / 60));
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
                                            value={Math.round((Number(stop.client?.opening?.duration || 0) % 1) * 60) || ''}
                                            onChange={(e) => {
                                                const h = Math.floor(Number(stop.client?.opening?.duration || 0));
                                                const m = parseInt(e.target.value) || 0;
                                                handleFieldChange('client.opening.duration', h + (m / 60));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <SequentialDatePicker
                                label="Start Window"
                                value={stop.client?.opening?.start}
                                onChange={(iso) => handleFieldChange('client.opening.start', iso)}
                                icon={Calendar}
                                color="blue"
                            />
                            <SequentialDatePicker
                                label="End Window"
                                value={stop.client?.opening?.end}
                                onChange={(iso) => handleFieldChange('client.opening.end', iso)}
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
                                const newAction = {
                                    id: Date.now(),
                                    productName: stop.type === 'Pick-Up' ? 'Produit' : 'Service',
                                    quantity: 1,
                                    service_time: 10,
                                    packagingType: 'box',
                                    dimensions: { width: 0, height: 0, depth: 0, volume: 0 },
                                    weight: 0,
                                    unitaryPrice: 0,
                                    type: stop.type === 'Pick-Up' ? 'pickup' : 'service',
                                    requirements: [],
                                    status: 'Pending',
                                    secure: 'none'
                                };
                                const newActions = [...(stop.actions || []), newAction];
                                handleFieldChange('actions', newActions);
                                setEditingProductIdx(newActions.length - 1);
                                setDirection(1);
                                setView('product');
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

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 text-[11px] font-black text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl uppercase tracking-widest transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={onClose}
                    className="flex-[2] px-6 py-3 text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-200 transition-all"
                >
                    Done
                </button>
            </div>
        </motion.div>
    );

    return (
        <div>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <div
                        className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#f8fafc] shadow-2xl z-[101] flex flex-col border-l border-white/50 overflow-hidden"
                    >
                        {view === 'stop' ? (
                            renderStopListView()
                        ) : view === 'product' ? (
                            renderProductDetailView()
                        ) : view === 'validation-edit' ? (
                            renderValidationDetailView()
                        ) : (
                            renderMapSelectorView()
                        )}
                    </div>
                </>
            )}
            <ConfirmModal
                isOpen={isConfirmingStopDelete}
                onClose={() => setIsConfirmingStopDelete(false)}
                onConfirm={() => {
                    onDelete();
                    setIsConfirmingStopDelete(false);
                }}
                title="Supprimer cet arrêt ?"
                description="Cette action est irréversible. Toutes les informations associées seront perdues."
                confirmLabel="Supprimer"
                confirmVariant="danger"
            />
            <ConfirmModal
                isOpen={isConfirmingRestore}
                onClose={() => setIsConfirmingRestore(false)}
                onConfirm={() => {
                    onRestore?.();
                    setIsConfirmingRestore(false);
                }}
                title="Restaurer la version stable ?"
                description="Toutes les modifications en attente pour cet arrêt seront annulées."
                confirmLabel="Restaurer"
                confirmVariant="primary"
            />
        </div>
    );
};

export default StopDetailPanel;
