import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js'
import { randomBytes } from 'crypto'

const router = Router()

// Helper function to generate unique QR code
function generateQRCode(boothName: string): string {
  const random = randomBytes(4).toString('hex').toUpperCase()
  const sanitized = boothName.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 10)
  return `BOOTH-${sanitized}-${random}`
}

// Get all booths for a specific venue
router.get('/venue/:venueId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { venueId } = req.params

    // Verify venue belongs to the organizer
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .eq('organizer_id', req.user.id)
      .single()

    if (venueError || !venue) {
      return res.status(404).json({ error: 'Venue not found' })
    }

    const { data: booths, error } = await supabaseAdmin
      .from('booths')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching booths:', error)
      return res.status(500).json({ error: 'Failed to fetch booths' })
    }

    res.json({ booths })
  } catch (error) {
    console.error('Get booths error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get a specific booth by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    const { data: booth, error } = await supabaseAdmin
      .from('booths')
      .select(`
        *,
        venues!inner (
          id,
          name,
          organizer_id
        )
      `)
      .eq('id', id)
      .eq('venues.organizer_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Booth not found' })
      }
      console.error('Error fetching booth:', error)
      return res.status(500).json({ error: 'Failed to fetch booth' })
    }

    res.json({ booth })
  } catch (error) {
    console.error('Get booth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create a new booth
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const {
      venue_id,
      name,
      zone_name,
      x_coordinate,
      y_coordinate,
      sponsor_name,
      sponsor_tier
    } = req.body

    // Validate required fields
    if (!venue_id || !name) {
      return res.status(400).json({
        error: 'venue_id and name are required'
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

    // Generate unique QR code
    const qr_code = generateQRCode(name)

    const { data: booth, error } = await supabaseAdmin
      .from('booths')
      .insert({
        venue_id,
        name,
        zone_name: zone_name || name,
        x_coordinate: x_coordinate || 0,
        y_coordinate: y_coordinate || 0,
        qr_code,
        sponsor_name,
        sponsor_tier
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating booth:', error)
      return res.status(500).json({ error: 'Failed to create booth' })
    }

    res.status(201).json({ booth })
  } catch (error) {
    console.error('Create booth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update an existing booth
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params
    const {
      name,
      zone_name,
      x_coordinate,
      y_coordinate,
      sponsor_name,
      sponsor_tier
    } = req.body

    // Verify booth exists and belongs to organizer's venue
    const { data: existingBooth, error: checkError } = await supabaseAdmin
      .from('booths')
      .select(`
        id,
        venues!inner (
          organizer_id
        )
      `)
      .eq('id', id)
      .eq('venues.organizer_id', req.user.id)
      .single()

    if (checkError || !existingBooth) {
      return res.status(404).json({ error: 'Booth not found' })
    }

    interface BoothUpdateData {
      name?: string
      zone_name?: string
      x_coordinate?: number
      y_coordinate?: number
      sponsor_name?: string
      sponsor_tier?: string
      updated_at?: string
    }

    const updateData: BoothUpdateData = {}
    if (name !== undefined) {
      updateData.name = name
      updateData.zone_name = zone_name || name
    }
    if (zone_name !== undefined) updateData.zone_name = zone_name
    if (x_coordinate !== undefined) updateData.x_coordinate = x_coordinate
    if (y_coordinate !== undefined) updateData.y_coordinate = y_coordinate
    if (sponsor_name !== undefined) updateData.sponsor_name = sponsor_name
    if (sponsor_tier !== undefined) updateData.sponsor_tier = sponsor_tier
    updateData.updated_at = new Date().toISOString()

    const { data: booth, error } = await supabaseAdmin
      .from('booths')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booth:', error)
      return res.status(500).json({ error: 'Failed to update booth' })
    }

    res.json({ booth })
  } catch (error) {
    console.error('Update booth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete a booth
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    // Verify booth exists and belongs to organizer's venue
    const { data: existingBooth, error: checkError } = await supabaseAdmin
      .from('booths')
      .select(`
        id,
        venues!inner (
          organizer_id
        )
      `)
      .eq('id', id)
      .eq('venues.organizer_id', req.user.id)
      .single()

    if (checkError || !existingBooth) {
      return res.status(404).json({ error: 'Booth not found' })
    }

    const { error } = await supabaseAdmin
      .from('booths')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting booth:', error)
      return res.status(500).json({ error: 'Failed to delete booth' })
    }

    res.json({ message: 'Booth deleted successfully' })
  } catch (error) {
    console.error('Delete booth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Regenerate QR code for a booth
router.post('/:id/regenerate-qr', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    // Get booth and verify ownership
    const { data: booth, error: fetchError } = await supabaseAdmin
      .from('booths')
      .select(`
        id,
        name,
        venues!inner (
          organizer_id
        )
      `)
      .eq('id', id)
      .eq('venues.organizer_id', req.user.id)
      .single()

    if (fetchError || !booth) {
      return res.status(404).json({ error: 'Booth not found' })
    }

    // Generate new QR code
    const new_qr_code = generateQRCode(booth.name)

    const { data: updatedBooth, error } = await supabaseAdmin
      .from('booths')
      .update({
        qr_code: new_qr_code,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error regenerating QR code:', error)
      return res.status(500).json({ error: 'Failed to regenerate QR code' })
    }

    res.json({ booth: updatedBooth })
  } catch (error) {
    console.error('Regenerate QR code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


