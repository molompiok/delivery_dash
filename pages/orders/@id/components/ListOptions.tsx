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
}: ListOptionsProps) => {
    if (!step) return null;

    return (
        <div className="flex flex-row gap-2 mb-4 px-1 flex-shrink-0 min-h-[40px] items-center">
            {/* Left Section: Search or Search Input */}
            <div className="flex-1 min-w-0">
                {step.isSearchExpanded ? (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900 transition-all">
                        <Search size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search stops..."
                            className="bg-transparent border-none outline-none text-[11px] w-full text-gray-700 dark:text-slate-300 font-medium min-w-0"
                            value={step.searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                        />
                        <button
                            onClick={onToggleSearch}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 transition-colors shrink-0"
                        >
                            <ChevronLeftIcon size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onToggleSearch}
                        className="p-2.5 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all shadow-sm"
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
                        className="p-2.5 bg-white dark:bg-slate-900 text-rose-500 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-100 dark:hover:border-rose-900/40 transition-all shadow-sm"
                        title="Delete Empty Step"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
                {stopCount !== 0 && (
                    <button
                        onClick={onToggleLink}
                        className={`p-2.5 rounded-xl border transition-all shadow-sm ${step.isLinked
                            ? 'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-500 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20'
                            : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-emerald-500 dark:hover:text-emerald-400'
                            }`}
                        title={step.isLinked ? "Locked (Linked)" : "Unlocked (Not Linked)"}
                    >
                        {step.isLinked ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                )}
                
                {/* <button
                    onClick={onAdd}
                    className="flex items-center justify-center p-2.5 bg-[#d1fae5] dark:bg-emerald-500/20 text-[#059669] dark:text-emerald-400 rounded-2xl font-bold hover:bg-[#a7f3d0] dark:hover:bg-emerald-500/30 transition-colors shadow-sm"
                    title="Add Stop"
                >
                    <Plus size={18} />
                </button> */}
            </div>
        </div>
    );
};

export default ListOptions;
