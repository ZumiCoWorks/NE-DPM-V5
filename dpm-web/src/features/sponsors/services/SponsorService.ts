import { supabase } from '../../../lib/supabase';
import type { Sponsor, CreateSponsorData, SponsorSignupData } from '../types/Sponsor';

export class SponsorService {
  /**
   * Register a new sponsor for an event
   */
  async registerSponsor(data: CreateSponsorData): Promise<Sponsor> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data: sponsor, error } = await supabase
      .from('sponsors')
      .insert({
        ...data,
        signup_token: crypto.randomUUID(),
        signup_completed: false
      })
      .select()
      .single();

    if (error) throw error;
    return sponsor as unknown as Sponsor;
  }

  /**
   * Get all sponsors for an event
   */
  async getEventSponsors(eventId: string): Promise<Sponsor[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Sponsor[];
  }

  /**
   * Generate sign-up link for sponsor
   */
  generateSignupLink(sponsorId: string, token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/sponsor/signup?token=${token}`;
  }

  /**
   * Verify sponsor signup token
   */
  async verifySponsorToken(token: string): Promise<Sponsor | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('signup_token', token)
      .eq('signup_completed', false)
      .single();

    if (error) return null;
    return data as unknown as Sponsor;
  }

  /**
   * Complete sponsor signup
   */
  async completeSponsorSignup(data: SponsorSignupData): Promise<Sponsor> {
    const sponsor = await this.verifySponsorToken(data.token);
    if (!sponsor) throw new Error('Invalid or expired signup token');
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data: updatedSponsor, error } = await supabase
      .from('sponsors')
      .update({
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        logo_url: data.logo_url,
        signup_completed: true
      })
      .eq('id', sponsor.id)
      .select()
      .single();

    if (error) throw error;
    return updatedSponsor as unknown as Sponsor;
  }

  /**
   * Update sponsor details
   */
  async updateSponsor(sponsorId: string, updates: Partial<Sponsor>): Promise<Sponsor> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('sponsors')
      .update(updates)
      .eq('id', sponsorId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Sponsor;
  }

  /**
   * Delete sponsor
   */
  async deleteSponsor(sponsorId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', sponsorId);

    if (error) throw error;
  }
}

export const sponsorService = new SponsorService();
