import React, { useState, useEffect, useRef } from 'react';
import { Edit3, ChevronDown, ChevronUp } from 'lucide-react';

interface EditableFieldProps {
    value: string | number;
    onChange: (value: string) => void;
    label?: string;
    type?: 'text' | 'number' | 'time' | 'textarea';
    placeholder?: string;
    className?: string;
    maxLength?: number;
    collapsible?: boolean;
    collapseLimit?: number;
}

const EditableField: React.FC<EditableFieldProps> = ({
    value,
    onChange,
    label,
    type = 'text',
    placeholder,
    className = '',
    maxLength = 250,
    collapsible = false,
    collapseLimit = 500
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(String(value));
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const isEmpty = !value && value !== 0;

    useEffect(() => {
        setTempValue(String(value));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (tempValue !== String(value)) {
            onChange(tempValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            handleBlur();
        }
        if (e.key === 'Escape') {
            setTempValue(String(value));
            setIsEditing(false);
        }
    };

    const displayValue = tempValue || placeholder || 'Not set';
    const isCollapsibleOverLimit = collapsible && displayValue.length > collapseLimit;

    // For non-collapsible fields, still truncate if they are long (avoid overflow)
    const isGeneralOverLimit = !collapsible && type !== 'textarea' && displayValue.length > 40;

    const truncatedValue = (isCollapsibleOverLimit && !isExpanded)
        ? displayValue.slice(0, collapseLimit) + '...'
        : (isGeneralOverLimit ? displayValue.slice(0, 40) + '...' : displayValue);

    // Determine if we should show input mode
    const showInput = isEditing || isEmpty;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-[10px] uppercase tracking-widest px-1">
                    {label}
                </label>
            )}
            <div
                className={`group relative min-h-[38px] flex items-center transition-all ${isEditing ? 'z-10' : ''}`}
            >
                {showInput ? (
                    type === 'textarea' ? (
                        <textarea
                            ref={inputRef as any}
                            className={`w-full bg-white dark:bg-slate-900 rounded-xl p-2.5 text-sm font-bold text-gray-900 dark:text-slate-100 outline-none min-h-[80px] resize-none transition-all ${isEditing
                                ? 'border-2 border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10'
                                : 'border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:border-2 focus:shadow-lg focus:shadow-blue-500/10'
                                }`}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onFocus={() => setIsEditing(true)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            maxLength={maxLength}
                        />
                    ) : (
                        <input
                            ref={inputRef as any}
                            type={type}
                            className={`w-full bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-slate-100 outline-none transition-all ${isEditing
                                ? 'border-2 border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10'
                                : 'border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:border-2 focus:shadow-lg focus:shadow-blue-500/10'
                                }`}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onFocus={() => setIsEditing(true)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            maxLength={maxLength}
                        />
                    )
                ) : (
                    <div
                        className="w-full flex flex-col rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-700 transition-all cursor-pointer group/field"
                        onClick={() => setIsEditing(true)}
                    >
                        <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-slate-100 break-words flex-1">
                                {truncatedValue}
                            </span>
                            <Edit3
                                size={14}
                                className="text-gray-300 dark:text-slate-600 opacity-0 group-hover/field:opacity-100 transition-opacity ml-2 shrink-0"
                            />
                        </div>
                        {isCollapsibleOverLimit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="flex items-center gap-1 px-3 pb-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                            >
                                {isExpanded ? (
                                    <>See less <ChevronUp size={12} /></>
                                ) : (
                                    <>See more <ChevronDown size={12} /></>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditableField;

