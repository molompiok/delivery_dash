import React from 'react';
import { Search, Lock, Unlock, Plus, ChevronLeft as ChevronLeftIcon, Trash2 } from 'lucide-react';

interface ListOptionsProps {
    step: any;
    stepIdx: number;
    stopCount: number;
    totalSteps: number;
    onSearch: (val: string) => void;
    onAdd: () => void;
    onToggleSearch: () => void;
    onToggleLink: () => void;
    onDelete: () => void;
}

const ListOptions = ({
    step,
    stepIdx,
    stopCount,
    totalSteps,
    onSearch,
    onAdd,
    onToggleSearch,
    onToggleLink,
    onDelete
}: ListOptionsProps) => (
    <div className="flex flex-row gap-2 mb-4 px-1 flex-shrink-0 min-h-[40px] items-center">
        {/* Left Section: Search or Search Input */}
        <div className="flex-1 min-w-0">
            {step.isSearchExpanded ? (
                <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search size={16} className="text-gray-400 shrink-0" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search stops..."
                        className="bg-transparent border-none outline-none text-[11px] w-full text-gray-700 font-medium min-w-0"
                        value={step.searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                    <button
                        onClick={onToggleSearch}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors shrink-0"
                    >
                        <ChevronLeftIcon size={16} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={onToggleSearch}
                    className="p-2.5 bg-white text-gray-400 rounded-xl border border-gray-100 hover:bg-gray-50 hover:text-blue-500 transition-all shadow-sm"
                    title="Search"
                >
                    <Search size={18} />
                </button>
            )}
        </div>

        {/* Right Section: Perpetual Icons */}
        <div className="flex items-center gap-2 shrink-0">
            {stopCount === 0 && totalSteps > 1 && (
                <button
                    onClick={onDelete}
                    className="p-2.5 bg-white text-rose-500 rounded-xl border border-gray-100 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
                    title="Delete Empty Step"
                >
                    <Trash2 size={18} />
                </button>
            )}
            {stopCount !== 0 && (
                <button
                    onClick={onToggleLink}
                    className={`p-2.5 rounded-xl border transition-all shadow-sm ${step.isLinked
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                        : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-blue-500'
                        }`}
                    title={step.isLinked ? "Locked (Linked)" : "Unlocked (Not Linked)"}
                >
                    {step.isLinked ? <Lock size={18} /> : <Unlock size={18} />}
                </button>
            )}
            <button
                onClick={onAdd}
                className="flex items-center justify-center p-2.5 bg-[#dbeafe] text-[#2563eb] rounded-2xl font-bold hover:bg-[#bfdbfe] transition-colors shadow-sm"
                title="Add Stop"
            >
                <Plus size={18} />
            </button>
        </div>
    </div>
);

export default ListOptions;
