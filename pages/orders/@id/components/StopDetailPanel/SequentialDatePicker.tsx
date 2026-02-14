import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format, parseISO, isValid, set } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { SequentialDatePickerProps } from './types';

const SequentialDatePicker: React.FC<SequentialDatePickerProps> = ({ label, value, onChange, icon: Icon, color = "emerald" }) => {
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
            <label className="text-[10px] uppercase tracking-widest px-1 text-gray-400 dark:text-slate-500 font-bold">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer group/date shadow-sm hover:shadow-md ${isOpen ? 'border-' + color + '-200 dark:border-' + color + '-500/50 ring-2 ring-' + color + '-50 dark:ring-' + color + '-500/10' : 'border-gray-100 dark:border-slate-800'}`}
            >
                <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-' + color + '-600 text-white' : 'bg-' + color + '-50 dark:bg-' + color + '-500/10 text-' + color + '-600 dark:text-' + color + '-400'}`}>
                    <Icon size={14} />
                </div>
                <div className="flex-1">
                    {value && isValid(parseISO(value)) ? (
                        <div className="flex flex-col leading-tight">
                            <span className="text-[11px] font-bold text-gray-900 dark:text-slate-100">{format(parseISO(value), 'dd MMM yyyy')}</span>
                            <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{format(parseISO(value), 'HH:mm')}</span>
                        </div>
                    ) : (
                        <span className="text-[11px] font-bold text-gray-300 dark:text-slate-600 italic">Select...</span>
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
                            className="fixed inset-0 z-[110] bg-gray-900/40 dark:bg-black/60 backdrop-blur-[2px]"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        />

                        {/* Centered Modal */}
                        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[111]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="pointer-events-auto bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden w-[320px] mx-auto"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-5 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30">
                                    <div className="flex items-center gap-2">
                                        {step === 'time' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setStep('date'); }}
                                                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-200 transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-700"
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">
                                                {label}
                                            </span>
                                            <h4 className="text-[13px] font-bold text-gray-900 dark:text-slate-100 leading-none">
                                                {step === 'date' ? 'Choose Date' : 'Choose Time'}
                                            </h4>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                        className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-200 transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-700"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-3 overflow-hidden flex justify-center bg-white dark:bg-slate-900">
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
                                                    calendarClassName="sequential-picker-calendar dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
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
                                                    calendarClassName="sequential-picker-calendar dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Progress dots */}
                                <div className="bg-gray-50/50 dark:bg-slate-800/50 p-4 border-t border-gray-50 dark:border-slate-800 flex justify-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${step === 'date' ? 'bg-emerald-600 w-4' : 'bg-gray-200 dark:bg-slate-700'}`} />
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${step === 'time' ? 'bg-emerald-600 w-4' : 'bg-gray-200 dark:bg-slate-700'}`} />
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export { SequentialDatePicker };
export default SequentialDatePicker;

