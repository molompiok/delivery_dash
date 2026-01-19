import React, { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { scheduleService } from '../../../api/schedules';
import { Schedule, User } from '../../../api/types';
import { ScheduleBlock } from '../../../components/ScheduleBlock';
import { ScheduleDetailModal } from '../../../components/ScheduleDetailModal';

export default function Page() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('delivery_user');
        if (userStr) {
            const u = JSON.parse(userStr);
            setUser(u);
            loadSchedules(u.companyId);
        }
    }, [currentDate, view]);

    const loadSchedules = async (companyId: string) => {
        try {
            setIsLoading(true);
            const res = await scheduleService.getCalendarView({
                view,
                date: currentDate.toISOString(),
                ownerId: companyId,
                ownerType: 'Company'
            });
            setSchedules(res.data.schedules);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (view === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const getWeekDays = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay() + 1); // Monday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const weekDays = getWeekDays();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Horaires</h1>
                    <p className="text-gray-500">Gérez les horaires de travail, congés et réunions</p>
                </div>

                <button
                    onClick={() => window.location.href = '/schedules/new'}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700 transition"
                >
                    <Plus size={20} className="mr-2" />
                    Créer un horaire
                </button>
            </div>

            {/* View selector and navigation */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('day')}
                        className={`px-4 py-2 rounded-lg ${view === 'day' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        Jour
                    </button>
                    <button
                        onClick={() => setView('week')}
                        className={`px-4 py-2 rounded-lg ${view === 'week' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        Semaine
                    </button>
                    <button
                        onClick={() => setView('month')}
                        className={`px-4 py-2 rounded-lg ${view === 'month' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        Mois
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-lg font-semibold">
                        {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={() => navigateDate('next')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Aujourd'hui
                    </button>
                </div>
            </div>

            {/* Week View */}
            {view === 'week' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-8 border-b border-gray-200">
                        <div className="p-4 bg-gray-50"></div>
                        {weekDays.map((day, i) => (
                            <div key={i} className="p-4 bg-gray-50 text-center border-l border-gray-200">
                                <div className="text-xs text-gray-500 uppercase">
                                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg font-semibold ${day.toDateString() === new Date().toDateString() ? 'text-emerald-600' : 'text-gray-900'}`}>
                                    {day.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Time slots */}
                    <div className="grid grid-cols-8">
                        <div className="border-r border-gray-200">
                            {Array.from({ length: 24 }, (_, hour) => (
                                <div key={hour} className="h-16 border-b border-gray-100 p-2 text-xs text-gray-500 text-right">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {weekDays.map((day, dayIndex) => (
                            <div key={dayIndex} className="border-r border-gray-200 relative">
                                {Array.from({ length: 24 }, (_, hour) => (
                                    <div key={hour} className="h-16 border-b border-gray-100"></div>
                                ))}

                                {/* Render schedules for this day */}
                                {schedules
                                    .filter(s => {
                                        if (s.recurrenceType === 'WEEKLY') {
                                            return s.dayOfWeek === day.getDay();
                                        }
                                        return true;
                                    })
                                    .map((schedule, i) => {
                                        const startHour = parseInt(schedule.startTime.split(':')[0]);
                                        const startMin = parseInt(schedule.startTime.split(':')[1]);
                                        const endHour = parseInt(schedule.endTime.split(':')[0]);
                                        const endMin = parseInt(schedule.endTime.split(':')[1]);

                                        const top = (startHour * 64) + (startMin / 60 * 64);
                                        const height = ((endHour - startHour) * 64) + ((endMin - startMin) / 60 * 64);

                                        const size = height > 120 ? 'large' : height > 60 ? 'medium' : 'small';

                                        return (
                                            <div
                                                key={i}
                                                className="absolute left-1 right-1"
                                                style={{ top: `${top}px`, height: `${height}px` }}
                                            >
                                                <ScheduleBlock
                                                    schedule={schedule}
                                                    size={size}
                                                    onClick={() => setSelectedSchedule(schedule)}
                                                />
                                            </div>
                                        );
                                    })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Simple list view for day/month (placeholder) */}
            {view !== 'week' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="text-center text-gray-500">
                        <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>Vue {view === 'day' ? 'jour' : 'mois'} en cours de développement</p>
                        <p className="text-sm mt-2">Utilisez la vue semaine pour le moment</p>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedSchedule && (
                <ScheduleDetailModal
                    schedule={selectedSchedule}
                    onClose={() => setSelectedSchedule(null)}
                />
            )}
        </div>
    );
}
