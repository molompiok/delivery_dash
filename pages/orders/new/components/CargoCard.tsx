import React from 'react';
import { motion } from 'framer-motion';
import {
    MoreVertical,
    Phone,
    MessageSquare,
    GripVertical,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

interface CargoCardProps {
    cargo: any;
    cargoIdx: number;
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
}

const CargoCard = ({
    cargo,
    cargoIdx,
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
    isAnyDragging
}: CargoCardProps) => (
    <motion.div
        layout={!isAnyDragging}
        initial={false}
        transition={isAnyDragging ? { type: false } : {
            // Default transition for layout/permutations (Slow)
            type: "spring",
            stiffness: 40,
            damping: 20,
            mass: 2
        }}
        ref={setNodeRef}
        style={style}
        key={cargo.id}
        className={`bg-white rounded-[28px] p-4 shadow-sm border border-gray-50 flex flex-col gap-5 transition-shadow cursor-default group relative ${isDragging ? 'opacity-50 shadow-2xl z-50 ring-2 ring-blue-500/20' : 'hover:shadow-md'
            }`}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {/* Drag & Reorder Zone */}
                <div className="relative group/reorder">
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
                            className="absolute -top-3 left-1/2 -translate-x-1/2 p-0.5 bg-white border border-gray-100 rounded-full text-blue-500 opacity-0 group-hover/reorder:opacity-100 hover:bg-blue-50 transition-all shadow-sm z-30"
                            title="Move Up"
                        >
                            <ChevronUp size={12} />
                        </button>
                    )}
                    {!isLast && onMoveDown && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-0.5 bg-white border border-gray-100 rounded-full text-blue-500 opacity-0 group-hover/reorder:opacity-100 hover:bg-blue-50 transition-all shadow-sm z-30"
                            title="Move Down"
                        >
                            <ChevronDown size={12} />
                        </button>
                    )}
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase">Cargo ID: <span className="text-gray-500">{cargo.id}</span></h3>
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cargo.typeColor}`}>
                    {cargo.type}
                </span>
                <MoreVertical size={16} className="text-gray-400" />
            </div>
        </div>

        <div className="space-y-6 relative">
            <div className="absolute left-[5px] top-[10px] bottom-[10px] w-[1px] border-l-2 border-dashed border-gray-200"></div>
            {cargo.stops.map((stop: any, idx: number) => (
                <div key={idx} className="flex gap-4 relative">
                    <div className={`w-3 h-3 rounded-full border-2 bg-white mt-1 z-10 ${idx === 0 ? 'border-blue-600' : 'border-gray-400'}`}></div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-gray-900">{stop.date}</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{stop.time}</span>
                        </div>
                        <div className="text-xs font-bold text-gray-900 truncate">{stop.location}</div>
                        <div className="text-[10px] font-medium text-gray-400">{stop.address}</div>
                    </div>
                </div>
            ))}
        </div>

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src={cargo.client.avatar} alt={cargo.client.name} className="w-8 h-8 rounded-full border border-gray-100" />
                <div>
                    <div className="text-[11px] font-bold text-gray-900">{cargo.client.name}</div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase">Client</div>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="p-2 bg-gray-50 text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                    <Phone size={14} />
                </button>
                <button className="p-2 bg-gray-50 text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                    <MessageSquare size={14} />
                </button>
            </div>
        </div>
    </motion.div>
);

export default CargoCard;
