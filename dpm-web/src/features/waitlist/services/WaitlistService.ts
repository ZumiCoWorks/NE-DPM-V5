import { supabase } from '../../../lib/supabase';

/**
 * Waitlist Service
 * Handles waitlist signups for NavEaze landing page
 */

export interface WaitlistSignup {
    id?: string;
    full_name: string;
    email: string;
    organization?: string;
    created_at?: string;
    updated_at?: string;
}

export class WaitlistService {
    /**
     * Add a new signup to the waitlist
     */
    static async addSignup(signup: Omit<WaitlistSignup, 'id' | 'created_at' | 'updated_at'>): Promise<{
        success: boolean;
        data?: WaitlistSignup;
        error?: string;
    }> {
        try {
            const { data, error } = await supabase
                .from('waitlist')
                .insert([
                    {
                        full_name: signup.full_name,
                        email: signup.email,
                        organization: signup.organization || null,
                    },
                ])
                .select()
                .single();

            if (error) {
                // Check for duplicate email
                if (error.code === '23505') {
                    return {
                        success: false,
                        error: 'This email is already on the waitlist.',
                    };
                }
                throw error;
            }

            return {
                success: true,
                data: data as WaitlistSignup,
            };
        } catch (error) {
            console.error('Error adding to waitlist:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to join waitlist. Please try again.',
            };
        }
    }

    /**
     * Get all waitlist signups (admin only)
     */
    static async getAllSignups(): Promise<{
        success: boolean;
        data?: WaitlistSignup[];
        error?: string;
    }> {
        try {
            const { data, error } = await supabase
                .from('waitlist')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: data as WaitlistSignup[],
            };
        } catch (error) {
            console.error('Error fetching waitlist:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch waitlist.',
            };
        }
    }

    /**
     * Check if an email is already on the waitlist
     */
    static async checkEmail(email: string): Promise<{
        success: boolean;
        exists?: boolean;
        error?: string;
    }> {
        try {
            const { data, error } = await supabase
                .from('waitlist')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;

            return {
                success: true,
                exists: !!data,
            };
        } catch (error) {
            console.error('Error checking email:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check email.',
            };
        }
    }
}
