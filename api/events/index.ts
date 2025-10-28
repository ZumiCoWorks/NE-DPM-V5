import { Response, Request } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { AuthenticatedRequest } from '../middleware/auth'
import { z } from 'zod'

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  start_date: z.string().datetime('Invalid start date format'),
  end_date: z.string().datetime('Invalid end date format'),
  venue_id: z.string().uuid('Invalid venue ID'),
  max_attendees: z.number().int().positive('Max attendees must be a positive number').optional(),
  status: z.enum(['draft', 'published', 'cancelled']).default('draft'),
})

const updateEventSchema = createEventSchema.partial()

// GET /api/events - List events
export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status, venue_id, search } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let query = supabaseAdmin
      .from('events')
      .select(`
        *,
        venues (
          id,
          name,
          address
        ),
        users (
          id,
          full_name
        )
      `)

    // Filter by organizer for non-admin users (skip for public access)
    if (req.user && req.user.role !== 'admin') {
      query = query.eq('organizer_id', req.user.id)
    }
    
    // For public access, only show published events
    if (!req.user) {
      query = query.eq('status', 'published')
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (venue_id) {
      query = query.eq('venue_id', venue_id)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data: events, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    if (error) {
      console.error('Error fetching events:', error)
      return res.status(500).json({
        error: 'Failed to fetch events',
        message: error.message,
      })
    }

    res.json({
      success: true,
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    })
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch events',
    })
  }
}

// GET /api/events/:id - Get single event
export const getEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    let query = supabase
      .from('events')
      .select(`
        *,
        venues (
          id,
          name,
          address,
          capacity
        ),
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)

    // Filter by organizer for non-admin users
    if (req.user?.role !== 'admin') {
      query = query.eq('organizer_id', req.user?.id)
    }

    const { data: event, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Event not found',
          message: 'The requested event does not exist or you do not have access to it',
        })
      }

      console.error('Error fetching event:', error)
      return res.status(500).json({
        error: 'Failed to fetch event',
        message: error.message,
      })
    }

    res.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Get event error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch event',
    })
  }
}

// POST /api/events - Create event
export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createEventSchema.parse(req.body)

    // Verify venue exists and user has access
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', validatedData.venue_id)
      .single()

    if (venueError || !venue) {
      return res.status(400).json({
        error: 'Invalid venue',
        message: 'The specified venue does not exist',
      })
    }

    // Create event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...validatedData,
        organizer_id: req.user?.id,
      })
      .select(`
        *,
        venues (
          id,
          name,
          address
        ),
        users (
          id,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return res.status(500).json({
        error: 'Failed to create event',
        message: error.message,
      })
    }

    if (!event) {
      return res.status(500).json({
        error: 'Failed to create event',
        message: 'No event data returned after creation',
      })
    }

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully',
    })
  } catch (error) {
    console.error('Create event error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create event',
    })
  }
}

// PUT /api/events/:id - Update event
export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updateEventSchema.parse(req.body)

    // Check if event exists and user has permission
    let checkQuery = supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', id)

    if (req.user?.role !== 'admin') {
      checkQuery = checkQuery.eq('organizer_id', req.user?.id)
    }

    const { data: existingEvent, error: checkError } = await checkQuery.single()

    if (checkError || !existingEvent) {
      return res.status(404).json({
        error: 'Event not found',
        message: 'The requested event does not exist or you do not have access to it',
      })
    }

    // Verify venue if provided
    if (validatedData.venue_id) {
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('id')
        .eq('id', validatedData.venue_id)
        .single()

      if (venueError || !venue) {
        return res.status(400).json({
          error: 'Invalid venue',
          message: 'The specified venue does not exist',
        })
      }
    }

    // Update event
    const { data: event, error } = await supabase
      .from('events')
      .update(validatedData)
      .eq('id', id)
      .select(`
        *,
        venues (
          id,
          name,
          address
        ),
        users (
          id,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return res.status(500).json({
        error: 'Failed to update event',
        message: error.message,
      })
    }

    if (!event) {
      return res.status(500).json({
        error: 'Failed to update event',
        message: 'No event data returned after update',
      })
    }

    res.json({
      success: true,
      data: event,
      message: 'Event updated successfully',
    })
  } catch (error) {
    console.error('Update event error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update event',
    })
  }
}

// DELETE /api/events/:id - Delete event
export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check if event exists and user has permission
    let checkQuery = supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', id)

    if (req.user?.role !== 'admin') {
      checkQuery = checkQuery.eq('organizer_id', req.user?.id)
    }

    const { data: existingEvent, error: checkError } = await checkQuery.single()

    if (checkError || !existingEvent) {
      return res.status(404).json({
        error: 'Event not found',
        message: 'The requested event does not exist or you do not have access to it',
      })
    }

    // Delete event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting event:', error)
      return res.status(500).json({
        error: 'Failed to delete event',
        message: error.message,
      })
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete event',
    })
  }
}