import { Response } from 'express'
import { supabase } from '../lib/supabase'
import { AuthenticatedRequest } from '../middleware/auth'
import { z } from 'zod'

const createVenueSchema = z.object({
  name: z.string().min(1, 'Venue name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  contact_email: z.string().email('Invalid email format').optional(),
  contact_phone: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
})

const updateVenueSchema = createVenueSchema.partial()

// GET /api/venues - List venues
export const getVenues = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let query = supabase
      .from('venues')
      .select(`
        *,
        users (
          id,
          full_name
        )
      `)

    // Filter by organization for non-admin users
    if (req.user?.role !== 'admin') {
      query = query.eq('organization_id', req.user?.organization_id)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data: venues, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    if (error) {
      console.error('Error fetching venues:', error)
      return res.status(500).json({
        error: 'Failed to fetch venues',
        message: error.message,
      })
    }

    res.json({
      success: true,
      data: venues,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    })
  } catch (error) {
    console.error('Get venues error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch venues',
    })
  }
}

// GET /api/venues/:id - Get single venue
export const getVenue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    let query = supabase
      .from('venues')
      .select(`
        *,
        users (
          id,
          full_name,
          email
        ),
        floorplans (
          id,
          name,
          floor_number,
          is_active
        )
      `)
      .eq('id', id)

    // Filter by organization for non-admin users
    if (req.user?.role !== 'admin') {
      query = query.eq('organization_id', req.user?.organization_id)
    }

    const { data: venue, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Venue not found',
          message: 'The requested venue does not exist or you do not have access to it',
        })
      }

      console.error('Error fetching venue:', error)
      return res.status(500).json({
        error: 'Failed to fetch venue',
        message: error.message,
      })
    }

    res.json({
      success: true,
      data: venue,
    })
  } catch (error) {
    console.error('Get venue error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch venue',
    })
  }
}

// POST /api/venues - Create venue
export const createVenue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createVenueSchema.parse(req.body)

    // Create venue
    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        ...validatedData,
        organization_id: req.user?.organization_id,
      })
      .select(`
        *,
        users (
          id,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating venue:', error)
      return res.status(500).json({
        error: 'Failed to create venue',
        message: error.message,
      })
    }

    if (!venue) {
      return res.status(500).json({
        error: 'Failed to create venue',
        message: 'No venue data returned after creation',
      })
    }

    res.status(201).json({
      success: true,
      data: venue,
      message: 'Venue created successfully',
    })
  } catch (error) {
    console.error('Create venue error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create venue',
    })
  }
}

// PUT /api/venues/:id - Update venue
export const updateVenue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updateVenueSchema.parse(req.body)

    // Check if venue exists and user has permission
    let checkQuery = supabase
      .from('venues')
      .select('id, organization_id')
      .eq('id', id)

    if (req.user?.role !== 'admin') {
      checkQuery = checkQuery.eq('organization_id', req.user?.organization_id)
    }

    const { data: existingVenue, error: checkError } = await checkQuery.single()

    if (checkError || !existingVenue) {
      return res.status(404).json({
        error: 'Venue not found',
        message: 'The requested venue does not exist or you do not have access to it',
      })
    }

    // Update venue
    const { data: venue, error } = await supabase
      .from('venues')
      .update(validatedData)
      .eq('id', id)
      .select(`
        *,
        users (
          id,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating venue:', error)
      return res.status(500).json({
        error: 'Failed to update venue',
        message: error.message,
      })
    }

    if (!venue) {
      return res.status(500).json({
        error: 'Failed to update venue',
        message: 'No venue data returned after update',
      })
    }

    res.json({
      success: true,
      data: venue,
      message: 'Venue updated successfully',
    })
  } catch (error) {
    console.error('Update venue error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update venue',
    })
  }
}

// DELETE /api/venues/:id - Delete venue
export const deleteVenue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check if venue exists and user has permission
    let checkQuery = supabase
      .from('venues')
      .select('id, organization_id')
      .eq('id', id)

    if (req.user?.role !== 'admin') {
      checkQuery = checkQuery.eq('organization_id', req.user?.organization_id)
    }

    const { data: existingVenue, error: checkError } = await checkQuery.single()

    if (checkError || !existingVenue) {
      return res.status(404).json({
        error: 'Venue not found',
        message: 'The requested venue does not exist or you do not have access to it',
      })
    }

    // Check if venue has active events
    const { data: activeEvents, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('venue_id', id)
      .in('status', ['published'])
      .limit(1)

    if (eventsError) {
      console.error('Error checking active events:', eventsError)
      return res.status(500).json({
        error: 'Failed to check venue dependencies',
        message: eventsError.message,
      })
    }

    if (activeEvents && activeEvents.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete venue',
        message: 'Venue has active events and cannot be deleted',
      })
    }

    // Delete venue
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting venue:', error)
      return res.status(500).json({
        error: 'Failed to delete venue',
        message: error.message,
      })
    }

    res.json({
      success: true,
      message: 'Venue deleted successfully',
    })
  } catch (error) {
    console.error('Delete venue error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete venue',
    })
  }
}