import React from 'react';
import { Schedule, ScheduleCategory } from '../api/types';
import { UserAvatarGroup } from './UserAvatarGroup';
import * as Icons from 'lucide-react';

interface ScheduleBlockProps {
    schedule: Schedule;
    size: 'small' | 'medium' | 'large';
    onClick?: () => void;
}

export function ScheduleBlock({ schedule, size, onClick }: ScheduleBlockProps) {
    const IconComponent = getIconComponent(schedule.icon);
    const bgColor = schedule.color || getCategoryColor(schedule.scheduleCategory || 'WORK');

    return (
        <div
            className={`schedule-block rounded-lg cursor-pointer transition-all hover:shadow-md ${getSizeClasses(size)}`}
            style={{ backgroundColor: bgColor }}
            onClick={onClick}
        >
            {size === 'small' && (
                <div className="flex items-center justify-center h-full">
                    <IconComponent size={16} className="text-white" />
                </div>
            )}

            {size === 'medium' && (
                <div className="p-2">
                    <IconComponent size={18} className="text-white mb-1" />
                    <div className="text-xs text-white font-medium truncate">
                        {schedule.title || 'Horaire'}
                    </div>
                </div>
            )}

            {size === 'large' && (
                <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <IconComponent size={20} className="text-white" />
                        <div className="text-sm text-white font-semibold truncate flex-1">
                            {schedule.title || 'Horaire'}
                        </div>
                    </div>
                    <div className="text-xs text-white/80 mb-2">
                        {schedule.startTime} - {schedule.endTime}
                    </div>
                    {schedule.assignedUsers && schedule.assignedUsers.length > 0 && (
                        <UserAvatarGroup users={schedule.assignedUsers} max={3} size="sm" />
                    )}
                </div>
            )}
        </div>
    );
}

function getSizeClasses(size: 'small' | 'medium' | 'large'): string {
    switch (size) {
        case 'small':
            return 'p-1 min-h-[32px]';
        case 'medium':
            return 'min-h-[60px]';
        case 'large':
            return 'min-h-[100px]';
    }
}

function getIconComponent(iconName?: string): React.ComponentType<any> {
    if (!iconName) return Icons.Calendar;

    // Map icon names to Lucide components
    const iconMap: Record<string, any> = {
        'Briefcase': Icons.Briefcase,
        'Calendar': Icons.Calendar,
        'Plane': Icons.Plane,
        'Coffee': Icons.Coffee,
        'Users': Icons.Users,
        'Clock': Icons.Clock,
        'MapPin': Icons.MapPin,
        'Home': Icons.Home,
    };

    return iconMap[iconName] || Icons.Calendar;
}

function getCategoryColor(category: ScheduleCategory): string {
    switch (category) {
        case 'WORK':
            return '#3B82F6'; // Blue
        case 'LEAVE':
            return '#F59E0B'; // Amber
        case 'MANAGEMENT':
            return '#8B5CF6'; // Purple
        default:
            return '#6B7280'; // Gray
    }
}
