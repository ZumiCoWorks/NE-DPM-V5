import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft, Code, Copy, CheckCircle, ExternalLink, Key, Book, Smartphone, Shield, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface APIEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  title: string
  description: string
  category: string
  authentication: boolean
  parameters?: {
    name: string
    type: string
    required: boolean
    description: string
    example?: string
  }[]
  requestBody?: {
    type: string
    properties: Record<string, unknown>
    example: unknown
  }
  responses: {
    status: number
    description: string
    example: unknown
  }[]
  codeExamples: {
    language: string
    code: string
  }[]
}

interface SDKConfig {
  apiKey: string
  baseUrl: string
  version: string
}

interface APIDocumentationPageProps {
  onTabChange?: (tab: string) => void
}

export const APIDocumentationPage: React.FC<APIDocumentationPageProps> = ({ onTabChange }) => {
  const { getToken } = useAuth()
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null)
  const [sdkConfig, setSdkConfig] = useState<SDKConfig | null>(null)
  const [copiedCode, setCopiedCode] = useState<string>('')

  useEffect(() => {
    fetchAPIDocumentation()
    fetchSDKConfig()
  }, [])

  const fetchAPIDocumentation = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/mobile-sdk/documentation', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setEndpoints(data.endpoints || [])
        if (data.endpoints?.length > 0) {
          setSelectedEndpoint(data.endpoints[0])
        }
      }
    } catch (error) {
        console.error('Error fetching API documentation:', error)
        toast.error('Failed to load API documentation')
      }
  }, [getToken])

  const fetchSDKConfig = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/mobile-sdk/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSdkConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching SDK config:', error)
    }
  }, [getToken])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      toast.success('Code copied to clipboard')
      setTimeout(() => setCopiedCode(''), 2000)
    } catch {
      toast.error('Failed to copy code')
    }
  }

  const categories = [
    { id: 'all', name: 'All Endpoints', icon: Book },
    { id: 'mobile', name: 'Mobile SDK', icon: Smartphone },
    { id: 'emergency', name: 'Emergency Data', icon: Shield },
    { id: 'ar', name: 'AR Campaigns', icon: Zap },
    { id: 'venues', name: 'Venues & Maps', icon: ExternalLink }
  ]

  const filteredEndpoints = selectedCategory === 'all' 
    ? endpoints 
    : endpoints.filter(endpoint => endpoint.category === selectedCategory)

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Mock data for demonstration
  const mockEndpoints: APIEndpoint[] = [
    {
      id: '1',
      method: 'GET',
      path: '/api/mobile-sdk/venues/{venue_id}/emergency-data',
      title: 'Get Emergency Data',
      description: 'Retrieve emergency routes, exits, and assembly points for a specific venue',
      category: 'emergency',
      authentication: true,
      parameters: [
        { name: 'venue_id', type: 'string', required: true, description: 'Unique identifier for the venue', example: 'venue_123' },
        { name: 'floor_id', type: 'string', required: false, description: 'Optional floor filter', example: 'floor_456' }
      ],
      responses: [
        {
          status: 200,
          description: 'Emergency data retrieved successfully',
          example: {
            venue_id: 'venue_123',
            emergency_nodes: [
              {
                id: 'node_1',
                type: 'exit',
                name: 'Main Exit',
                coordinates: { x: 100, y: 200 },
                floor_id: 'floor_456',
                capacity: 500
              }
            ],
            emergency_paths: [
              {
                id: 'path_1',
                from_node_id: 'node_1',
                to_node_id: 'node_2',
                estimated_time_seconds: 45,
                safety_properties: {
                  fire_rated: true,
                  emergency_lighting: true
                }
              }
            ]
          }
        }
      ],
      codeExamples: [
        {
          language: 'javascript',
          code: `// JavaScript/React Native
const response = await fetch('${sdkConfig?.baseUrl || 'https://api.naveaze.com'}/api/mobile-sdk/venues/venue_123/emergency-data', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const emergencyData = await response.json();
console.log('Emergency nodes:', emergencyData.emergency_nodes);`
        },
        {
          language: 'swift',
          code: `// Swift/iOS
let url = URL(string: "${sdkConfig?.baseUrl || 'https://api.naveaze.com'}/api/mobile-sdk/venues/venue_123/emergency-data")!
var request = URLRequest(url: url)
request.setValue("Bearer YOUR_API_KEY", forHTTPHeaderField: "Authorization")

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data {
        let emergencyData = try? JSONSerialization.jsonObject(with: data)
        print("Emergency data:", emergencyData)
    }
}
task.resume()`
        },
        {
          language: 'kotlin',
          code: `// Kotlin/Android
val client = OkHttpClient()
val request = Request.Builder()
    .url("${sdkConfig?.baseUrl || 'https://api.naveaze.com'}/api/mobile-sdk/venues/venue_123/emergency-data")
    .addHeader("Authorization", "Bearer YOUR_API_KEY")
    .build()

client.newCall(request).enqueue(object : Callback {
    override fun onResponse(call: Call, response: Response) {
        val emergencyData = response.body?.string()
        println("Emergency data: $emergencyData")
    }
})`
        }
      ]
    },
    {
      id: '2',
      method: 'GET',
      path: '/api/mobile-sdk/venues/{venue_id}/ar-campaigns',
      title: 'Get Active AR Campaigns',
      description: 'Retrieve active AR campaigns for a specific venue with geographical zones',
      category: 'ar',
      authentication: true,
      parameters: [
        { name: 'venue_id', type: 'string', required: true, description: 'Unique identifier for the venue' },
        { name: 'user_location', type: 'object', required: false, description: 'User\'s current location for zone filtering' }
      ],
      responses: [
        {
          status: 200,
          description: 'AR campaigns retrieved successfully',
          example: {
            campaigns: [
              {
                id: 'campaign_1',
                name: 'Welcome Campaign',
                geographical_zones: [
                  {
                    id: 'zone_1',
                    coordinates: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
                    trigger_radius: 5.0
                  }
                ],
                ar_assets: [
                  {
                    id: 'asset_1',
                    type: '3d_model',
                    url: 'https://cdn.naveaze.com/assets/model_1.glb',
                    bandwidth_optimized: true
                  }
                ]
              }
            ]
          }
        }
      ],
      codeExamples: [
        {
          language: 'javascript',
          code: `// JavaScript/React Native with location
const userLocation = { latitude: 37.7749, longitude: -122.4194 };
const response = await fetch('${sdkConfig?.baseUrl || 'https://api.naveaze.com'}/api/mobile-sdk/venues/venue_123/ar-campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ user_location: userLocation })
});

const campaigns = await response.json();
campaigns.campaigns.forEach(campaign => {
  console.log('AR Campaign:', campaign.name);
});`
        }
      ]
    },
    {
      id: '3',
      method: 'GET',
      path: '/api/mobile-sdk/venues/{venue_id}/optimized-map',
      title: 'Get Optimized Map Data',
      description: 'Retrieve bandwidth-optimized map data for mobile rendering',
      category: 'mobile',
      authentication: true,
      parameters: [
        { name: 'venue_id', type: 'string', required: true, description: 'Unique identifier for the venue' },
        { name: 'quality', type: 'string', required: false, description: 'Map quality level (low, medium, high)', example: 'medium' },
        { name: 'cache_key', type: 'string', required: false, description: 'Client cache key for optimization' }
      ],
      responses: [
        {
          status: 200,
          description: 'Optimized map data retrieved successfully',
          example: {
            venue_id: 'venue_123',
            map_data: {
              floors: [
                {
                  id: 'floor_1',
                  level: 1,
                  optimized_image_url: 'https://cdn.naveaze.com/maps/optimized_floor_1.webp',
                  pois: [
                    {
                      id: 'poi_1',
                      name: 'Information Desk',
                      coordinates: { x: 150, y: 300 },
                      type: 'information'
                    }
                  ]
                }
              ]
            },
            cache_info: {
              expires_at: '2024-01-01T12:00:00Z',
              etag: 'abc123'
            }
          }
        }
      ],
      codeExamples: [
        {
          language: 'javascript',
          code: `// JavaScript with caching
const cacheKey = localStorage.getItem('map_cache_key');
const response = await fetch('${sdkConfig?.baseUrl || 'https://api.naveaze.com'}/api/mobile-sdk/venues/venue_123/optimized-map?quality=medium&cache_key=' + cacheKey, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'If-None-Match': localStorage.getItem('map_etag')
  }
});

if (response.status === 304) {
  // Use cached data
  console.log('Using cached map data');
} else {
  const mapData = await response.json();
  localStorage.setItem('map_etag', mapData.cache_info.etag);
  console.log('Updated map data:', mapData);
}`
        }
      ]
    }
  ]

  const displayEndpoints = endpoints.length > 0 ? filteredEndpoints : mockEndpoints.filter(e => 
    selectedCategory === 'all' || e.category === selectedCategory
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onTabChange?.('dashboard')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-sm text-gray-500">Mobile SDK integration guide and API reference</p>
        </div>
      </div>

      {/* SDK Configuration */}
      {sdkConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Key className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-blue-900">SDK Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Base URL</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm">
                  {sdkConfig.baseUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(sdkConfig.baseUrl, 'baseUrl')}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  {copiedCode === 'baseUrl' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">API Version</label>
              <code className="block px-3 py-2 bg-white border border-blue-300 rounded text-sm">
                {sdkConfig.version}
              </code>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">API Key</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm">
                  {sdkConfig.apiKey.substring(0, 8)}...{sdkConfig.apiKey.substring(sdkConfig.apiKey.length - 4)}
                </code>
                <button
                  onClick={() => copyToClipboard(sdkConfig.apiKey, 'apiKey')}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  {copiedCode === 'apiKey' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
            <nav className="space-y-2">
              {categories.map(category => {
                const Icon = category.icon
                const count = category.id === 'all' 
                  ? displayEndpoints.length 
                  : displayEndpoints.filter(e => e.category === category.id).length
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {category.name}
                    </div>
                    <span className="bg-gray-200 text-gray-600 px-2 py-1 text-xs rounded-full">
                      {count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Endpoints List */}
          <div className="bg-white shadow rounded-lg p-4 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Endpoints</h3>
            <div className="space-y-2">
              {displayEndpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedEndpoint?.id === endpoint.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    {endpoint.authentication && (
                      <Key className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">{endpoint.title}</div>
                  <div className="text-xs text-gray-500 font-mono">{endpoint.path}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Endpoint Details */}
        <div className="lg:col-span-3">
          {selectedEndpoint ? (
            <div className="bg-white shadow rounded-lg p-6">
              {/* Endpoint Header */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getMethodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-900">{selectedEndpoint.path}</code>
                  {selectedEndpoint.authentication && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Key className="h-4 w-4 mr-1" />
                      Auth Required
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedEndpoint.title}</h2>
                <p className="text-gray-600">{selectedEndpoint.description}</p>
              </div>

              {/* Parameters */}
              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Parameters</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedEndpoint.parameters.map((param, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm font-mono text-gray-900">{param.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{param.type}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {param.required ? 'Required' : 'Optional'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Response Examples */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Responses</h3>
                <div className="space-y-4">
                  {selectedEndpoint.responses.map((response, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          response.status < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {response.status}
                        </span>
                        <span className="text-sm text-gray-600">{response.description}</span>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Example Response</span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2), `response-${index}`)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {copiedCode === `response-${index}` ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <pre className="text-sm text-gray-800 overflow-x-auto">
                          <code>{JSON.stringify(response.example, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Examples */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Code Examples</h3>
                <div className="space-y-4">
                  {selectedEndpoint.codeExamples.map((example, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Code className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700 capitalize">{example.language}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(example.code, `code-${index}`)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {copiedCode === `code-${index}` ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="p-4">
                        <pre className="text-sm text-gray-800 overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Code className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Endpoint</h3>
              <p className="text-gray-500">Choose an API endpoint from the sidebar to view detailed documentation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default APIDocumentationPage