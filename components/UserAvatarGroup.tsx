import React from 'react';
import { User } from '../api/types';

interface UserAvatarGroupProps {
    users: User[];
    max?: number; // Maximum number of avatars to display (default: 3)
    size?: 'sm' | 'md' | 'lg';
}

export function UserAvatarGroup({ users, max = 3, size = 'md' }: UserAvatarGroupProps) {
    const displayedUsers = users.slice(0, max);
    const remainingCount = users.length - max;

    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm'
    };

    const sizeClass = sizeClasses[size];

    return (
        <div className="flex items-center -space-x-2">
            {displayedUsers.map((user) => (
                <div
                    key={user.id}
                    className={`${sizeClass} rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center font-semibold text-white shadow-sm`}
                    title={user.fullName}
                >
                    {getInitials(user.fullName)}
                </div>
            ))}

            {remainingCount > 0 && (
                <div
                    className={`${sizeClass} rounded-full bg-gray-200 border-2 border-white flex items-center justify-center font-semibold text-gray-600 shadow-sm`}
                    title={`+${remainingCount} more`}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
}

function getInitials(name: string): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
