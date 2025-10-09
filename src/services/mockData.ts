// Mock data service for frontend-only mode

export const mockVenues = [
  {
    id: '1',
    name: 'Grand Convention Center',
    address: '123 Main St, Downtown',
    description: 'Large convention center with multiple halls',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2', 
    name: 'Tech Hub Arena',
    address: '456 Innovation Blvd, Tech District',
    description: 'Modern tech conference venue',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  }
];

export const mockEvents = [
  {
    id: '1',
    venue_id: '1',
    name: 'Tech Conference 2024',
    description: 'Annual technology conference',
    start_date: '2024-03-15T09:00:00Z',
    end_date: '2024-03-17T18:00:00Z',
    status: 'active',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  },
  {
    id: '2',
    venue_id: '2',
    name: 'Innovation Summit',
    description: 'Startup and innovation showcase',
    start_date: '2024-04-10T08:00:00Z',
    end_date: '2024-04-12T20:00:00Z',
    status: 'draft',
    created_at: '2024-02-15T12:00:00Z',
    updated_at: '2024-02-15T12:00:00Z'
  }
];

export const mockFloorplans = [
  {
    id: '1',
    venue_id: '1',
    name: 'Main Hall Layout',
    description: 'Primary conference hall floorplan',
    image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20conference%20hall%20floorplan%20layout&image_size=landscape_16_9',
    nodes: [
      { id: 'entrance', x: 100, y: 50, type: 'entrance', label: 'Main Entrance' },
      { id: 'stage', x: 400, y: 100, type: 'stage', label: 'Main Stage' },
      { id: 'booth1', x: 200, y: 200, type: 'booth', label: 'Tech Booth 1' },
      { id: 'booth2', x: 300, y: 200, type: 'booth', label: 'Innovation Booth' }
    ],
    zones: [
      { id: 'main-area', name: 'Main Conference Area', coordinates: [[150, 80], [450, 80], [450, 250], [150, 250]] },
      { id: 'networking', name: 'Networking Zone', coordinates: [[50, 300], [200, 300], [200, 400], [50, 400]] }
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

export const mockARCampaigns = [
  {
    id: '1',
    event_id: '1',
    name: 'Welcome AR Experience',
    description: 'Interactive welcome message for attendees',
    trigger_type: 'location',
    trigger_data: { zone_id: 'entrance', radius: 5 },
    ar_content: {
      type: '3d_model',
      model_url: '/models/welcome-sign.glb',
      animation: 'float'
    },
    status: 'active',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  },
  {
    id: '2',
    event_id: '1',
    name: 'Product Showcase AR',
    description: 'Interactive product demonstrations',
    trigger_type: 'marker',
    trigger_data: { marker_id: 'booth1-qr' },
    ar_content: {
      type: 'video',
      video_url: '/videos/product-demo.mp4',
      overlay_text: 'Tap to learn more'
    },
    status: 'active',
    created_at: '2024-02-05T14:00:00Z',
    updated_at: '2024-02-05T14:00:00Z'
  }
];

export const mockNavigationPaths = [
  {
    id: '1',
    floorplan_id: '1',
    name: 'Emergency Exit Route A',
    path_type: 'emergency',
    waypoints: [
      { x: 100, y: 50, instruction: 'Start at main entrance' },
      { x: 150, y: 100, instruction: 'Head towards emergency exit' },
      { x: 50, y: 150, instruction: 'Emergency Exit A' }
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

export const mockHeatmapData = {
  zones: [
    { zone_id: 'main-area', visitor_count: 245, density: 0.8, timestamp: '2024-03-15T14:30:00Z' },
    { zone_id: 'networking', visitor_count: 89, density: 0.4, timestamp: '2024-03-15T14:30:00Z' },
    { zone_id: 'entrance', visitor_count: 156, density: 0.9, timestamp: '2024-03-15T14:30:00Z' }
  ],
  updated_at: '2024-03-15T14:30:00Z'
};

export const mockEngagementData = {
  metrics: [
    { zone_id: 'main-area', avg_dwell_time: 1200, interaction_rate: 0.75, peak_time: '14:30' },
    { zone_id: 'networking', avg_dwell_time: 800, interaction_rate: 0.65, peak_time: '12:15' },
    { zone_id: 'booth1', avg_dwell_time: 450, interaction_rate: 0.85, peak_time: '11:45' }
  ],
  trends: {
    hourly_engagement: [
      { hour: '09:00', engagement_score: 0.3 },
      { hour: '10:00', engagement_score: 0.5 },
      { hour: '11:00', engagement_score: 0.8 },
      { hour: '12:00', engagement_score: 0.9 },
      { hour: '13:00', engagement_score: 0.7 },
      { hour: '14:00', engagement_score: 0.95 },
      { hour: '15:00', engagement_score: 0.8 }
    ]
  }
};

export const mockBottleneckAlerts = [
  {
    id: '1',
    zone_id: 'entrance',
    alert_type: 'congestion',
    severity: 'high',
    message: 'High congestion detected at main entrance',
    visitor_count: 156,
    threshold: 100,
    timestamp: '2024-03-15T14:30:00Z',
    status: 'active'
  },
  {
    id: '2',
    zone_id: 'booth1',
    alert_type: 'queue_length',
    severity: 'medium',
    message: 'Queue length exceeding normal capacity',
    visitor_count: 45,
    threshold: 30,
    timestamp: '2024-03-15T13:45:00Z',
    status: 'resolved'
  }
];

export const mockVendorAnalytics = {
  vendors: [
    {
      vendor_id: 'vendor-1',
      name: 'TechCorp Solutions',
      booth_zones: ['booth1'],
      metrics: {
        total_visitors: 234,
        unique_visitors: 189,
        avg_dwell_time: 450,
        conversion_rate: 0.23,
        peak_hours: ['11:00', '14:00']
      }
    },
    {
      vendor_id: 'vendor-2', 
      name: 'Innovation Labs',
      booth_zones: ['booth2'],
      metrics: {
        total_visitors: 178,
        unique_visitors: 156,
        avg_dwell_time: 380,
        conversion_rate: 0.31,
        peak_hours: ['10:00', '15:00']
      }
    }
  ],
  comparative_data: {
    industry_avg_dwell_time: 320,
    industry_avg_conversion: 0.18
  }
};

export const mockUserProfile = {
  id: 'user-1',
  user_id: 'auth-user-1',
  email: 'demo@naveaze.com',
  full_name: 'Demo User',
  role: 'organizer',
  organization: 'NavEaze Demo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// Mock API responses
export const mockApiResponses = {
  '/auth/profile': { data: mockUserProfile },
  '/venues': { data: mockVenues },
  '/events': { data: mockEvents },
  '/floorplans': { data: mockFloorplans },
  '/ar-campaigns': { data: mockARCampaigns },
  '/navigation-paths': { data: mockNavigationPaths },
  '/analytics/heatmap': { data: mockHeatmapData },
  '/analytics/engagement': { data: mockEngagementData },
  '/analytics/bottlenecks': { data: mockBottleneckAlerts },
  '/analytics/vendors': { data: mockVendorAnalytics }
};