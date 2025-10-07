import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft, Upload, Brain, MapPin, Shield, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface Venue {
  id: string
  name: string
}

interface POISuggestion {
  id: string
  type: 'entrance' | 'exit' | 'emergency_exit' | 'restroom' | 'elevator' | 'stairs' | 'info_desk' | 'food_court' | 'retail' | 'stage' | 'seating'
  coordinates: { x: number; y: number }
  confidence: number
  description: string
  safety_critical: boolean
}

interface ComplianceCheck {
  rule: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface AIAnalysisResult {
  poi_suggestions: POISuggestion[]
  compliance_checks: ComplianceCheck[]
  emergency_paths_detected: boolean
  accessibility_score: number
  safety_score: number
  recommendations: string[]
}

interface FormData {
  name: string
  venue_id: string
  floor_number: number
  description: string
  image_url: string
  width_meters: number
  height_meters: number
  scale_factor: number
}

export const AIFloorplanUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [selectedPOIs, setSelectedPOIs] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: '',
    venue_id: '',
    floor_number: 1,
    description: '',
    image_url: '',
    width_meters: 100,
    height_meters: 100,
    scale_factor: 1
  })

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/venues', {
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setVenues(data)
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
      toast.error('Failed to load venues')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB')
      return
    }

    try {
      setAnalyzing(true)
      setAnalysisResult(null)
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('analyze_pois', 'true')
      formDataUpload.append('check_compliance', 'true')

      const token = await getToken()
      const response = await fetch('/api/floorplans/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setFormData(prev => ({ ...prev, image_url: result.image_url }))
      
      // Start AI analysis
      if (result.upload_id) {
        await analyzeFloorplan(result.upload_id)
      }
      
    } catch (error) {
      console.error('Error uploading floorplan:', error)
      toast.error('Failed to upload floorplan')
      setAnalyzing(false)
    }
  }

  const analyzeFloorplan = async (uploadId: string) => {
    try {
      const token = await getToken()
      const response = await fetch('/api/floorplans/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          upload_id: uploadId,
          venue_id: formData.venue_id,
          floor_number: formData.floor_number,
          width_meters: formData.width_meters,
          height_meters: formData.height_meters
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      setAnalysisResult(result)
      
      // Auto-select safety-critical POIs
      const safetyCriticalPOIs = result.poi_suggestions
        .filter((poi: POISuggestion) => poi.safety_critical)
        .map((poi: POISuggestion) => poi.id)
      setSelectedPOIs(safetyCriticalPOIs)
      
      toast.success('AI analysis completed successfully!')
      
    } catch (error) {
      console.error('Error analyzing floorplan:', error)
      toast.error('Failed to analyze floorplan')
    } finally {
      setAnalyzing(false)
    }
  }

  const togglePOISelection = (poiId: string) => {
    setSelectedPOIs(prev => 
      prev.includes(poiId) 
        ? prev.filter(id => id !== poiId)
        : [...prev, poiId]
    )
  }

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getComplianceColor = (status: string, severity: string) => {
    if (status === 'pass') return 'bg-green-50 border-green-200'
    if (status === 'fail') {
      return severity === 'critical' ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200'
    }
    return 'bg-yellow-50 border-yellow-200'
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Floorplan name is required')
      return false
    }
    if (!formData.venue_id) {
      toast.error('Please select a venue')
      return false
    }
    if (!formData.image_url) {
      toast.error('Please upload a floorplan image')
      return false
    }
    if (analysisResult) {
      const criticalFailures = analysisResult.compliance_checks.filter(
        check => check.status === 'fail' && check.severity === 'critical'
      )
      if (criticalFailures.length > 0) {
        toast.error('Critical compliance issues must be resolved before saving')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setLoading(true)
      
      const floorplanData = {
        ...formData,
        poi_suggestions: analysisResult?.poi_suggestions.filter(poi => selectedPOIs.includes(poi.id)) || [],
        compliance_checks: analysisResult?.compliance_checks || [],
        ai_analysis: analysisResult ? {
          emergency_paths_detected: analysisResult.emergency_paths_detected,
          accessibility_score: analysisResult.accessibility_score,
          safety_score: analysisResult.safety_score,
          recommendations: analysisResult.recommendations
        } : null
      }
      
      const token = await getToken()
      const response = await fetch('/api/floorplans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(floorplanData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create floorplan')
      }
      
      const result = await response.json()
      toast.success('Floorplan created successfully!')
      navigate(`/floorplans/${result.floorplan.id}`)
      
    } catch (error) {
      console.error('Error creating floorplan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create floorplan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/floorplans')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI-Enhanced Floorplan Upload</h1>
          <p className="text-sm text-gray-500">Upload and analyze floorplans with AI-powered POI detection and compliance checking</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floorplan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter floorplan name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue *
                </label>
                <select
                  name="venue_id"
                  value={formData.venue_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>{venue.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Number *
                </label>
                <input
                  type="number"
                  name="floor_number"
                  value={formData.floor_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="-10"
                  max="100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (meters) *
                </label>
                <input
                  type="number"
                  name="width_meters"
                  value={formData.width_meters}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (meters) *
                </label>
                <input
                  type="number"
                  name="height_meters"
                  value={formData.height_meters}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10000"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe this floorplan"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-500" />
              Floorplan Image *
            </h3>
            
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {analyzing ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600">Analyzing floorplan with AI...</p>
                  </div>
                ) : formData.image_url ? (
                  <div className="space-y-2">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                    <p className="text-sm text-green-600">Floorplan uploaded successfully</p>
                    {analysisResult && (
                      <p className="text-xs text-blue-600">AI analysis completed</p>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a floorplan</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileUpload}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 20MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Analysis Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <Brain className="h-5 w-5 mr-2 text-blue-500" />
                  AI Analysis Results
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analysisResult.safety_score}%</div>
                    <div className="text-sm text-gray-600">Safety Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysisResult.accessibility_score}%</div>
                    <div className="text-sm text-gray-600">Accessibility Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analysisResult.poi_suggestions.length}</div>
                    <div className="text-sm text-gray-600">POIs Detected</div>
                  </div>
                </div>
                
                {analysisResult.emergency_paths_detected && (
                  <div className="mt-4 flex items-center text-green-700">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm">Emergency paths detected automatically</span>
                  </div>
                )}
              </div>

              {/* Compliance Checks */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Compliance Checks
                </h4>
                
                <div className="space-y-2">
                  {analysisResult.compliance_checks.map((check, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getComplianceColor(check.status, check.severity)}`}>
                      <div className="flex items-start space-x-3">
                        {getComplianceIcon(check.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{check.rule}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              check.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              check.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              check.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {check.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* POI Suggestions */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-500" />
                  POI Suggestions ({selectedPOIs.length} selected)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisResult.poi_suggestions.map((poi) => (
                    <div
                      key={poi.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPOIs.includes(poi.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => togglePOISelection(poi.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 capitalize">
                              {poi.type.replace('_', ' ')}
                            </span>
                            {poi.safety_critical && (
                              <Shield className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{poi.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Confidence: {Math.round(poi.confidence * 100)}%</span>
                            <span>({poi.coordinates.x}, {poi.coordinates.y})</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedPOIs.includes(poi.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedPOIs.includes(poi.id) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {analysisResult.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    AI Recommendations
                  </h4>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span className="text-sm text-gray-700">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/floorplans')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || analyzing || !formData.image_url}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Floorplan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AIFloorplanUploadPage