import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { DateTime } from 'luxon';
import { Schedule } from '../api/types';
import { Clock } from 'lucide-react';

const DAY_WIDTH = 140; // px per day column
const WEEKS_BUFFER = 12; // weeks before and after today

export interface ScheduleTimelineRef {
    scrollToDate: (date: DateTime) => void;
}

interface ScheduleTimelineProps {
    schedules: Schedule[];
    onScheduleClick: (schedule: Schedule) => void;
    onVisibleDateChange?: (date: DateTime) => void;
}

export const ScheduleTimeline = forwardRef<ScheduleTimelineRef, ScheduleTimelineProps>(function ScheduleTimeline({ schedules, onScheduleClick, onVisibleDateChange }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);

    // Generate a wide range of days centered on today
    const today = DateTime.now();
    const rangeStart = today.startOf('week').minus({ weeks: WEEKS_BUFFER });
    const totalDays = WEEKS_BUFFER * 2 * 7;
    const days = React.useMemo(
        () => Array.from({ length: totalDays }, (_, i) => rangeStart.plus({ days: i })),
        [rangeStart.toISODate(), totalDays]
    );

    // Sort schedules by priority descending
    const sorted = React.useMemo(
        () => [...schedules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
        [schedules]
    );

    // Scroll to a specific date (smooth)
    const scrollToDate = useCallback((date: DateTime) => {
        if (!scrollRef.current) return;
        const targetIndex = days.findIndex(d => d.hasSame(date, 'day'));
        if (targetIndex >= 0) {
            const scrollTo = targetIndex * DAY_WIDTH - scrollRef.current.clientWidth / 2 + DAY_WIDTH / 2;
            scrollRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
        }
    }, [days]);

    // Expose scrollToDate to parent via ref
    useImperativeHandle(ref, () => ({ scrollToDate }), [scrollToDate]);

    // Auto-scroll to today on mount
    useEffect(() => {
        if (scrollRef.current && !hasScrolled) {
            const todayIndex = days.findIndex(d => d.hasSame(today, 'day'));
            if (todayIndex >= 0) {
                const scrollTo = todayIndex * DAY_WIDTH - scrollRef.current.clientWidth / 2 + DAY_WIDTH / 2;
                scrollRef.current.scrollLeft = Math.max(0, scrollTo);
            }
            setHasScrolled(true);
        }
    }, [days, hasScrolled]);

    // Track visible center date for header display
    const handleScroll = useCallback(() => {
        if (!scrollRef.current || !onVisibleDateChange) return;
        const centerIndex = Math.floor((scrollRef.current.scrollLeft + scrollRef.current.clientWidth / 2) / DAY_WIDTH);
        const clampedIndex = Math.max(0, Math.min(centerIndex, days.length - 1));
        onVisibleDateChange(days[clampedIndex]);
    }, [days, onVisibleDateChange]);

    const totalWidth = totalDays * DAY_WIDTH;
    const bodyHeight = Math.max(400, sorted.length * 88 + 16);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
            {/* Scrollable container — header + body scroll together horizontally */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar"
                style={{ scrollBehavior: 'auto' }}
            >
                <div style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
                    {/* Days Header — sticky top */}
                    <div className="flex sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                        {days.map((day, i) => {
                            const isToday = day.hasSame(today, 'day');
                            const isFirstOfMonth = day.day === 1;
                            const isSunday = day.weekday === 7;
                            return (
                                <div
                                    key={i}
                                    className={`py-3 px-1 text-center flex-shrink-0 border-r transition-colors
                    ${isToday ? 'bg-emerald-50/80 dark:bg-emerald-500/8' : ''}
                    ${isSunday ? 'border-r-slate-200 dark:border-r-slate-700' : 'border-r-slate-100 dark:border-r-slate-800/50'}
                  `}
                                    style={{ width: `${DAY_WIDTH}px` }}
                                >
                                    {isFirstOfMonth && (
                                        <div className="text-[8px] font-black uppercase tracking-[0.25em] text-indigo-500 mb-0.5">
                                            {day.setLocale('fr').toFormat('MMMM yyyy')}
                                        </div>
                                    )}
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {day.setLocale('fr').toFormat('ccc')}
                                    </div>
                                    <div className={`text-lg font-black transition-all inline-flex items-center justify-center
                    ${isToday ? 'text-emerald-500 bg-emerald-500/10 w-9 h-9 rounded-xl' : 'text-slate-900 dark:text-white'}
                  `}>
                                        {day.day}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Body — schedule blocks */}
                    <div className="relative" style={{ height: `${bodyHeight}px` }}>
                        {/* Grid lines for day separators */}
                        <div className="absolute inset-0 flex pointer-events-none z-0">
                            {days.map((day, i) => {
                                const isSunday = day.weekday === 7;
                                return (
                                    <div
                                        key={i}
                                        className={`flex-shrink-0 border-r ${isSunday ? 'border-r-slate-200/60 dark:border-r-slate-700/60' : 'border-r-slate-50 dark:border-r-slate-800/30'}`}
                                        style={{ width: `${DAY_WIDTH}px` }}
                                    />
                                );
                            })}
                        </div>

                        {/* Today indicator line */}
                        {(() => {
                            const todayIndex = days.findIndex(d => d.hasSame(today, 'day'));
                            if (todayIndex < 0) return null;
                            return (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/30 z-[5] pointer-events-none"
                                    style={{ left: `${todayIndex * DAY_WIDTH + DAY_WIDTH / 2}px` }}
                                >
                                    <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                            );
                        })()}

                        {/* Schedule blocks */}
                        {sorted.flatMap((schedule, rowIndex) => {
                            const positions = getBlockPositions(schedule, days);
                            return positions.map((pos, posIdx) => (
                                <ScheduleBlock
                                    key={`${schedule.id || rowIndex}-${posIdx}`}
                                    schedule={schedule}
                                    top={rowIndex * 88 + 8}
                                    leftPx={pos.leftPx}
                                    widthPx={pos.widthPx}
                                    onClick={() => onScheduleClick(schedule)}
                                />
                            ));
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});

/** Compute positions (leftPx, widthPx) — may return multiple for WEEKLY */
function getBlockPositions(schedule: Schedule, days: DateTime[]): { leftPx: number; widthPx: number }[] {
    if (days.length === 0) return [];

    const viewStart = days[0];
    const viewEnd = days[days.length - 1];

    // WEEKLY: one block per selected day across the entire visible range
    if (schedule.recurrenceType === 'WEEKLY' && schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        const results: { leftPx: number; widthPx: number }[] = [];
        for (const dow of schedule.daysOfWeek) {
            // dow uses JS getDay() convention: 0=Sunday, 1=Monday, ..., 6=Saturday
            days.forEach((d, idx) => {
                if (d.toJSDate().getDay() === dow) {
                    results.push({ leftPx: idx * DAY_WIDTH, widthPx: DAY_WIDTH });
                }
            });
        }
        return results;
    }

    let blockStart: DateTime;
    let blockEnd: DateTime;

    if (schedule.recurrenceType === 'DATE_RANGE' && schedule.startDate && schedule.endDate) {
        blockStart = DateTime.fromISO(schedule.startDate);
        blockEnd = DateTime.fromISO(schedule.endDate);
    } else if (schedule.recurrenceType === 'SPECIFIC_DATE' && schedule.specificDate) {
        blockStart = DateTime.fromISO(schedule.specificDate);
        blockEnd = blockStart;
    } else {
        return [];
    }

    // Clamp to visible range
    if (blockEnd < viewStart || blockStart > viewEnd) return [];
    const clampedStart = blockStart < viewStart ? viewStart : blockStart;
    const clampedEnd = blockEnd > viewEnd ? viewEnd : blockEnd;

    const startIndex = days.findIndex(d => d.hasSame(clampedStart, 'day'));
    const endIndex = days.findIndex(d => d.hasSame(clampedEnd, 'day'));
    const safeStart = startIndex === -1 ? 0 : startIndex;
    const safeEnd = endIndex === -1 ? days.length - 1 : endIndex;
    const span = safeEnd - safeStart + 1;

    return [{
        leftPx: safeStart * DAY_WIDTH,
        widthPx: span * DAY_WIDTH,
    }];
}

/* ─── Individual Schedule Block ─────────────────────────────────────── */

function ScheduleBlock({
    schedule,
    top,
    leftPx,
    widthPx,
    onClick
}: {
    schedule: Schedule;
    top: number;
    leftPx: number;
    widthPx: number;
    onClick: () => void;
}) {
    const color = schedule.color || '#10b981';
    const allUsers = schedule.assignedUsers || [];
    // Deduplicate by ID
    const users = Array.from(new Map(allUsers.map(u => [u.id, u])).values());
    const visibleUsers = users.slice(0, 3);
    const extraCount = Math.max(0, users.length - 3);
    const isWide = widthPx > DAY_WIDTH * 1.5;

    return (
        <div
            className="absolute z-10 px-1.5 group/block"
            style={{
                top: `${top}px`,
                left: `${leftPx}px`,
                width: `${widthPx}px`,
                height: '80px',
            }}
        >
            <div
                onClick={onClick}
                className="h-full w-full rounded-2xl p-3.5 cursor-pointer shadow-md hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all relative overflow-hidden border border-white/20 flex flex-col justify-between"
                style={{
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                }}
            >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/15 blur-2xl rounded-full -mr-8 -mt-8 group-hover/block:scale-150 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-black/10 blur-xl rounded-full -ml-4 -mb-4" />

                {/* Top row: title + time */}
                <div className="flex items-start justify-between gap-2 relative z-10">
                    <div className="min-w-0 flex-1">
                        <h4 className="text-[12px] font-black text-white uppercase tracking-tight truncate leading-tight">
                            {schedule.title || 'Sans titre'}
                        </h4>
                        {isWide && (
                            <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-0.5 truncate">
                                {schedule.startTime} – {schedule.endTime}
                            </p>
                        )}
                    </div>
                    {schedule.scheduleType && (
                        <span className="flex-shrink-0 text-[7px] font-black text-white/80 bg-white/15 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                            {schedule.scheduleType}
                        </span>
                    )}
                </div>

                {/* Bottom row: user avatars */}
                <div className="flex items-center justify-between relative z-10 mt-auto">
                    <div className="flex items-center -space-x-2">
                        {visibleUsers.map((user, i) => (
                            <div
                                key={user.id || i}
                                className="w-7 h-7 rounded-full bg-white/90 border-2 border-white/30 flex items-center justify-center text-[10px] font-black shadow-sm"
                                style={{ color, zIndex: 3 - i }}
                                title={user.fullName}
                            >
                                {user.fullName?.charAt(0) || '?'}
                            </div>
                        ))}
                        {extraCount > 0 && (
                            <div className="w-7 h-7 rounded-full bg-white/30 border-2 border-white/20 flex items-center justify-center text-[9px] font-black text-white backdrop-blur-sm">
                                +{extraCount}
                            </div>
                        )}
                    </div>
                    {!isWide && (
                        <div className="flex items-center gap-1 text-white/60">
                            <Clock size={10} />
                            <span className="text-[8px] font-bold uppercase tracking-wider">
                                {schedule.startTime}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
