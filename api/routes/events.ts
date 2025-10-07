import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth'

const router = Router()

// Get all events for the authenticated organizer
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select(`
        *,
        venues (
          id,
          name,
          address
        )
      `)
      .eq('organizer_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: 'Failed to fetch events' })
    }

    res.json({ events })
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get a specific event by ID
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select(`
        *,
        venues (
          id,
          name,
          address,
          description
        )
      `)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Event not found' })
      }
      console.error('Error fetching event:', error)
      return res.status(500).json({ error: 'Failed to fetch event' })
    }

    res.json({ event })
  } catch (error) {
    console.error('Get event error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create a new event
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const {
      name,
      description,
      venue_id,
      start_date,
      end_date,
      status = 'draft'
    } = req.body

    // Validate required fields
    if (!name || !venue_id || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Name, venue_id, start_date, and end_date are required'
      })
    }

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'End date must be after start date'
      })
    }

    // Verify venue belongs to the organizer
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('id', venue_id)
      .eq('organizer_id', req.user.id)
      .single()

    if (venueError || !venue) {
      return res.status(400).json({ error: 'Invalid venue or venue not found' })
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        name,
        description,
        venue_id,
        start_date,
        end_date,
        status,
        organizer_id: req.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return res.status(500).json({ error: 'Failed to create event' })
    }

    res.status(201).json({ event })
  } catch (error) {
    console.error('Create event error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update an existing event
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params
    const {
      name,
      description,
      venue_id,
      start_date,
      end_date,
      status
    } = req.body

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      
      if (startDate >= endDate) {
        return res.status(400).json({
          error: 'End date must be after start date'
        })
      }
    }

    // If venue_id is being updated, verify it belongs to the organizer
    if (venue_id) {
      const { data: venue, error: venueError } = await supabaseAdmin
        .from('venues')
        .select('id')
        .eq('id', venue_id)
        .eq('organizer_id', req.user.id)
        .single()

      if (venueError || !venue) {
        return res.status(400).json({ error: 'Invalid venue or venue not found' })
      }
    }

    const updateData: {
      name?: string
      description?: string
      venue_id?: string
      start_date?: string
      end_date?: string
      status?: string
      updated_at?: string
    } = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (venue_id !== undefined) updateData.venue_id = venue_id
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (status !== undefined) updateData.status = status
    updateData.updated_at = new Date().toISOString()

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update(updateData)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Event not found' })
      }
      console.error('Error updating event:', error)
      return res.status(500).json({ error: 'Failed to update event' })
    }

    res.json({ event })
  } catch (error) {
    console.error('Update event error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete an event
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    // Check if event exists and belongs to the organizer
    const { data: existingEvent, error: checkError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (checkError || !existingEvent) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id)
      .eq('organizer_id', req.user.id)

    if (error) {
      console.error('Error deleting event:', error)
      return res.status(500).json({ error: 'Failed to delete event' })
    }

    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router