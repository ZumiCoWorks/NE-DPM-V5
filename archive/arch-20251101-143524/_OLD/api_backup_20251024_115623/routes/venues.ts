import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth.js'

const router = Router()

// Public endpoint for mobile app - Get venue details with booths
router.get('/public/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to fetch from database
    const { data: dbVenue, error } = await supabaseAdmin
      .from('venues')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && dbVenue) {
      // Fetch booths for this venue
      const { data: dbBooths } = await supabaseAdmin
        .from('booths')
        .select('*')
        .eq('venue_id', id)
        .order('name', { ascending: true })

      return res.json({
        venue: {
          ...dbVenue,
          booths: dbBooths || []
        }
      })
    }

    // Otherwise, return mock venue data for testing
    const mockVenues: any = {
      'venue-001': {
        id: 'venue-001',
        name: 'Convention Center Hall A',
        address: '123 Main Street, Downtown',
        description: 'Large exhibition hall with 50+ booths',
        booths: [
          { id: 'booth-001', name: 'Microsoft', zone_name: 'Microsoft', x_coordinate: 20, y_coordinate: 20, qr_code: 'BOOTH-MS-001' },
          { id: 'booth-002', name: 'Google', zone_name: 'Google', x_coordinate: 60, y_coordinate: 20, qr_code: 'BOOTH-GOOG-002' },
          { id: 'booth-003', name: 'Apple', zone_name: 'Apple', x_coordinate: 100, y_coordinate: 20, qr_code: 'BOOTH-AAPL-003' },
          { id: 'booth-004', name: 'Amazon', zone_name: 'Amazon', x_coordinate: 20, y_coordinate: 60, qr_code: 'BOOTH-AMZN-004' },
          { id: 'booth-005', name: 'Meta', zone_name: 'Meta', x_coordinate: 60, y_coordinate: 60, qr_code: 'BOOTH-META-005' },
          { id: 'booth-006', name: 'Tesla', zone_name: 'Tesla', x_coordinate: 100, y_coordinate: 60, qr_code: 'BOOTH-TSLA-006' }
        ]
      },
      'venue-002': {
        id: 'venue-002',
        name: 'Riverside Park',
        address: '456 River Road, Waterfront',
        description: 'Outdoor venue with 30+ food stalls',
        booths: [
          { id: 'booth-101', name: 'Pizza Palace', zone_name: 'Pizza Palace', x_coordinate: 30, y_coordinate: 30, qr_code: 'BOOTH-PIZZA-101' },
          { id: 'booth-102', name: 'Taco Truck', zone_name: 'Taco Truck', x_coordinate: 70, y_coordinate: 30, qr_code: 'BOOTH-TACO-102' },
          { id: 'booth-103', name: 'Wine Tasting', zone_name: 'Wine Tasting', x_coordinate: 50, y_coordinate: 70, qr_code: 'BOOTH-WINE-103' }
        ]
      }
    };

    const venue = mockVenues[id];
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found', venue: null });
    }

    res.json({ venue });
  } catch (error) {
    console.error('Get public venue error:', error);
    res.status(500).json({ error: 'Internal server error', venue: null });
  }
});

// Get all venues for the authenticated organizer
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data: venues, error } = await supabaseAdmin
      .from('venues')
      .select(`
        *,
        events!venues_events_venue_id_fkey (
          id,
          name,
          start_date,
          end_date,
          status
        )
      `)
      .eq('organizer_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching venues:', error)
      return res.status(500).json({ error: 'Failed to fetch venues' })
    }

    res.json({ venues })
  } catch (error) {
    console.error('Get venues error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get a specific venue by ID
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    const { data: venue, error } = await supabaseAdmin
      .from('venues')
      .select(`
        *,
        events!venues_events_venue_id_fkey (
          id,
          name,
          start_date,
          end_date,
          status
        ),
        floorplans (
          id,
          name,
          floor_number
        )
      `)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Venue not found' })
      }
      console.error('Error fetching venue:', error)
      return res.status(500).json({ error: 'Failed to fetch venue' })
    }

    res.json({ venue })
  } catch (error) {
    console.error('Get venue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create a new venue
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const {
      name,
      address,
      description,
      capacity,
      contact_info
    } = req.body

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        error: 'Name and address are required'
      })
    }

    // Validate capacity if provided
    if (capacity !== undefined && (capacity < 0 || !Number.isInteger(capacity))) {
      return res.status(400).json({
        error: 'Capacity must be a non-negative integer'
      })
    }

    const { data: venue, error } = await supabaseAdmin
      .from('venues')
      .insert({
        name,
        address,
        description,
        capacity,
        contact_info,
        organizer_id: req.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating venue:', error)
      return res.status(500).json({ error: 'Failed to create venue' })
    }

    res.status(201).json({ venue })
  } catch (error) {
    console.error('Create venue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update an existing venue
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params
    const {
      name,
      address,
      description,
      capacity,
      contact_info
    } = req.body

    // Validate capacity if provided
    if (capacity !== undefined && (capacity < 0 || !Number.isInteger(capacity))) {
      return res.status(400).json({
        error: 'Capacity must be a non-negative integer'
      })
    }

    interface VenueUpdateData {
      name?: string
      address?: string
      description?: string
      capacity?: number
      contact_info?: Record<string, unknown>
      updated_at?: string
    }

    const updateData: VenueUpdateData = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (description !== undefined) updateData.description = description
    if (capacity !== undefined) updateData.capacity = capacity
    if (contact_info !== undefined) updateData.contact_info = contact_info
    updateData.updated_at = new Date().toISOString()

    const { data: venue, error } = await supabaseAdmin
      .from('venues')
      .update(updateData)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Venue not found' })
      }
      console.error('Error updating venue:', error)
      return res.status(500).json({ error: 'Failed to update venue' })
    }

    res.json({ venue })
  } catch (error) {
    console.error('Update venue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete a venue
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    // Check if venue exists and belongs to the organizer
    const { data: existingVenue, error: checkError } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (checkError || !existingVenue) {
      return res.status(404).json({ error: 'Venue not found' })
    }

    // Check if venue has associated events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('venue_id', id)
      .limit(1)

    if (eventsError) {
      console.error('Error checking venue events:', eventsError)
      return res.status(500).json({ error: 'Failed to check venue dependencies' })
    }

    if (events && events.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete venue with associated events. Please delete or reassign events first.'
      })
    }

    const { error } = await supabaseAdmin
      .from('venues')
      .delete()
      .eq('id', id)
      .eq('organizer_id', req.user.id)

    if (error) {
      console.error('Error deleting venue:', error)
      return res.status(500).json({ error: 'Failed to delete venue' })
    }

    res.json({ message: 'Venue deleted successfully' })
  } catch (error) {
    console.error('Delete venue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router