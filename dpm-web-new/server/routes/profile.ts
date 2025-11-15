import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

let supabase: any = null;
const getSupabase = () => {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
};

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  quicketApiKey: z.string().optional(),
});

// Get current user profile
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: profile, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { firstName, lastName, quicketApiKey } = updateProfileSchema.parse(req.body);

    const updateData: any = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (quicketApiKey !== undefined) updateData.quicket_api_key = quicketApiKey;

    const { data: profile, error } = await getSupabase()
      .from('profiles')
      .update(updateData)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
