-- Add Quicket API key storage to profiles
-- Date: 2025-11-12

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quicket_api_key TEXT;

