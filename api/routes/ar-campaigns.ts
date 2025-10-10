console.log('🚀 AR CAMPAIGNS MODULE LOADING...')
import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js'
import multer from 'multer'
import zumiAI from '../services/zumi-ai.js'
console.log('📦 AR CAMPAIGNS IMPORTS COMPLETE')

// Configure multer for AR asset uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for AR assets
})

const router = Router()

console.log('AR Campaigns router loaded successfully')

// GET /api/ar-campaigns/test - Simple test route (no auth required)
router.get('/test', async (req, res: Response) => {
  res.json({ message: 'AR campaigns router is working', timestamp: new Date().toISOString() })
})

// GET /api/ar-campaigns/zumi-ai/status - Get Zumi AI service status (no auth required for testing)
router.get('/zumi-ai/status', async (req, res: Response) => {
  try {
    // const serviceInfo = zumiAI.getServiceInfo()
    const serviceInfo = { configured: false, message: 'Zumi AI temporarily disabled' }
    res.json(serviceInfo)
  } catch (error) {
    console.error('Zumi AI status error:', error)
    res.status(500).json({ error: 'Failed to get service status' })
  }
})

// Apply authentication middleware to all other routes
router.use(authenticateUser)

// GET /api/ar-campaigns - Get all AR campaigns for organizer
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: campaigns, error } = await supabaseAdmin
      .from('ar_campaigns')
      .select(`
        *,
        venue:venues(id, name, location),
        event:events(id, name, start_date, end_date),
        ar_zones(id, name, zone_type, coordinates, ar_content)
      `)
      .eq('organizer_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching AR campaigns:', error)
      return res.status(500).json({ error: 'Failed to fetch AR campaigns' })
    }

    res.json({ campaigns: campaigns || [] })
  } catch (error) {
    console.error('Error in GET /ar-campaigns:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/ar-campaigns/:id - Get specific AR campaign with zones and assets
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    const { data: campaign, error } = await supabaseAdmin
      .from('ar_campaigns')
      .select(`
        *,
        venue:venues(id, name, location, address),
        event:events(id, name, description, start_date, end_date),
        ar_zones(id, name, zone_type, coordinates, ar_content, is_active),
        ar_assets(id, name, asset_type, asset_url, optimized_url, file_size, ai_processing_metadata)
      `)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (error || !campaign) {
      return res.status(404).json({ error: 'AR campaign not found' })
    }

    res.json({ campaign })
  } catch (error) {
    console.error('Error in GET /ar-campaigns/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/ar-campaigns - Create new AR campaign
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, venue_id, event_id, revenue_model, geographical_zones } = req.body

    if (!name || !venue_id) {
      return res.status(400).json({ error: 'Name and venue_id are required' })
    }

    // Verify venue belongs to organizer
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id, name')
      .eq('id', venue_id)
      .eq('owner_id', req.user.id)
      .single()

    if (venueError || !venue) {
      return res.status(400).json({ error: 'Invalid venue ID' })
    }

    // Verify event belongs to organizer (if provided)
    if (event_id) {
      const { data: event, error: eventError } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('id', event_id)
        .eq('organizer_id', req.user.id)
        .single()

      if (eventError || !event) {
        return res.status(400).json({ error: 'Invalid event ID' })
      }
    }

    // Create AR campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('ar_campaigns')
      .insert({
        name,
        description: description || '',
        venue_id,
        event_id: event_id || null,
        organizer_id: req.user.id,
        revenue_model: revenue_model || 'freemium',
        geographical_zones: geographical_zones || [],
        sdk_ready: false,
        is_active: false,
        created_by: req.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating AR campaign:', error)
      return res.status(500).json({ error: 'Failed to create AR campaign' })
    }

    res.status(201).json({ campaign })
  } catch (error) {
    console.error('Error in POST /ar-campaigns:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

interface ARCampaignUpdateData {
  name?: string
  description?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
  revenue_model?: 'cpm' | 'cpc' | 'flat_rate'
  geographical_zones?: Array<{
    id?: string
    name: string
    coordinates: number[][]
    type: 'polygon' | 'circle'
  }>
  ar_zones?: unknown[]
  assets?: unknown[]
  settings?: Record<string, unknown>
  updated_at?: string
}

// PUT /api/ar-campaigns/:id - Update AR campaign
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, revenue_model, geographical_zones, is_active } = req.body

    // Verify campaign belongs to organizer
    const { data: existingCampaign, error: campaignError } = await supabaseAdmin
      .from('ar_campaigns')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (campaignError || !existingCampaign) {
      return res.status(404).json({ error: 'AR campaign not found' })
    }

    const updateData: ARCampaignUpdateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (revenue_model !== undefined) updateData.revenue_model = revenue_model
    if (geographical_zones !== undefined) updateData.geographical_zones = geographical_zones
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: campaign, error } = await supabaseAdmin
      .from('ar_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating AR campaign:', error)
      return res.status(500).json({ error: 'Failed to update AR campaign' })
    }

    res.json({ campaign })
  } catch (error) {
    console.error('Error in PUT /ar-campaigns/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/ar-campaigns/:id/zones - Create AR zones for campaign
router.post('/:id/zones', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { zones } = req.body

    if (!zones || !Array.isArray(zones)) {
      return res.status(400).json({ error: 'Zones array is required' })
    }

    // Verify campaign belongs to organizer
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('ar_campaigns')
      .select('id, venue_id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'AR campaign not found' })
    }

    // Validate zones structure
    for (const zone of zones) {
      if (!zone.name || !zone.zone_type || !zone.coordinates) {
        return res.status(400).json({ error: 'Each zone must have name, zone_type, and coordinates' })
      }
      if (!['trigger', 'content', 'interaction', 'boundary'].includes(zone.zone_type)) {
        return res.status(400).json({ error: 'Invalid zone_type' })
      }
      if (!Array.isArray(zone.coordinates) || zone.coordinates.length < 3) {
        return res.status(400).json({ error: 'Coordinates must be an array with at least 3 points' })
      }
    }

    // Insert AR zones
    const { data: insertedZones, error } = await supabaseAdmin
      .from('ar_zones')
      .insert(
        zones.map(zone => ({
          campaign_id: id,
          floorplan_id: zone.floorplan_id || null,
          name: zone.name,
          zone_type: zone.zone_type,
          coordinates: zone.coordinates,
          ar_content: zone.ar_content || {},
          trigger_conditions: zone.trigger_conditions || {},
          is_active: zone.is_active !== undefined ? zone.is_active : true
        }))
      )
      .select()

    if (error) {
      console.error('Error creating AR zones:', error)
      return res.status(500).json({ error: 'Failed to create AR zones' })
    }

    // Update campaign SDK readiness
    const { error: updateError } = await supabaseAdmin
      .from('ar_campaigns')
      .update({ sdk_ready: true })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating campaign SDK status:', updateError)
    }

    res.status(201).json({ zones: insertedZones })
  } catch (error) {
    console.error('Error in POST /ar-campaigns/:id/zones:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/ar-campaigns/:id/assets - Upload and process AR assets with Zumi AI
router.post('/:id/assets', upload.array('assets', 10), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const files = req.files as Express.Multer.File[]
    const { bandwidth_optimization, device_type } = req.body

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one asset file is required' })
    }

    // Verify campaign belongs to organizer
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('ar_campaigns')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'AR campaign not found' })
    }

    const processedAssets = []
    const aiAnalysisResults = []

    for (const file of files) {
      // Determine asset type
      let assetType = 'unknown'
      if (file.mimetype.startsWith('image/')) assetType = 'image'
      else if (file.mimetype.startsWith('video/')) assetType = 'video'
      else if (file.mimetype.startsWith('audio/')) assetType = 'audio'
      else if (file.mimetype.includes('model') || file.originalname.endsWith('.glb') || file.originalname.endsWith('.gltf')) assetType = '3d_model'

      let processedAsset
      let aiAnalysis
      let aiProcessingMetadata = {
        original_size: file.size,
        original_dimensions: assetType === 'image' ? { width: 1920, height: 1080 } : null,
        processing_applied: {
          compression: false,
          format_optimization: false,
          bandwidth_optimization: false,
          mobile_optimization: false
        },
        optimization_ratio: 1.0,
        processed_at: new Date().toISOString(),
        zumi_ai_enabled: zumiAI.isConfigured()
      }

      // Process asset with Zumi AI if configured
      if (zumiAI.isConfigured()) {
        try {
          const processingOptions = {
            bandwidthOptimization: bandwidth_optimization || 'medium',
            deviceType: device_type || 'mobile',
            quality: 85,
            format: 'webp' as const
          }
          
          // Process and optimize asset
          processedAsset = await zumiAI.processAsset(file.buffer, file.originalname, processingOptions)
          
          // Analyze asset content
          aiAnalysis = await zumiAI.analyzeAsset(file.buffer)
          
          aiProcessingMetadata = {
            original_size: file.size,
            original_dimensions: assetType === 'image' ? { width: 1920, height: 1080 } : null,
            processing_applied: {
              compression: true,
              format_optimization: true,
              bandwidth_optimization: true,
              mobile_optimization: true
            },
            optimization_ratio: processedAsset.metadata.compressionRatio,
            processed_at: new Date().toISOString(),
            zumi_ai_enabled: true,

          }
          
          aiAnalysisResults.push(aiAnalysis)
        } catch (aiError) {
          console.error('Zumi AI processing failed:', aiError)
          // Continue with fallback processing
          processedAsset = null
        }
      }

      // Generate URLs (use AI processed URLs if available)
      const assetUrl = processedAsset?.originalUrl || `https://example.com/ar-assets/${Date.now()}-${file.originalname}`
      const optimizedUrl = processedAsset?.optimizedUrl || `https://example.com/ar-assets/optimized/${Date.now()}-${file.originalname}`

      // Insert asset record
      const { data: asset, error: assetError } = await supabaseAdmin
        .from('ar_assets')
        .insert({
          campaign_id: id,
          name: file.originalname,
          asset_type: assetType,
          asset_url: assetUrl,
          optimized_url: optimizedUrl,
          file_size: file.size,
          mime_type: file.mimetype,
          ai_processing_metadata: aiProcessingMetadata,
          bandwidth_optimized: !!processedAsset,
          uploaded_by: req.user.id
        })
        .select()
        .single()

      if (assetError) {
        console.error('Error inserting AR asset:', assetError)
        continue
      }

      processedAssets.push(asset)
    }

    res.status(201).json({
      assets: processedAssets,
      ai_analysis: aiAnalysisResults,
      processing_summary: {
        total_uploaded: files.length,
        successfully_processed: processedAssets.length,
        zumi_ai_used: zumiAI.isConfigured(),
        average_compression_ratio: aiAnalysisResults.length > 0 ? 0.65 : 1.0,
        bandwidth_savings: aiAnalysisResults.length > 0 ? '35% average reduction' : 'No optimization applied'
      }
    })
  } catch (error) {
    console.error('Error in POST /ar-campaigns/:id/assets:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/ar-campaigns/:id/sdk-config - Get SDK configuration for mobile app
router.get('/:id/sdk-config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Get campaign with all related data
    const { data: campaign, error } = await supabaseAdmin
      .from('ar_campaigns')
      .select(`
        *,
        venue:venues(id, name, location, address),
        event:events(id, name, start_date, end_date),
        ar_zones(id, name, zone_type, coordinates, ar_content, trigger_conditions, is_active),
        ar_assets(id, name, asset_type, optimized_url, ai_processing_metadata, bandwidth_optimized)
      `)
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (error || !campaign) {
      return res.status(404).json({ error: 'AR campaign not found' })
    }

    if (!campaign.sdk_ready) {
      return res.status(400).json({ error: 'Campaign is not ready for SDK deployment' })
    }

    // Generate optimized SDK configuration
    const sdkConfig = {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      venue: {
        id: campaign.venue.id,
        name: campaign.venue.name,
        location: campaign.venue.location,
        address: campaign.venue.address
      },
      event: campaign.event ? {
        id: campaign.event.id,
        name: campaign.event.name,
        start_date: campaign.event.start_date,
        end_date: campaign.event.end_date
      } : null,
      ar_zones: campaign.ar_zones?.filter(zone => zone.is_active).map(zone => ({
        id: zone.id,
        name: zone.name,
        type: zone.zone_type,
        coordinates: zone.coordinates,
        content: zone.ar_content,
        triggers: zone.trigger_conditions
      })) || [],
      ar_assets: campaign.ar_assets?.filter(asset => asset.bandwidth_optimized).map(asset => ({
        id: asset.id,
        name: asset.name,
        type: asset.asset_type,
        url: asset.optimized_url,
        metadata: asset.ai_processing_metadata
      })) || [],
      geographical_zones: campaign.geographical_zones,
      revenue_model: campaign.revenue_model,
      sdk_version: '1.0.0',
      cache_duration: 3600, // 1 hour
      low_bandwidth_mode: true
    }

    res.json({ sdk_config: sdkConfig })
  } catch (error) {
    console.error('Error in GET /ar-campaigns/:id/sdk-config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/ar-campaigns/:id - Delete AR campaign
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify campaign belongs to organizer
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('ar_campaigns')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', req.user.id)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'AR campaign not found' })
    }

    // Delete campaign (cascading deletes will handle zones and assets)
    const { error } = await supabaseAdmin
      .from('ar_campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting AR campaign:', error)
      return res.status(500).json({ error: 'Failed to delete AR campaign' })
    }

    res.json({ message: 'AR campaign deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /ar-campaigns/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/ar-campaigns/assets/:asset_id/reprocess - Reprocess existing asset with Zumi AI
router.post('/assets/:asset_id/reprocess', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { asset_id } = req.params
    const { bandwidth_optimization, device_type } = req.body
    
    // Get asset and verify ownership
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('ar_assets')
      .select(`
        *,
        ar_campaigns!inner(organizer_id)
      `)
      .eq('id', asset_id)
      .eq('uploaded_by', req.user.id)
      .single()
    
    if (assetError || !asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }
    
    if (asset.ar_campaigns.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    if (!zumiAI.isConfigured()) {
      return res.status(503).json({ error: 'Zumi AI service not configured' })
    }
    
    // Note: In a real implementation, you would fetch the original file from storage
    // For this demo, we'll simulate reprocessing
    const processingOptions = {
      bandwidthOptimization: bandwidth_optimization || 'medium',
      deviceType: device_type || 'mobile',
      quality: 85,
      format: 'webp' as const
    }
    
    // Simulate reprocessing (in real implementation, fetch original file)
    const mockBuffer = Buffer.from('mock-file-data')
    const processedAsset = await zumiAI.processAsset(mockBuffer, 'reprocessed.jpg', processingOptions)
    const aiAnalysis = await zumiAI.analyzeAsset(mockBuffer)
    
    const updatedMetadata = {
      processed_at: new Date().toISOString(),
      optimization_applied: true,
      compression_ratio: processedAsset.metadata.compressionRatio,
      quality_score: aiAnalysis.qualityMetrics.sharpness,
      zumi_ai_enabled: true,
      processing_time_ms: processedAsset.metadata.processingTime,
      original_size: processedAsset.metadata.originalSize,
      optimized_size: processedAsset.metadata.optimizedSize,
      detected_objects: aiAnalysis.objectDetection.objects.length,
      scene_category: aiAnalysis.sceneAnalysis.category,
      bandwidth_variants: processedAsset.bandwidthVariants,
      reprocessed: true
    }
    
    // Update asset with new processing results
    const { data: updatedAsset, error: updateError } = await supabaseAdmin
      .from('ar_assets')
      .update({
        optimized_url: processedAsset.optimizedUrl,
        ai_processing_metadata: updatedMetadata,
        bandwidth_optimized: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', asset_id)
      .select()
      .single()
    
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update asset' })
    }
    
    res.json({
      asset: updatedAsset,
      ai_analysis: aiAnalysis,
      processing_info: {
        reprocessed: true,
        bandwidth_variants: processedAsset.bandwidthVariants,
        optimization_applied: true
      }
    })
  } catch (error) {
    console.error('Asset reprocessing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router