import React from 'react';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { CheckCircle2, Circle, X } from 'lucide-react';

interface ChecklistItem {
    id: keyof import('../services/OnboardingService').OnboardingChecklist;
    label: string;
    href: string;
    icon: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    {
        id: 'event_created',
        label: 'Create your first event',
        href: '/events/create',
        icon: '📅'
    },
    {
        id: 'floorplan_uploaded',
        label: 'Upload floorplan',
        href: '/map-editor',
        icon: '🗺️'
    },
    {
        id: 'sponsors_added',
        label: 'Add sponsors',
        href: '/events',
        icon: '👥'
    },
    {
        id: 'event_published',
        label: 'Publish event',
        href: '/events',
        icon: '🚀'
    }
];

export const OnboardingChecklist: React.FC = () => {
    const { checklist, shouldShow, dismiss } = useOnboarding();

    if (!shouldShow || !checklist) return null;

    const completedCount = Object.values(checklist).filter(Boolean).length;
    const totalCount = Object.keys(checklist).length;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        🎯 Getting Started with NavEaze
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Complete these steps to launch your first event
                    </p>
                </div>
                <button
                    onClick={dismiss}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{completedCount} of {totalCount} completed</span>
                    <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
                {CHECKLIST_ITEMS.map((item) => {
                    const isCompleted = checklist[item.id];

                    return (
                        <Link
                            key={item.id}
                            to={item.href}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isCompleted
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex-shrink-0">
                                {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                            <span className="text-2xl">{item.icon}</span>
                            <span className={`flex-1 text-sm font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                                }`}>
                                {item.label}
                            </span>
                            {!isCompleted && (
                                <span className="text-xs text-gray-500">→</span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Completion message */}
            {completedCount === totalCount && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                        🎉 Great job! You're all set to run your event.
                    </p>
                </div>
            )}
        </div>
    );
};
