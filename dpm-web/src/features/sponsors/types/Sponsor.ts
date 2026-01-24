// Sponsor type definitions
export type SponsorTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  event_id: string;
  booth_location?: string;
  signup_token?: string;
  signup_completed: boolean;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSponsorData {
  name: string;
  tier: SponsorTier;
  event_id: string;
  booth_location?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface SponsorSignupData {
  token: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  logo_url?: string;
}
