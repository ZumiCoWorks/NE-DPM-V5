import { Router, Response, Request, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

interface ApiKeyRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

interface VenueData {
  id: string
  name: string
  location: {
    latitude: number
    longitude: number
  }
  address: string
}

interface EventData {
  id: string
  name: string
  start_date: string
  end_date: string
}

interface FloorplanData {
  id: string
  image_url?: string
  image_metadata?: {
    width?: number
    height?: number
    [key: string]: unknown
  }
  compliance_validated: boolean
  navigation_nodes?: NavigationNodeData[]
  navigation_paths?: NavigationPathData[]
}

interface NavigationNodeData {
  id: string
  type: string
  name: string
  x_coordinate: number
  y_coordinate: number
  is_emergency_node?: boolean
  properties: Record<string, unknown>
}

interface NavigationPathData {
  id: string
  from_node_id: string
  to_node_id: string
  is_emergency_route?: boolean
  safety_properties?: {
    width_meters?: number
    accessibility_compliant?: boolean
    emergency_lighting?: boolean
    fire_rating?: string
  }
}

interface ARZoneData {
  id: string
  name: string
  zone_type: string
  coordinates: unknown
  ar_content: Record<string, unknown>
  trigger_conditions: Record<string, unknown>
  is_active: boolean
}

interface ARAssetData {
  id: string
  name: string
  asset_type: string
  optimized_url: string
  file_size: number
  ai_processing_metadata: Record<string, unknown>
  bandwidth_optimized: boolean
}

interface CampaignData {
  id: string
  name: string
  description: string
  is_active: boolean
  revenue_model: string
  geographical_zones: unknown
  venue?: VenueData
  event?: EventData
  ar_zones?: ARZoneData[]
  ar_assets?: ARAssetData[]
}

// Helper function for time-based filtering
const isWithinTimeWindow = (timeConditions: any): boolean => {
  if (!timeConditions) return true
  const now = new Date()
  const start = timeConditions.start ? new Date(timeConditions.start) : null
  const end = timeConditions.end ? new Date(timeConditions.end) : null
  
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

// Middleware for API key authentication (for mobile apps)
const authenticateApiKey = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' })
    }

    // Verify API key belongs to a valid user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('api_key', apiKey)
      .eq('role', 'organizer')
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Error in API key authentication:', error)
    res.status(500).json({ error: 'Authentication error' })
  }
}

// GET /api/sdk/venues/:venue_id/map-data - Get optimized map data for mobile
router.get('/venues/:venue_id/map-data', authenticateApiKey, async (req: ApiKeyRequest, res: Response) => {
  try {
    const { venue_id } = req.params
    const { bandwidth = 'auto', format = 'optimized' } = req.query

    // Get venue with floorplans and navigation data
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select(`
        id, name, location, address,
        floorplans(
          id, image_url, image_metadata, compliance_validated,
          navigation_nodes(
            id, type, name, x_coordinate, y_coordinate, is_emergency_node, properties
          ),
          navigation_paths(
            id, from_node_id, to_node_id, is_emergency_route, safety_properties
          )
        )
      `)
      .eq('id', venue_id)
      .eq('owner_id', req.user.id)
      .single()

    // Get additional floorplan data
    const { data: floorplans, error: floorplanError } = await supabase
      .from('floorplans')
      .select(`
        id,
        image_url,
        image_metadata,
        compliance_validated,
        navigation_nodes(*),
        navigation_paths(*)
      `)
      .eq('venue_id', venue_id) as { data: FloorplanData[] | null, error: any }

    if (venueError || !venue) {
      return res.status(404).json({ error: 'Venue not found' })
    }

    // Optimize data based on bandwidth requirements
    const optimizedMapData = {
      venue: {
        id: venue.id,
        name: venue.name,
        location: venue.location,
        address: bandwidth === 'low' ? null : venue.address
      },
      floorplans: floorplans?.map((fp: FloorplanData) => ({
        id: fp.id,
        image_url: fp.image_url,
        image_metadata: bandwidth === 'low' ? 
          { width: fp.image_metadata?.width, height: fp.image_metadata?.height } : 
          fp.image_metadata,
        compliance_validated: fp.compliance_validated,
        navigation_nodes: fp.navigation_nodes?.map((node: NavigationNodeData) => ({
          id: node.id,
          type: node.type,
          name: bandwidth === 'low' ? null : node.name,
          coordinates: [node.x_coordinate, node.y_coordinate],
          emergency: node.is_emergency_node,
          properties: bandwidth === 'low' ? {} : node.properties
        })),
        navigation_paths: fp.navigation_paths?.map((path: NavigationPathData) => ({
          id: path.id,
          from: path.from_node_id,
          to: path.to_node_id,
          emergency: path.is_emergency_route,
          safety: bandwidth === 'low' ? 
            { width: path.safety_properties?.width_meters } : 
            path.safety_properties
        }))
      })) || [],
      metadata: {
        generated_at: new Date().toISOString(),
        bandwidth_mode: bandwidth,
        format_version: '1.0',
        cache_duration: bandwidth === 'low' ? 7200 : 3600, // 2 hours for low bandwidth
        total_nodes: floorplans?.reduce((sum, fp) => sum + (fp.navigation_nodes?.length || 0), 0) || 0,
        total_paths: floorplans?.reduce((sum, fp) => sum + (fp.navigation_paths?.length || 0), 0) || 0
      }
    }

    // Set appropriate cache headers
    res.set({
      'Cache-Control': `public, max-age=${bandwidth === 'low' ? 7200 : 3600}`,
      'Content-Type': 'application/json',
      'X-Data-Size': JSON.stringify(optimizedMapData).length.toString(),
      'X-Bandwidth-Mode': bandwidth
    })

    res.json(optimizedMapData)
  } catch (error) {
    console.error('Error in GET /sdk/venues/:venue_id/map-data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/sdk/campaigns/:campaign_id/ar-content - Get optimized AR content for mobile
router.get('/campaigns/:campaign_id/ar-content', authenticateApiKey, async (req: ApiKeyRequest, res: Response) => {
  try {
    const { campaign_id } = req.params
    const { bandwidth = 'auto', device_type = 'mobile' } = req.query

    // Get AR campaign with zones and assets
    const { data: campaign, error } = await supabase
      .from('ar_campaigns')
      .select(`
        id, name, description, is_active, revenue_model, geographical_zones,
        venue:venues(id, name, location),
        event:events(id, name, start_date, end_date),
        ar_zones(id, name, zone_type, coordinates, ar_content, trigger_conditions, is_active),
        ar_assets(id, name, asset_type, optimized_url, file_size, ai_processing_metadata, bandwidth_optimized)
      `)
      .eq('id', campaign_id)
      .eq('organizer_id', req.user.id)
      .eq('is_active', true)
      .single() as { data: CampaignData | null, error: any }

    if (error || !campaign) {
      return res.status(404).json({ error: 'AR campaign not found or inactive' })
    }

    // Filter active zones based on current conditions
    const activeZones = campaign.ar_zones?.filter((zone: ARZoneData) => {
      return zone.is_active && 
             (!zone.trigger_conditions?.time_based || 
              isWithinTimeWindow(zone.trigger_conditions.time_based))
    }) || []
    const optimizedAssets = campaign.ar_assets?.filter((asset: ARAssetData) => asset.bandwidth_optimized) || []

    const optimizedArContent = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: bandwidth === 'low' ? null : campaign.description,
        revenue_model: campaign.revenue_model,
        geographical_zones: campaign.geographical_zones
      },
      venue: campaign.venue ? {
        venue_id: (campaign.venue as VenueData).id,
        name: (campaign.venue as VenueData).name,
        location: (campaign.venue as VenueData).location
      } : null,
      event: campaign.event ? {
        id: (campaign.event as EventData).id,
        name: (campaign.event as EventData).name,
        schedule: {
          start: (campaign.event as EventData).start_date,
          end: (campaign.event as EventData).end_date
        }
      } : null,
      ar_zones: activeZones.map((zone: ARZoneData) => ({
        id: zone.id,
        name: zone.name,
        type: zone.zone_type,
        coordinates: zone.coordinates,
        content: bandwidth === 'low' ? 
          { ...zone.ar_content, high_res_assets: undefined } : 
          zone.ar_content,
        triggers: zone.trigger_conditions
      })),
      ar_assets: optimizedAssets
        .filter(asset => {
          // Filter assets based on bandwidth and device capabilities
          if (bandwidth === 'low') {
            return asset.file_size < 5 * 1024 * 1024 // 5MB limit for low bandwidth
          }
          return true
        })
        .map((asset: ARAssetData) => ({
          id: asset.id,
          name: asset.name,
          type: asset.asset_type,
          url: asset.optimized_url,
          size: asset.file_size,
          processing_info: bandwidth === 'low' ? 
            { optimized: true } : 
            asset.ai_processing_metadata
        })),
      optimization: {
        bandwidth_mode: bandwidth,
        device_type: device_type,
        total_zones: activeZones.length,
        total_assets: optimizedAssets.length,
        estimated_download_size: optimizedAssets.reduce((sum, asset) => sum + (asset.file_size || 0), 0),
        cache_strategy: bandwidth === 'low' ? 'aggressive' : 'standard'
      },
      metadata: {
        generated_at: new Date().toISOString(),
        sdk_version: '1.0.0',
        cache_duration: bandwidth === 'low' ? 14400 : 7200, // 4 hours for low bandwidth
        format_version: '1.0'
      }
    }

    // Set appropriate cache headers
    res.set({
      'Cache-Control': `public, max-age=${bandwidth === 'low' ? 14400 : 7200}`,
      'Content-Type': 'application/json',
      'X-Data-Size': JSON.stringify(optimizedArContent).length.toString(),
      'X-Bandwidth-Mode': bandwidth,
      'X-Asset-Count': optimizedAssets.length.toString()
    })

    res.json(optimizedArContent)
  } catch (error) {
    console.error('Error in GET /sdk/campaigns/:campaign_id/ar-content:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/sdk/events/:event_id/emergency-info - Get emergency information for mobile
router.get('/events/:event_id/emergency-info', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { event_id } = req.params
    const { format = 'mobile' } = req.query

    // Get event with venue and emergency data
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        id, name, start_date, end_date,
        venue:venues(
          id, name, location, address,
          floorplans(
            id, compliance_validated,
            navigation_nodes!inner(id, type, name, x_coordinate, y_coordinate, properties),
            navigation_paths!inner(id, from_node_id, to_node_id, safety_properties)
          )
        )
      `)
      .eq('id', event_id)
      .eq('organizer_id', req.user.id)
      .single() as { data: EventData & { venue: VenueData & { floorplans?: FloorplanData[] } } | null, error: any }

    if (error || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Get emergency-specific navigation data from floorplans
    const { data: floorplans } = await supabase
      .from('floorplans')
      .select(`
        id, compliance_validated,
        navigation_nodes(*),
        navigation_paths(*)
      `)
      .eq('venue_id', event.venue.id) as { data: FloorplanData[] | null }

    // Extract emergency information
    const emergencyInfo = {
      event: {
        id: event.id,
        name: event.name,
        dates: {
          start: event.start_date,
          end: event.end_date
        }
      },
      venue: {
        id: event.venue.id,
        name: event.venue.name,
        location: event.venue.location,
        address: event.venue.address
      },
      emergency_data: (floorplans || []).map((floorplan: FloorplanData) => {
        const emergencyNodes = floorplan.navigation_nodes?.filter((node: NavigationNodeData) => 
          ['emergency_exit', 'first_aid', 'assembly_point'].includes(node.type)
        ) || []
        
        const emergencyPaths = floorplan.navigation_paths?.filter((path: NavigationPathData) => 
          path.safety_properties?.emergency_lighting || 
          path.safety_properties?.accessibility_compliant
        ) || []

        return {
          floorplan_id: floorplan.id,
          compliance_validated: floorplan.compliance_validated,
          emergency_exits: emergencyNodes
            .filter((node: NavigationNodeData) => node.type === 'emergency_exit')
            .map((node: NavigationNodeData) => ({
              id: node.id,
              name: node.name,
              coordinates: [node.x_coordinate, node.y_coordinate],
              properties: node.properties
            })),
          first_aid_stations: emergencyNodes
            .filter((node: NavigationNodeData) => node.type === 'first_aid')
            .map((node: NavigationNodeData) => ({
              id: node.id,
              name: node.name,
              coordinates: [node.x_coordinate, node.y_coordinate],
              properties: node.properties
            })),
          assembly_points: emergencyNodes
            .filter((node: NavigationNodeData) => node.type === 'assembly_point')
            .map((node: NavigationNodeData) => ({
              id: node.id,
              name: node.name,
              coordinates: [node.x_coordinate, node.y_coordinate],
              properties: node.properties
            })),
          emergency_routes: emergencyPaths.map((path: NavigationPathData) => ({
            id: path.id,
            from_node: path.from_node_id,
            to_node: path.to_node_id,
            safety_features: {
              width_meters: path.safety_properties?.width_meters,
              accessibility: path.safety_properties?.accessibility_compliant,
              emergency_lighting: path.safety_properties?.emergency_lighting,
              fire_rating: path.safety_properties?.fire_rating
            }
          }))
        }
      }),
      compliance_summary: {
        total_emergency_exits: (floorplans || []).reduce((sum: number, fp: FloorplanData) => 
          sum + (fp.navigation_nodes?.filter((n: NavigationNodeData) => n.type === 'emergency_exit').length || 0), 0
        ),
        total_first_aid_stations: (floorplans || []).reduce((sum: number, fp: FloorplanData) => 
          sum + (fp.navigation_nodes?.filter((n: NavigationNodeData) => n.type === 'first_aid').length || 0), 0
        ),
        compliance_validated: (floorplans || []).every((fp: FloorplanData) => fp.compliance_validated)
      },
      metadata: {
        generated_at: new Date().toISOString(),
        format: format,
        cache_duration: 1800, // 30 minutes for emergency data
        emergency_contact: {
          phone: '+27-emergency-number',
          sms: '+27-emergency-sms'
        }
      }
    }

    // Set cache headers for emergency data
    res.set({
      'Cache-Control': 'public, max-age=1800', // 30 minutes
      'Content-Type': 'application/json',
      'X-Emergency-Data': 'true',
      'X-Compliance-Status': emergencyInfo.compliance_summary.compliance_validated.toString()
    })

    res.json(emergencyInfo)
  } catch (error) {
    console.error('Error in GET /sdk/events/:event_id/emergency-info:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/sdk/health - SDK health check and status
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    sdk_version: '1.0.0',
    api_version: '1.0',
    timestamp: new Date().toISOString(),
    features: {
      map_data: true,
      ar_content: true,
      emergency_info: true,
      low_bandwidth_optimization: true,
      south_african_optimization: true
    },
    bandwidth_modes: ['auto', 'high', 'medium', 'low'],
    supported_formats: ['mobile', 'web', 'optimized']
  })
})

export default router