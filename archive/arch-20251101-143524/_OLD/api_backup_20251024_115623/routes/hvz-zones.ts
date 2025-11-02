import { Router } from 'express'
import type { Request, Response } from 'express'

const router = Router()

// In-memory HVZ zones for demo (production would use Supabase)
const hvzZones: any[] = [
  {
    id: 'hvz-1',
    floorplan_id: 'fp-1',
    event_id: 'event-1',
    zone_name: 'MTN Sponsor Pavilion',
    zone_type: 'sponsor_booth',
    x_coordinate: 100,
    y_coordinate: 150,
    width: 80,
    height: 60,
    sponsor_name: 'MTN South Africa',
    hourly_rate: 1250.00, // R1,250 per hour
    priority_level: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'hvz-2', 
    floorplan_id: 'fp-1',
    event_id: 'event-1',
    zone_name: 'Discovery VIP Lounge',
    zone_type: 'vip',
    x_coordinate: 300,
    y_coordinate: 200,
    width: 120,
    height: 80,
    sponsor_name: 'Discovery Bank',
    hourly_rate: 890.00, // R890 per hour
    priority_level: 2,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'hvz-3',
    floorplan_id: 'fp-1', 
    event_id: 'event-1',
    zone_name: 'Nedbank Main Stage',
    zone_type: 'stage',
    x_coordinate: 200,
    y_coordinate: 50,
    width: 150,
    height: 80,
    sponsor_name: 'Nedbank',
    hourly_rate: 1580.00, // R1,580 per hour
    priority_level: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'hvz-4',
    floorplan_id: 'fp-1',
    event_id: 'event-1', 
    zone_name: 'Shoprite Food Court',
    zone_type: 'food_court',
    x_coordinate: 450,
    y_coordinate: 180,
    width: 100,
    height: 70,
    sponsor_name: 'Shoprite Holdings',
    hourly_rate: 650.00, // R650 per hour
    priority_level: 3,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'hvz-5',
    floorplan_id: 'fp-1',
    event_id: 'event-1',
    zone_name: 'Standard Bank Innovation Hub',
    zone_type: 'tech_zone',
    x_coordinate: 80,
    y_coordinate: 280,
    width: 90,
    height: 65,
    sponsor_name: 'Standard Bank',
    hourly_rate: 950.00, // R950 per hour
    priority_level: 2,
    is_active: true,
    created_at: new Date().toISOString()
  }
]

// GET all HVZ zones for an event
router.get('/hvz-zones/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const zones = hvzZones.filter(z => z.event_id === eventId && z.is_active)
    
    res.json({
      success: true,
      data: zones,
      count: zones.length
    })
  } catch (error) {
    console.error('HVZ Zones fetch error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

// POST create new HVZ zone 
router.post('/hvz-zones', async (req: Request, res: Response) => {
  try {
    const {
      floorplan_id,
      event_id,
      zone_name,
      zone_type,
      x_coordinate,
      y_coordinate,
      width,
      height,
      sponsor_name,
      hourly_rate,
      priority_level
    } = req.body

    const newZone = {
      id: `hvz-${Date.now()}`,
      floorplan_id,
      event_id,
      zone_name,
      zone_type,
      x_coordinate: parseFloat(x_coordinate),
      y_coordinate: parseFloat(y_coordinate),
      width: parseFloat(width),
      height: parseFloat(height),
      sponsor_name: sponsor_name || null,
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
      priority_level: priority_level || 3,
      is_active: true,
      created_at: new Date().toISOString()
    }

    hvzZones.push(newZone)

    res.status(201).json({
      success: true,
      data: newZone,
      message: 'HVZ zone created successfully'
    })
  } catch (error) {
    console.error('HVZ Zone creation error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

// Point-in-rectangle geofencing function
export const detectZoneFromCoordinates = (x: number, y: number, eventId: string) => {
  const activeZones = hvzZones.filter(z => z.event_id === eventId && z.is_active)
  
  // Sort by priority (1 = highest priority)
  activeZones.sort((a, b) => a.priority_level - b.priority_level)
  
  for (const zone of activeZones) {
    // Simple rectangle collision detection
    if (x >= zone.x_coordinate && 
        x <= zone.x_coordinate + zone.width &&
        y >= zone.y_coordinate && 
        y <= zone.y_coordinate + zone.height) {
      return zone
    }
  }
  
  return null // No zone detected
}

// GET geofencing detection endpoint (for testing)
router.get('/hvz-detect/:eventId/:x/:y', async (req: Request, res: Response) => {
  try {
    const { eventId, x, y } = req.params
    const detectedZone = detectZoneFromCoordinates(
      parseFloat(x), 
      parseFloat(y), 
      eventId
    )
    
    res.json({
      success: true,
      detected_zone: detectedZone,
      coordinates: { x: parseFloat(x), y: parseFloat(y) },
      message: detectedZone ? `User is in ${detectedZone.zone_name}` : 'No zone detected'
    })
  } catch (error) {
    console.error('Geofencing detection error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

export default router