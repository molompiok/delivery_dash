import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatId } from '../../../../api/utils';
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
    Wrench,
    Truck,
    Loader2,
    CheckCircle2,
    XCircle,
    Snowflake
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
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isBlinking?: boolean;
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
    onOpenDetail,
    onMouseEnter,
    onMouseLeave,
    isBlinking
}: StopCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleActions = isExpanded ? stop.actions : stop.actions.slice(0, 3);
    const hasMoreActions = stop.actions.length > 3;

    if (stop.isPending) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-white/50 dark:bg-slate-900/50 rounded-[16px] p-4 border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center justify-center py-8 animate-pulse grayscale"
            >
                <div className="w-8 h-8 rounded-full border-2 border-emerald-200 dark:border-emerald-900/50 border-t-emerald-600 dark:border-t-emerald-400 animate-spin mb-3"></div>
                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Création en cours...</div>
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
            id={`stop-card-${stop.id}`}
            onClick={() => onOpenDetail?.(stop)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`bg-white dark:bg-slate-900 rounded-[16px] p-4 shadow-sm border flex flex-col transition-all cursor-default group relative ${isDragging ? 'opacity-50 shadow-2xl z-50 ring-2 ring-emerald-500/20' : 'hover:shadow-md'
                } ${stop.isPendingChange ? 'border-emerald-500 dark:border-emerald-400 border-2 shadow-emerald-500/10' : 'border-gray-50 dark:border-slate-800'} ${isBlinking ? 'ring-4 ring-orange-500/40 border-orange-500 shadow-orange-500/20 shadow-lg scale-[1.02] z-40 animate-bridged-blink' : ''}`}
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Drag & Reorder Zone */}
                    <div className="relative group/reorder shrink-0">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1 -ml-1 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors"
                            title="Drag to reorder"
                        >
                            <GripVertical size={18} />
                        </div>

                        {/* Manual Reorder Arrows (Absolute) */}
                        {!isFirst && onMoveUp && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                                className="absolute -top-3 -left-2 p-0.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-full text-emerald-500 dark:text-emerald-400 opacity-0 group-hover/reorder:opacity-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all shadow-sm z-30"
                                title="Move Up"
                            >
                                <ChevronUp size={12} />
                            </button>
                        )}
                        {!isLast && onMoveDown && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                                className="absolute -bottom-3 -left-2 p-0.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-full text-emerald-500 dark:text-emerald-400 opacity-0 group-hover/reorder:opacity-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all shadow-sm z-30"
                                title="Move Down"
                            >
                                <ChevronDown size={12} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate tracking-tight">
                            {typeof stop.address === 'object' ? stop.address.street || 'En attente...' : (stop.address || "Indéfini")}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest truncate">{formatId(stop.id)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        {stop.status === 'PENDING' && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                <Clock size={10} /> En attente
                            </span>
                        )}
                        {stop.status === 'COMPLETED' && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                <ShieldCheck size={10} /> Validé
                            </span>
                        )}
                        {stop.status === 'FAILED' && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                <AlertCircle size={10} /> Échec
                            </span>
                        )}
                        {stop.status === 'ARRIVED' && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                <Truck size={10} /> Arrivé
                            </span>
                        )}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenDetail?.(stop); }}
                        className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 transition-colors shrink-0"
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
                                    <div className={`shrink-0 ${action.status?.toUpperCase() === 'COMPLETED' ? 'text-emerald-500' :
                                        action.status?.toUpperCase() === 'FAILED' ? 'text-rose-500' :
                                            ['ARRIVED', 'IN_PROGRESS'].includes(action.status?.toUpperCase()) ? 'text-emerald-500' :
                                                action.status?.toUpperCase() === 'FROZEN' ? 'text-cyan-500' :
                                                    'text-slate-400'
                                        }`}>
                                        {action.status?.toUpperCase() === 'COMPLETED' ? <CheckCircle2 size={14} /> :
                                            action.status?.toUpperCase() === 'FAILED' ? <AlertCircle size={14} /> :
                                                ['ARRIVED', 'IN_PROGRESS'].includes(action.status?.toUpperCase()) ? <Loader2 size={14} className="animate-spin" /> :
                                                    action.status?.toUpperCase() === 'FROZEN' ? <Snowflake size={14} /> :
                                                        action.status?.toUpperCase() === 'CANCELLED' ? <XCircle size={14} /> :
                                                            <ChevronRight size={14} />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-slate-200 truncate">
                                        {(['pickup', 'delivery'].includes(action.type?.toLowerCase()) && action.transitItem?.name)
                                            ? action.transitItem.name
                                            : action.productName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {action.type === 'service' ? (
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                            {action.service_time || 10} min
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                            x{action.quantity}
                                        </span>
                                    )}
                                    <div className={`p-1 rounded-md ${action.type === 'pickup' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                                        action.type === 'delivery' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                            'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
                                        <span key={i} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] uppercase tracking-tighter ${req === 'froid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                            req === 'fragile' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                                'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                            }`}>
                                            {req === 'froid' && <ThermometerSnowflake size={10} />}
                                            {req === 'fragile' && <AlertCircle size={10} />}
                                            {req}
                                        </span>
                                    ))}
                                    {action.requirements.length === 0 && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[11px] uppercase tracking-tighter bg-gray-50 dark:bg-slate-800/10 text-gray-400 dark:text-slate-500">Générique</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Secure Indicator */}
                                    {action.secure !== 'none' && (
                                        <div className="flex items-center gap-1 text-gray-400 dark:text-slate-600" title={`Validation by ${action.secure}`}>
                                            {action.secure === 'photo' ? <Camera size={14} /> : <QrCode size={14} />}
                                            <ShieldCheck size={12} className="text-emerald-400 dark:text-emerald-500" />
                                        </div>
                                    )}
                                    <span className={`text-[11px] uppercase tracking-widest ${action.status === 'Pending' ? 'text-gray-400 dark:text-slate-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
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
                        className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all border border-emerald-100/50 dark:border-emerald-900/10 mt-2"
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
                <div className="pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between gap-2 mt-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {stop.client.avatar ? (
                            <img src={stop.client.avatar} alt={stop.client.name} className="w-8 h-8 rounded-full border border-gray-100 dark:border-slate-700 shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                                    {stop.client.name ? stop.client.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '?'}
                                </span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold text-gray-900 dark:text-slate-100 truncate">{stop.client.name || 'Sans Nom'}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase shrink-0">Client</span>
                                {stop.estimatedTime && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 rounded-md shrink-0">
                                        <Clock size={10} />
                                        <span className="text-[9px] font-black">{stop.estimatedTime}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {stop.client.phone && (
                        <div className="flex gap-2 shrink-0">
                            <button className="p-2 bg-gray-50 dark:bg-slate-800/50 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                                <Phone size={14} />
                            </button>
                            <button className="p-2 bg-gray-50 dark:bg-slate-800/50 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
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
