import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireEventOrganizer, AuthenticatedRequest } from '../middleware/auth.js';

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
const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  venueId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
});

const updateEventSchema = createEventSchema.partial();

// Get all events (public - only published)
router.get('/', async (req, res) => {
  try {
    const { data: events, error } = await getSupabase()
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('start_time', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get event by ID (public - only published)
router.get('/:id', async (req, res) => {
  try {
    const { data: event, error } = await getSupabase()
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .eq('status', 'published')
      .single();

    if (error) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// Get my events (authenticated)
router.get('/my/events', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: events, error } = await getSupabase()
      .from('events')
      .select('*')
      .eq('organizer_id', req.user!.id)
      .order('start_time', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(events);
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Create event (event organizer)
router.post('/', authenticateToken, requireEventOrganizer, async (req: AuthenticatedRequest, res) => {
  try {
    const eventData = createEventSchema.parse(req.body);

    const { data: event, error } = await getSupabase()
      .from('events')
      .insert([{
        name: eventData.name,
        description: eventData.description,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        venue_id: eventData.venueId,
        organizer_id: req.user!.id,
        status: eventData.status || 'draft',
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (event organizer)
router.put('/:id', authenticateToken, requireEventOrganizer, async (req: AuthenticatedRequest, res) => {
  try {
    const eventData = updateEventSchema.parse(req.body);

    // Check if user owns this event
    const { data: existingEvent } = await getSupabase()
      .from('events')
      .select('organizer_id')
      .eq('id', req.params.id)
      .single();

    if (!existingEvent || existingEvent.organizer_id !== req.user!.id) {
      return res.status(403).json({ error: 'You can only update your own events' });
    }

    const { data: event, error } = await getSupabase()
      .from('events')
      .update({
        name: eventData.name,
        description: eventData.description,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        venue_id: eventData.venueId,
        status: eventData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (event organizer)
router.delete('/:id', authenticateToken, requireEventOrganizer, async (req: AuthenticatedRequest, res) => {
  try {
    // Check if user owns this event
    const { data: existingEvent } = await getSupabase()
      .from('events')
      .select('organizer_id')
      .eq('id', req.params.id)
      .single();

    if (!existingEvent || existingEvent.organizer_id !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own events' });
    }

    const { error } = await getSupabase()
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
