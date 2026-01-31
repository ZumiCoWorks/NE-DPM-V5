import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { onboardingService, type OnboardingChecklist } from '../services/OnboardingService';

export const useOnboarding = () => {
    const { user } = useAuth();
    const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        loadOnboarding();
    }, [user?.id]);

    const loadOnboarding = async () => {
        if (!user?.id) return;

        try {
            const [progress, isDismissed] = await Promise.all([
                onboardingService.getProgress(user.id),
                onboardingService.isDismissed(user.id)
            ]);

            setChecklist(progress);
            setDismissed(isDismissed);
        } catch (error) {
            console.error('Failed to load onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (item: keyof OnboardingChecklist, completed: boolean) => {
        if (!user?.id || !checklist) return;

        try {
            await onboardingService.updateChecklistItem(user.id, item, completed);
            setChecklist({ ...checklist, [item]: completed });
        } catch (error) {
            console.error('Failed to update checklist:', error);
        }
    };

    const dismiss = async () => {
        if (!user?.id) return;

        try {
            await onboardingService.dismissOnboarding(user.id);
            setDismissed(true);
        } catch (error) {
            console.error('Failed to dismiss onboarding:', error);
        }
    };

    const isComplete = checklist ? onboardingService.isComplete(checklist) : false;
    const shouldShow = !loading && !dismissed && checklist && !isComplete;

    return {
        checklist,
        loading,
        dismissed,
        isComplete,
        shouldShow,
        updateItem,
        dismiss
    };
};
