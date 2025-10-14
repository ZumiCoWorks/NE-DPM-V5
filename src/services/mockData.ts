// Mock data service for frontend-only mode - South African Demo Data 🇿🇦

export const mockVenues = [
  {
    id: '1',
    name: 'Sandton Convention Centre',
    address: 'Maude Street, Sandton, Johannesburg, 2196',
    description: 'Premier convention venue in the heart of Johannesburg\'s financial district',
    capacity: 5000,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2', 
    name: 'Cape Town International Convention Centre',
    address: 'Convention Square, 1 Lower Long Street, Cape Town, 8001',
    description: 'World-class convention centre with stunning Table Mountain views',
    capacity: 4500,
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Durban ICC',
    address: '45 Bram Fischer Road, Durban, 4001',
    description: 'Iconic waterfront venue on the Indian Ocean coastline',
    capacity: 3500,
    created_at: '2024-01-25T09:00:00Z',
    updated_at: '2024-01-25T09:00:00Z'
  }
];

export const mockEvents = [
  {
    id: '1',
    venue_id: '1',
    name: 'AfricaTech Summit 2025',
    description: 'Leading technology and innovation conference in Africa featuring AI, fintech, and digital transformation',
    start_date: '2025-11-15T08:00:00Z',
    end_date: '2025-11-17T18:00:00Z',
    status: 'active',
    expected_attendees: 3500,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  },
  {
    id: '2',
    venue_id: '2',
    name: 'Cape Innovation Week',
    description: 'Startup ecosystem showcase with venture capital, accelerators, and emerging tech',
    start_date: '2025-12-10T08:00:00Z',
    end_date: '2025-12-12T20:00:00Z',
    status: 'upcoming',
    expected_attendees: 2800,
    created_at: '2024-02-15T12:00:00Z',
    updated_at: '2024-02-15T12:00:00Z'
  },
  {
    id: '3',
    venue_id: '3',
    name: 'Durban Business Expo',
    description: 'Trade exhibition connecting businesses across Southern Africa',
    start_date: '2026-01-20T09:00:00Z',
    end_date: '2026-01-22T17:00:00Z',
    status: 'draft',
    expected_attendees: 4200,
    created_at: '2024-03-01T14:00:00Z',
    updated_at: '2024-03-01T14:00:00Z'
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
      name: 'MTN South Africa',
      booth_zones: ['hvz-mtn'],
      metrics: {
        total_visitors: 1247,
        unique_visitors: 892,
        avg_dwell_time: 8.5,
        conversion_rate: 0.34,
        revenue_impact: 156750,
        peak_hours: ['11:00', '14:00', '16:00']
      }
    },
    {
      vendor_id: 'vendor-2', 
      name: 'Discovery Health',
      booth_zones: ['hvz-discovery'],
      metrics: {
        total_visitors: 1089,
        unique_visitors: 756,
        avg_dwell_time: 7.2,
        conversion_rate: 0.41,
        revenue_impact: 132400,
        peak_hours: ['10:00', '13:00', '15:00']
      }
    },
    {
      vendor_id: 'vendor-3',
      name: 'Nedbank',
      booth_zones: ['hvz-nedbank'],
      metrics: {
        total_visitors: 923,
        unique_visitors: 645,
        avg_dwell_time: 6.8,
        conversion_rate: 0.38,
        revenue_impact: 98600,
        peak_hours: ['09:00', '12:00', '14:00']
      }
    },
    {
      vendor_id: 'vendor-4',
      name: 'Shoprite Holdings',
      booth_zones: ['hvz-shoprite'],
      metrics: {
        total_visitors: 1456,
        unique_visitors: 1034,
        avg_dwell_time: 5.4,
        conversion_rate: 0.29,
        revenue_impact: 87300,
        peak_hours: ['11:00', '13:00', '16:00']
      }
    }
  ],
  comparative_data: {
    industry_avg_dwell_time: 4.8,
    industry_avg_conversion: 0.22,
    total_event_revenue: 475050,
    load_shedding_impact: 'Minimal - backup systems operational'
  }
};

// Mock CDV (Contextual Dwell Value) Analytics Data 🇿🇦
export const mockCDVAnalytics = {
  realtime_metrics: {
    active_attendees: 3247,
    high_value_zones: 8,
    current_revenue_rate: 12450,
    avg_engagement_score: 0.78,
    load_shedding_status: 'Stage 0 - No load shedding',
    last_updated: new Date().toISOString()
  },
  hvz_performance: [
    {
      zone_id: 'hvz-mtn',
      sponsor: 'MTN South Africa',
      attendees_in_zone: 47,
      avg_dwell_time: 8.5,
      hourly_rate: 1250,
      current_revenue: 4985,
      engagement_quality: 'high',
      currency: 'ZAR'
    },
    {
      zone_id: 'hvz-discovery',
      sponsor: 'Discovery Health',
      attendees_in_zone: 38,
      avg_dwell_time: 7.2,
      hourly_rate: 1150,
      current_revenue: 3542,
      engagement_quality: 'high',
      currency: 'ZAR'
    },
    {
      zone_id: 'hvz-nedbank',
      sponsor: 'Nedbank',
      attendees_in_zone: 29,
      avg_dwell_time: 6.8,
      hourly_rate: 950,
      current_revenue: 2436,
      engagement_quality: 'medium',
      currency: 'ZAR'
    },
    {
      zone_id: 'hvz-shoprite',
      sponsor: 'Shoprite Holdings',
      attendees_in_zone: 52,
      avg_dwell_time: 5.4,
      hourly_rate: 800,
      current_revenue: 2347,
      engagement_quality: 'medium',
      currency: 'ZAR'
    },
    {
      zone_id: 'hvz-standardbank',
      sponsor: 'Standard Bank',
      attendees_in_zone: 34,
      avg_dwell_time: 7.9,
      hourly_rate: 1100,
      current_revenue: 2992,
      engagement_quality: 'high',
      currency: 'ZAR'
    }
  ],
  time_series: Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    revenue: Math.floor(8000 + Math.random() * 4000),
    attendees: Math.floor(200 + Math.random() * 150),
    avg_dwell: 5 + Math.random() * 4
  })),
  sponsor_leaderboard: [
    { sponsor: 'MTN South Africa', revenue: 156750, growth: '+12%', emoji: '🥇' },
    { sponsor: 'Discovery Health', revenue: 132400, growth: '+8%', emoji: '🥈' },
    { sponsor: 'Nedbank', revenue: 98600, growth: '+15%', emoji: '🥉' },
    { sponsor: 'Shoprite Holdings', revenue: 87300, growth: '+6%', emoji: '📊' },
    { sponsor: 'Standard Bank', revenue: 76200, growth: '+10%', emoji: '📊' }
  ]
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