import React from 'react';
import { Schedule, ScheduleLink } from '../api/types';
import { X, ExternalLink } from 'lucide-react';
import * as Icons from 'lucide-react';
import { UserAvatarGroup } from './UserAvatarGroup';

interface ScheduleDetailModalProps {
    schedule: Schedule;
    onClose: () => void;
}

export function ScheduleDetailModal({ schedule, onClose }: ScheduleDetailModalProps) {
    const IconComponent = getIconComponent(schedule.icon);
    const bgColor = schedule.color || getCategoryColor(schedule.scheduleCategory || 'WORK');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: bgColor }}
                    >
                        <IconComponent size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">{schedule.title || 'Horaire'}</h2>
                        <div className="text-sm text-gray-500 mt-1">
                            {getCategoryLabel(schedule.scheduleCategory || 'WORK')}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Description */}
                {schedule.description && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600">{schedule.description}</p>
                    </div>
                )}

                {/* Time */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Horaires</h3>
                    <div className="text-gray-600 font-mono">
                        {schedule.startTime} - {schedule.endTime}
                    </div>
                    {schedule.recurrenceType === 'WEEKLY' && schedule.dayOfWeek && (
                        <div className="text-sm text-gray-500 mt-1">
                            {getDayName(schedule.dayOfWeek)}
                        </div>
                    )}
                    {schedule.recurrenceType === 'DATE_RANGE' && schedule.startDate && schedule.endDate && (
                        <div className="text-sm text-gray-500 mt-1">
                            Du {schedule.startDate} au {schedule.endDate}
                        </div>
                    )}
                </div>

                {/* Assigned Users */}
                {schedule.assignedUsers && schedule.assignedUsers.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Assigné à ({schedule.assignedUsers.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {schedule.assignedUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold">
                                        {getInitials(user.fullName)}
                                    </div>
                                    <span className="text-sm text-gray-900">{user.fullName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Links */}
                {schedule.links && schedule.links.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Liens</h3>
                        <div className="space-y-2">
                            {schedule.links.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    <ExternalLink size={16} />
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Fermer
                    </button>
                    <a
                        href={`/schedules/${schedule.id}/edit`}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                    >
                        <Icons.Edit size={18} />
                        Modifier
                    </a>
                </div>
            </div>
        </div>
    );
}

function getIconComponent(iconName?: string): React.ComponentType<any> {
    if (!iconName) return Icons.Calendar;
    const iconMap: Record<string, any> = {
        'Briefcase': Icons.Briefcase,
        'Calendar': Icons.Calendar,
        'Plane': Icons.Plane,
        'Coffee': Icons.Coffee,
        'Users': Icons.Users,
        'Clock': Icons.Clock,
    };
    return iconMap[iconName] || Icons.Calendar;
}

function getCategoryColor(category: string): string {
    switch (category) {
        case 'WORK': return '#3B82F6';
        case 'LEAVE': return '#F59E0B';
        case 'MANAGEMENT': return '#8B5CF6';
        default: return '#6B7280';
    }
}

function getCategoryLabel(category: string): string {
    switch (category) {
        case 'WORK': return 'Horaire de travail';
        case 'LEAVE': return 'Congé';
        case 'MANAGEMENT': return 'Gestion';
        default: return 'Horaire';
    }
}

function getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getDayName(dayOfWeek: number): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayOfWeek] || '';
}
