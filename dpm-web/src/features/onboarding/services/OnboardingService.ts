import { supabase } from '../../../lib/supabase';

export interface OnboardingChecklist {
    event_created: boolean;
    floorplan_uploaded: boolean;
    sponsors_added: boolean;
    event_published: boolean;
}

export class OnboardingService {
    /**
     * Get user's onboarding progress
     */
    async getProgress(userId: string): Promise<OnboardingChecklist | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_checklist, onboarding_dismissed')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        return (data as any).onboarding_checklist as OnboardingChecklist;
    }

    /**
     * Check if onboarding is dismissed
     */
    async isDismissed(userId: string): Promise<boolean> {
        if (!supabase) return false;
        const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_dismissed')
            .eq('id', userId)
            .single();

        if (error || !data) return false;
        return (data as any).onboarding_dismissed || false;
    }

    /**
     * Update a checklist item
     */
    async updateChecklistItem(
        userId: string,
        item: keyof OnboardingChecklist,
        completed: boolean
    ): Promise<void> {
        if (!supabase) throw new Error('Supabase client not initialized');
        const progress = await this.getProgress(userId);
        if (!progress) return;

        const updated = { ...progress, [item]: completed };

        const { error } = await supabase
            .from('profiles')
            .update({ onboarding_checklist: updated } as any)
            .eq('id', userId);

        if (error) throw error;
    }

    /**
     * Dismiss onboarding checklist
     */
    async dismissOnboarding(userId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('profiles')
            .update({ onboarding_dismissed: true } as any)
            .eq('id', userId);

        if (error) throw error;
    }

    /**
     * Check if all items are completed
     */
    isComplete(checklist: OnboardingChecklist): boolean {
        return Object.values(checklist).every(value => value === true);
    }
}

export const onboardingService = new OnboardingService();
