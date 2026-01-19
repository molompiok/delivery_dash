import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: LucideIcon;
    };
    variant?: 'default' | 'error' | 'warning';
}

export function EmptyState({ icon: Icon, title, description, action, variant = 'default' }: EmptyStateProps) {
    const iconColors = {
        default: 'bg-emerald-50 text-emerald-600',
        error: 'bg-red-50 text-red-600',
        warning: 'bg-amber-50 text-amber-600'
    };

    const actionColors = {
        default: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        error: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white'
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className={`w-20 h-20 ${iconColors[variant]} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                <Icon size={40} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                {description}
            </p>

            {action && (
                action.href ? (
                    <a
                        href={action.href}
                        className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${actionColors[variant]}`}
                    >
                        {action.icon && <action.icon size={20} className="mr-2" />}
                        {action.label}
                    </a>
                ) : (
                    <button
                        onClick={action.onClick}
                        className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${actionColors[variant]}`}
                    >
                        {action.icon && <action.icon size={20} className="mr-2" />}
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}
