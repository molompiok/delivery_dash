import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit3,
    Phone,
    MessageSquare,
    GripVertical,
    ChevronUp,
    ChevronDown,
    Clock,
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    ThermometerSnowflake,
    AlertCircle,
    Camera,
    QrCode,
    ShieldCheck,
    ChevronRight,
    ChevronDown as ChevronDownIcon,
    Wrench
} from 'lucide-react';

interface StopCardProps {
    stop: any;
    stopIdx: number;
    stepIdx: number;
    attributes?: any;
    listeners?: any;
    setNodeRef?: any;
    style?: any;
    isDragging?: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
    isAnyDragging?: boolean;
    onOpenDetail?: (stop: any) => void;
}

const StopCard = ({
    stop,
    stopIdx,
    stepIdx,
    attributes,
    listeners,
    setNodeRef,
    style,
    isDragging,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    isAnyDragging,
    onOpenDetail
}: StopCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleActions = isExpanded ? stop.actions : stop.actions.slice(0, 3);
    const hasMoreActions = stop.actions.length > 3;

    if (stop.isPending) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-white/50 rounded-[16px] p-4 border border-blue-100 flex flex-col items-center justify-center py-8 animate-pulse grayscale"
            >
                <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mb-3"></div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Création en cours...</div>
            </div>
        );
    }

    return (
        <motion.div
            layout={!isAnyDragging}
            initial={false}
            transition={isAnyDragging ? { type: false } : {
                type: "spring",
                stiffness: 40,
                damping: 20,
                mass: 2
            }}
            ref={setNodeRef}
            style={style}
            key={stop.id}
            onClick={() => onOpenDetail?.(stop)}
            className={`bg-white rounded-[16px] p-4 shadow-sm border flex flex-col transition-shadow cursor-default group relative ${isDragging ? 'opacity-50 shadow-2xl z-50 ring-2 ring-blue-500/20' : 'hover:shadow-md'
                } ${stop.isPendingChange ? 'bg-emerald-50/80 border-emerald-100 shadow-emerald-500/5' : 'border-gray-50'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Drag & Reorder Zone */}
                    <div className="relative group/reorder shrink-0">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1 -ml-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors"
                            title="Drag to reorder"
                        >
                            <GripVertical size={18} />
                        </div>

                        {/* Manual Reorder Arrows (Absolute) */}
                        {!isFirst && onMoveUp && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                                className="absolute -top-3 -left-2 p-0.5 bg-white border border-gray-100 rounded-full text-blue-500 opacity-0 group-hover/reorder:opacity-100 hover:bg-blue-50 transition-all shadow-sm z-30"
                                title="Move Up"
                            >
                                <ChevronUp size={12} />
                            </button>
                        )}
                        {!isLast && onMoveDown && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                                className="absolute -bottom-3 -left-2 p-0.5 bg-white border border-gray-100 rounded-full text-blue-500 opacity-0 group-hover/reorder:opacity-100 hover:bg-blue-50 transition-all shadow-sm z-30"
                                title="Move Down"
                            >
                                <ChevronDown size={12} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate tracking-tight">
                            {typeof stop.address === 'object' ? stop.address.street || 'En attente...' : (stop.address || "Indéfini")}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stop.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${stop.typeColor} whitespace-nowrap`}>
                        {stop.type}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenDetail?.(stop); }}
                        className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors shrink-0"
                    >
                        <Edit3 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {visibleActions.map((action: any, idx: number) => (
                        <motion.div
                            key={action.id || idx}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col gap-2 relative group/action overflow-hidden"
                        >
                            {/* Top Row: Product Name & Quantity & TypeIcon */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <ChevronRight size={14} />
                                    <span className="text-xs font-bold text-gray-900 truncate">{action.productName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {action.type === 'service' ? (
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                            {action.service_time || 10} min
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                            x{action.quantity}
                                        </span>
                                    )}
                                    <div className={`p-1 rounded-md ${action.type === 'pickup' ? 'bg-orange-50 text-orange-600' :
                                        action.type === 'delivery' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                        {action.type === 'pickup' ? <ArrowUpRight size={14} /> :
                                            action.type === 'delivery' ? <ArrowDownLeft size={14} /> :
                                                <Wrench size={14} />}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row: Requirements & Status & Secure */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    {action.requirements.map((req: string, i: number) => (
                                        <span key={i} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px]  uppercase tracking-tighter ${req === 'froid' ? 'bg-blue-50 text-blue-600' :
                                            req === 'fragile' ? 'bg-rose-50 text-rose-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {req === 'froid' && <ThermometerSnowflake size={10} />}
                                            {req === 'fragile' && <AlertCircle size={10} />}
                                            {req}
                                        </span>
                                    ))}
                                    {action.requirements.length === 0 && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[11px] uppercase tracking-tighter bg-gray-50 text-gray-400">Générique</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Secure Indicator */}
                                    {action.secure !== 'none' && (
                                        <div className="flex items-center gap-1 text-gray-400" title={`Validation by ${action.secure}`}>
                                            {action.secure === 'photo' ? <Camera size={14} /> : <QrCode size={14} />}
                                            <ShieldCheck size={12} className="text-blue-400" />
                                        </div>
                                    )}
                                    <span className={`text-[11px]  uppercase tracking-widest ${action.status === 'Pending' ? 'text-gray-400' : 'text-blue-600'}`}>
                                        {action.status}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {hasMoreActions && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-blue-100/50 mt-2"
                    >
                        <span>{isExpanded ? 'Show less' : `+ ${stop.actions.length - 3} actions`}</span>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <ChevronDownIcon size={14} />
                        </motion.div>
                    </button>
                )}
            </div>

            {/* Client info - Only show if name or phone exists */}
            {(stop.client.name || stop.client.phone) && (
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        {stop.client.avatar ? (
                            <img src={stop.client.avatar} alt={stop.client.name} className="w-8 h-8 rounded-full border border-gray-100 shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-blue-600 uppercase">
                                    {stop.client.name ? stop.client.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '?'}
                                </span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold text-gray-900 truncate">{stop.client.name || 'Sans Nom'}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-gray-400 uppercase shrink-0">Client</span>
                                {stop.estimatedTime && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-md shrink-0">
                                        <Clock size={10} />
                                        <span className="text-[9px] font-black">{stop.estimatedTime}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {stop.client.phone && (
                        <div className="flex gap-2 shrink-0">
                            <button className="p-2 bg-gray-50 text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                                <Phone size={14} />
                            </button>
                            <button className="p-2 bg-gray-50 text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                                <MessageSquare size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default StopCard;
