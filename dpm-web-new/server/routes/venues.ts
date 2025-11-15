import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireAdmin, requireVenueManager, AuthenticatedRequest } from '../middleware/auth.js';

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
const createVenueSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  venueType: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const updateVenueSchema = createVenueSchema.partial();

// Get all venues (public)
router.get('/', async (req, res) => {
  try {
    const { data: venues, error } = await getSupabase()
      .from('venues')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(venues);
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ error: 'Failed to get venues' });
  }
});

// Get venue by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { data: venue, error } = await getSupabase()
      .from('venues')
      .select('*')
      .eq('id', req.params.id)
      .eq('status', 'active')
      .single();

    if (error) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({ error: 'Failed to get venue' });
  }
});

// Create venue (admin or venue manager)
router.post('/', authenticateToken, requireVenueManager, async (req: AuthenticatedRequest, res) => {
  try {
    const venueData = createVenueSchema.parse(req.body);

    const { data: venue, error } = await getSupabase()
      .from('venues')
      .insert([{
        name: venueData.name,
        address: venueData.address,
        description: venueData.description,
        capacity: venueData.capacity,
        venue_type: venueData.venueType,
        contact_email: venueData.contactEmail,
        contact_phone: venueData.contactPhone,
        organization_id: venueData.organizationId,
        status: venueData.status || 'active',
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(venue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Create venue error:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Update venue (admin or venue manager)
router.put('/:id', authenticateToken, requireVenueManager, async (req: AuthenticatedRequest, res) => {
  try {
    const venueData = updateVenueSchema.parse(req.body);

    const { data: venue, error } = await getSupabase()
      .from('venues')
      .update({
        name: venueData.name,
        address: venueData.address,
        description: venueData.description,
        capacity: venueData.capacity,
        venue_type: venueData.venueType,
        contact_email: venueData.contactEmail,
        contact_phone: venueData.contactPhone,
        organization_id: venueData.organizationId,
        status: venueData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(venue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Update venue error:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// Delete venue (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = await getSupabase()
      .from('venues')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

export default router;
