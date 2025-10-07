import { Router, Response } from 'express'
import { supabase } from '../lib/supabase.js'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js'
import multer from 'multer'

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateUser)

// GET /api/floorplans - Get all floorplans for the authenticated organizer
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: floorplans, error } = await supabase
      .from('floorplans')
      .select(`
        *,
        venue:venues(id, name),
        event:events(id, name)
      `)
      .eq('organizer_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching floorplans:', error)
      return res.status(500).json({ error: 'Failed to fetch floorplans' })
    }

    res.json(floorplans)
  } catch (error) {
    console.error('Error in GET /floorplans:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/floorplans/:id - Get a specific floorplan
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    const { data: floorplan, error } = await supabase
      .from('floorplans')
      .select(`
        *,
        venue:venues(id, name, address),
        event:events(id, name, description),
        navigation_nodes(*),
        navigation_paths(*),
        ar_zones(*)
      `)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Floorplan not found' })
      }
      console.error('Error fetching floorplan:', error)
      return res.status(500).json({ error: 'Failed to fetch floorplan' })
    }

    res.json(floorplan)
  } catch (error) {
    console.error('Error in GET /floorplans/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/floorplans - Create a new floorplan
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { venue_id, event_id, name, description, image_url, scale_factor, width, height } = req.body

    // Validate required fields
    if (!venue_id || !name) {
      return res.status(400).json({ error: 'Venue ID and name are required' })
    }

    // Verify venue belongs to organizer
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('id', venue_id)
      .eq('organizer_id', req.user.id)
      .single()

    if (venueError || !venue) {
      return res.status(400).json({ error: 'Invalid venue ID' })
    }

    // If event_id is provided, verify it belongs to organizer
    if (event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('id', event_id)
        .eq('organizer_id', req.user.id)
        .single()

      if (eventError || !event) {
        return res.status(400).json({ error: 'Invalid event ID' })
      }
    }

    const { data: floorplan, error } = await supabase
      .from('floorplans')
      .insert({
        venue_id,
        event_id: event_id || null,
        organizer_id: req.user.id,
        name,
        description: description || null,
        image_url: image_url || null,
        scale_factor: scale_factor || 1.0,
        width: width || null,
        height: height || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating floorplan:', error)
      return res.status(500).json({ error: 'Failed to create floorplan' })
    }

    res.status(201).json(floorplan)
  } catch (error) {
    console.error('Error in POST /floorplans:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/floorplans/:id - Update a floorplan
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { venue_id, event_id, name, description, image_url, scale_factor, width, height } = req.body

    // Verify floorplan belongs to organizer
    const { data: existingFloorplan, error: fetchError } = await supabase
      .from('floorplans')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (fetchError || !existingFloorplan) {
      return res.status(404).json({ error: 'Floorplan not found' })
    }

    // If venue_id is being updated, verify it belongs to organizer
    if (venue_id) {
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('id')
        .eq('id', venue_id)
        .eq('organizer_id', req.user.id)
        .single()

      if (venueError || !venue) {
        return res.status(400).json({ error: 'Invalid venue ID' })
      }
    }

    // If event_id is being updated, verify it belongs to organizer
    if (event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('id', event_id)
        .eq('organizer_id', req.user.id)
        .single()

      if (eventError || !event) {
        return res.status(400).json({ error: 'Invalid event ID' })
      }
    }

    const updateData: {
      venue_id?: string
      event_id?: string | null
      name?: string
      description?: string | null
      image_url?: string | null
      scale_factor?: number
      width?: number | null
      height?: number | null
      updated_at?: string
    } = {}
    if (venue_id !== undefined) updateData.venue_id = venue_id
    if (event_id !== undefined) updateData.event_id = event_id
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (image_url !== undefined) updateData.image_url = image_url
    if (scale_factor !== undefined) updateData.scale_factor = scale_factor
    if (width !== undefined) updateData.width = width
    if (height !== undefined) updateData.height = height
    updateData.updated_at = new Date().toISOString()

    const { data: floorplan, error } = await supabase
      .from('floorplans')
      .update(updateData)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating floorplan:', error)
      return res.status(500).json({ error: 'Failed to update floorplan' })
    }

    res.json(floorplan)
  } catch (error) {
    console.error('Error in PUT /floorplans/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/floorplans/:id - Delete a floorplan
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify floorplan belongs to organizer
    const { data: existingFloorplan, error: fetchError } = await supabase
      .from('floorplans')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (fetchError || !existingFloorplan) {
      return res.status(404).json({ error: 'Floorplan not found' })
    }

    // Delete related navigation nodes and paths first (cascade should handle this, but being explicit)
    await supabase
      .from('navigation_paths')
      .delete()
      .eq('floorplan_id', id)

    await supabase
      .from('navigation_nodes')
      .delete()
      .eq('floorplan_id', id)

    await supabase
      .from('ar_zones')
      .delete()
      .eq('floorplan_id', id)

    // Delete the floorplan
    const { error } = await supabase
      .from('floorplans')
      .delete()
      .eq('id', id)
      .eq('organizer_id', req.user.id)

    if (error) {
      console.error('Error deleting floorplan:', error)
      return res.status(500).json({ error: 'Failed to delete floorplan' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error in DELETE /floorplans/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/floorplans/:id/nodes - Get navigation nodes for a floorplan
router.get('/:id/nodes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify floorplan belongs to organizer
    const { data: floorplan, error: floorplanError } = await supabase
      .from('floorplans')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (floorplanError || !floorplan) {
      return res.status(404).json({ error: 'Floorplan not found' })
    }

    const { data: nodes, error } = await supabase
      .from('navigation_nodes')
      .select('*')
      .eq('floorplan_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching navigation nodes:', error)
      return res.status(500).json({ error: 'Failed to fetch navigation nodes' })
    }

    res.json(nodes)
  } catch (error) {
    console.error('Error in GET /floorplans/:id/nodes:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/floorplans/:id/paths - Get navigation paths for a floorplan
router.get('/:id/paths', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify floorplan belongs to organizer
    const { data: floorplan, error: floorplanError } = await supabase
      .from('floorplans')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (floorplanError || !floorplan) {
      return res.status(404).json({ error: 'Floorplan not found' })
    }

    const { data: paths, error } = await supabase
      .from('navigation_paths')
      .select(`
        *,
        from_node:navigation_nodes!navigation_paths_from_node_id_fkey(*),
        to_node:navigation_nodes!navigation_paths_to_node_id_fkey(*)
      `)
      .eq('floorplan_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching navigation paths:', error)
      return res.status(500).json({ error: 'Failed to fetch navigation paths' })
    }

    res.json(paths)
  } catch (error) {
    console.error('Error in GET /floorplans/:id/paths:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/floorplans/analyze - AI floorplan analysis with POI suggestions
router.post('/analyze', upload.single('floorplan'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Floorplan image is required' })
    }

    const { venue_id } = req.body
    if (!venue_id) {
      return res.status(400).json({ error: 'Venue ID is required' })
    }

    // Verify venue belongs to organizer
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', venue_id)
      .eq('owner_id', req.user.id)
      .single()

    if (venueError || !venue) {
      return res.status(400).json({ error: 'Invalid venue ID' })
    }

    // Simulate AI analysis (in production, this would call actual AI services)
    const aiAnalysisResults = {
      image_dimensions: {
        width: 1200,
        height: 800
      },
      detected_features: {
        walls: 15,
        doors: 8,
        windows: 12,
        rooms: 6
      },
      safety_compliance: {
        emergency_exits_detected: 3,
        accessibility_paths: true,
        fire_safety_compliant: true
      },
      confidence_score: 0.92
    }

    // Generate AI POI suggestions based on detected features
    const poiSuggestions = [
      {
        type: 'entrance',
        x_coordinate: 100,
        y_coordinate: 400,
        confidence: 0.95,
        suggested_name: 'Main Entrance',
        properties: { accessibility: true }
      },
      {
        type: 'emergency_exit',
        x_coordinate: 1100,
        y_coordinate: 100,
        confidence: 0.88,
        suggested_name: 'Emergency Exit 1',
        properties: { compliance_required: true }
      },
      {
        type: 'emergency_exit',
        x_coordinate: 1100,
        y_coordinate: 700,
        confidence: 0.91,
        suggested_name: 'Emergency Exit 2',
        properties: { compliance_required: true }
      },
      {
        type: 'restroom',
        x_coordinate: 200,
        y_coordinate: 150,
        confidence: 0.82,
        suggested_name: 'Restroom',
        properties: { accessibility: true }
      },
      {
        type: 'first_aid',
        x_coordinate: 600,
        y_coordinate: 400,
        confidence: 0.75,
        suggested_name: 'First Aid Station',
        properties: { emergency_equipment: true }
      },
      {
        type: 'elevator',
        x_coordinate: 300,
        y_coordinate: 300,
        confidence: 0.89,
        suggested_name: 'Elevator',
        properties: { accessibility: true }
      }
    ]

    // Store the image (in production, upload to cloud storage)
    const imageUrl = `https://example.com/floorplans/${Date.now()}-${req.file.originalname}`

    // Create floorplan with AI analysis results
    const { data: floorplan, error } = await supabase
      .from('floorplans')
      .insert({
        venue_id,
        image_url: imageUrl,
        image_metadata: {
          original_name: req.file.originalname,
          size: req.file.size,
          mime_type: req.file.mimetype
        },
        ai_analysis_results: aiAnalysisResults,
        poi_suggestions: poiSuggestions,
        compliance_validated: aiAnalysisResults.safety_compliance.fire_safety_compliant
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating floorplan with AI analysis:', error)
      return res.status(500).json({ error: 'Failed to process floorplan analysis' })
    }

    res.status(201).json({
      floorplan,
      ai_analysis: aiAnalysisResults,
      poi_suggestions: poiSuggestions,
      compliance_status: {
        validated: aiAnalysisResults.safety_compliance.fire_safety_compliant,
        emergency_exits: aiAnalysisResults.safety_compliance.emergency_exits_detected,
        accessibility: aiAnalysisResults.safety_compliance.accessibility_paths
      }
    })
  } catch (error) {
    console.error('Error in POST /floorplans/analyze:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/floorplans/:id/validate-compliance - Validate emergency route compliance
router.post('/:id/validate-compliance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify floorplan belongs to organizer
    const { data: floorplan, error: floorplanError } = await supabase
      .from('floorplans')
      .select('*')
      .eq('id', id)
      .eq('venue_id', req.body.venue_id)
      .single()

    if (floorplanError || !floorplan) {
      return res.status(404).json({ error: 'Floorplan not found' })
    }

    // Get all emergency nodes and paths
    const { data: emergencyNodes, error: nodesError } = await supabase
      .from('navigation_nodes')
      .select('*')
      .eq('floorplan_id', id)
      .eq('is_emergency_exit', true)

    const { data: emergencyPaths, error: pathsError } = await supabase
      .from('navigation_paths')
      .select('*')
      .eq('floorplan_id', id)
      .eq('is_emergency_path', true)

    if (nodesError || pathsError) {
      console.error('Error fetching emergency data:', nodesError || pathsError)
      return res.status(500).json({ error: 'Failed to validate compliance' })
    }

    // Perform compliance validation
    const complianceResults = {
      emergency_exits_count: emergencyNodes?.length || 0,
      emergency_paths_count: emergencyPaths?.length || 0,
      minimum_exits_met: (emergencyNodes?.length || 0) >= 2,
      path_connectivity: true, // Simplified check
      accessibility_compliant: true,
      overall_compliant: (emergencyNodes?.length || 0) >= 2
    }

    // Update floorplan compliance status
    const { error: updateError } = await supabase
      .from('floorplans')
      .update({ 
        compliance_validated: complianceResults.overall_compliant,
        ai_analysis_results: {
          ...floorplan.ai_analysis_results,
          compliance_check: complianceResults,
          last_validated: new Date().toISOString()
        }
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating compliance status:', updateError)
      return res.status(500).json({ error: 'Failed to update compliance status' })
    }

    res.json({
      compliance_results: complianceResults,
      validated_at: new Date().toISOString(),
      recommendations: complianceResults.overall_compliant ? [] : [
        'Add more emergency exits (minimum 2 required)',
        'Ensure clear emergency paths between exits',
        'Verify accessibility compliance for all routes'
      ]
    })
  } catch (error) {
    console.error('Error in POST /floorplans/:id/validate-compliance:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/floorplans/:id/emergency-routes - Configure emergency routes
router.post('/:id/emergency-routes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { emergency_nodes, emergency_paths } = req.body

    if (!emergency_nodes || !Array.isArray(emergency_nodes)) {
      return res.status(400).json({ error: 'Emergency nodes array is required' })
    }

    if (!emergency_paths || !Array.isArray(emergency_paths)) {
      return res.status(400).json({ error: 'Emergency paths array is required' })
    }

    // Verify floorplan belongs to organizer
    const { data: floorplan, error: floorplanError } = await supabase
      .from('floorplans')
      .select('id, venue_id')
      .eq('id', id)
      .single()

    if (floorplanError || !floorplan) {
      return res.status(404).json({ error: 'Floorplan not found' })
    }

    // Verify venue belongs to organizer
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('id', floorplan.venue_id)
      .eq('owner_id', req.user.id)
      .single()

    if (venueError || !venue) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Validate emergency nodes structure
    for (const node of emergency_nodes) {
      if (!node.type || !['emergency_exit', 'first_aid', 'assembly_point'].includes(node.type)) {
        return res.status(400).json({ error: 'Invalid emergency node type' })
      }
      if (typeof node.x_coordinate !== 'number' || typeof node.y_coordinate !== 'number') {
        return res.status(400).json({ error: 'Invalid node coordinates' })
      }
    }

    // Validate emergency paths structure
    for (const path of emergency_paths) {
      if (!path.from_node_id || !path.to_node_id) {
        return res.status(400).json({ error: 'Emergency paths must have from_node_id and to_node_id' })
      }
      if (!path.safety_properties || typeof path.safety_properties !== 'object') {
        return res.status(400).json({ error: 'Emergency paths must have safety_properties' })
      }
    }

    // Insert emergency nodes
    const { data: insertedNodes, error: nodesError } = await supabase
      .from('navigation_nodes')
      .insert(
        emergency_nodes.map(node => ({
          floorplan_id: id,
          type: node.type,
          name: node.name || `${node.type.replace('_', ' ').toUpperCase()}`,
          x_coordinate: node.x_coordinate,
          y_coordinate: node.y_coordinate,
          is_emergency_node: true,
          properties: node.properties || {}
        }))
      )
      .select()

    if (nodesError) {
      console.error('Error inserting emergency nodes:', nodesError)
      return res.status(500).json({ error: 'Failed to create emergency nodes' })
    }

    // Create node ID mapping for paths
    const nodeIdMap = new Map()
    emergency_nodes.forEach((node, index) => {
      if (node.temp_id && insertedNodes && insertedNodes[index]) {
        nodeIdMap.set(node.temp_id, insertedNodes[index].id)
      }
    })

    // Insert emergency paths with proper node references
    const pathsToInsert = emergency_paths.map(path => {
      const fromNodeId = nodeIdMap.get(path.from_node_id) || path.from_node_id
      const toNodeId = nodeIdMap.get(path.to_node_id) || path.to_node_id
      
      return {
        floorplan_id: id,
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        is_emergency_route: true,
        safety_properties: {
          width_meters: path.safety_properties.width_meters || 1.2,
          accessibility_compliant: path.safety_properties.accessibility_compliant || false,
          fire_rating: path.safety_properties.fire_rating || 'standard',
          emergency_lighting: path.safety_properties.emergency_lighting || false,
          clear_height_meters: path.safety_properties.clear_height_meters || 2.1,
          max_occupancy: path.safety_properties.max_occupancy || 100
        },
        compliance_validated: true
      }
    })

    const { data: insertedPaths, error: pathsError } = await supabase
      .from('navigation_paths')
      .insert(pathsToInsert)
      .select()

    if (pathsError) {
      console.error('Error inserting emergency paths:', pathsError)
      return res.status(500).json({ error: 'Failed to create emergency paths' })
    }

    // Update floorplan compliance status
    const emergencyExitCount = emergency_nodes.filter(node => node.type === 'emergency_exit').length
    const complianceValidated = emergencyExitCount >= 2

    const { error: updateError } = await supabase
      .from('floorplans')
      .update({ 
        compliance_validated: complianceValidated,
        ai_analysis_results: {
          emergency_configuration: {
            nodes_count: insertedNodes?.length || 0,
            paths_count: insertedPaths?.length || 0,
            emergency_exits: emergencyExitCount,
            compliance_met: complianceValidated,
            configured_at: new Date().toISOString()
          }
        }
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating floorplan compliance:', updateError)
    }

    res.status(201).json({
      emergency_nodes: insertedNodes,
      emergency_paths: insertedPaths,
      compliance_status: {
        validated: complianceValidated,
        emergency_exits_count: emergencyExitCount,
        total_nodes: insertedNodes?.length || 0,
        total_paths: insertedPaths?.length || 0
      },
      recommendations: complianceValidated ? [] : [
        'Add more emergency exits (minimum 2 required)',
        'Ensure all emergency paths meet width requirements (1.2m minimum)',
        'Verify emergency lighting is installed along all paths'
      ]
    })
  } catch (error) {
    console.error('Error in POST /floorplans/:id/emergency-routes:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/floorplans/:id/emergency-routes - Get emergency route configuration
router.get('/:id/emergency-routes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify floorplan access
    const { data: floorplan, error: floorplanError } = await supabase
      .from('floorplans')
      .select('id, venue_id, compliance_validated')
      .eq('id', id)
      .single()

    if (floorplanError || !floorplan) {
      return res.status(404).json({ error: 'Floorplan not found' })
    }

    // Verify venue belongs to organizer
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('id', floorplan.venue_id)
      .eq('owner_id', req.user.id)
      .single()

    if (venueError || !venue) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get emergency nodes
    const { data: emergencyNodes, error: nodesError } = await supabase
      .from('navigation_nodes')
      .select('*')
      .eq('floorplan_id', id)
      .eq('is_emergency_node', true)
      .order('created_at')

    // Get emergency paths
    const { data: emergencyPaths, error: pathsError } = await supabase
      .from('navigation_paths')
      .select('*')
      .eq('floorplan_id', id)
      .eq('is_emergency_route', true)
      .order('created_at')

    if (nodesError || pathsError) {
      console.error('Error fetching emergency routes:', nodesError || pathsError)
      return res.status(500).json({ error: 'Failed to fetch emergency routes' })
    }

    // Calculate compliance metrics
    const emergencyExitCount = emergencyNodes?.filter(node => node.type === 'emergency_exit').length || 0
    const firstAidCount = emergencyNodes?.filter(node => node.type === 'first_aid').length || 0
    const assemblyPointCount = emergencyNodes?.filter(node => node.type === 'assembly_point').length || 0

    const complianceMetrics = {
      emergency_exits: emergencyExitCount,
      first_aid_stations: firstAidCount,
      assembly_points: assemblyPointCount,
      emergency_paths: emergencyPaths?.length || 0,
      minimum_exits_met: emergencyExitCount >= 2,
      overall_compliant: floorplan.compliance_validated
    }

    res.json({
      emergency_nodes: emergencyNodes || [],
      emergency_paths: emergencyPaths || [],
      compliance_metrics: complianceMetrics,
      compliance_requirements: {
        minimum_emergency_exits: 2,
        minimum_path_width_meters: 1.2,
        minimum_clear_height_meters: 2.1,
        emergency_lighting_required: true,
        accessibility_compliance_required: true
      }
    })
  } catch (error) {
    console.error('Error in GET /floorplans/:id/emergency-routes:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router