import React, { useState, useEffect, useCallback } from 'react'
// Removed React Router dependencies
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Route, Clock, Users, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface Venue {
  id: string
  name: string
}

interface Floorplan {
  id: string
  name: string
  floor_number: number
  venue_id: string
}

interface EmergencyNode {
  id: string
  name: string
  type: 'exit' | 'assembly_point' | 'emergency_equipment' | 'safe_zone'
  coordinates: { x: number; y: number }
  floor_id: string
  capacity?: number
  equipment_type?: string
  accessibility_features: string[]
}

interface EmergencyPath {
  id: string
  name: string
  from_node_id: string
  to_node_id: string
  floor_id: string
  path_coordinates: { x: number; y: number }[]
  width_meters: number
  max_capacity: number
  estimated_time_seconds: number
  accessibility_compliant: boolean
  safety_properties: {
    fire_rated: boolean
    smoke_protected: boolean
    emergency_lighting: boolean
    clear_signage: boolean
    obstacle_free: boolean
  }
  compliance_validated: boolean
}

interface ComplianceRule {
  id: string
  name: string
  description: string
  category: 'width' | 'capacity' | 'accessibility' | 'signage' | 'lighting' | 'equipment'
  required: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface ComplianceCheck {
  rule_id: string
  status: 'pass' | 'fail' | 'warning' | 'not_applicable'
  message: string
  details?: string
}

interface EmergencyRouteConfigPageProps {
  floorplanId?: string
  onNavigateBack?: () => void
}

export const EmergencyRouteConfigPage: React.FC<EmergencyRouteConfigPageProps> = ({ 
  floorplanId,
  onNavigateBack 
}) => {
  const { getToken } = useAuth()
  const [validating, setValidating] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [floorplans, setFloorplans] = useState<Floorplan[]>([])
  const [emergencyNodes, setEmergencyNodes] = useState<EmergencyNode[]>([])
  const [emergencyPaths, setEmergencyPaths] = useState<EmergencyPath[]>([])
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([])
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([])
  const [selectedFloorplan, setSelectedFloorplan] = useState<string>(floorplanId || '')
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [editingNode, setEditingNode] = useState<EmergencyNode | null>(null)
  // Future modal state for editing emergency paths and nodes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingPath, setEditingPath] = useState<EmergencyPath | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showNodeModal, setShowNodeModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPathModal, setShowPathModal] = useState(false)

  const fetchVenues = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/venues', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setVenues(data.venues || [])
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
      toast.error('Failed to load venues')
    }
  }, [getToken])

  const fetchFloorplans = useCallback(async (venueId: string) => {
    try {
      const token = await getToken()
      const response = await fetch(`/api/floorplans?venue_id=${venueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFloorplans(data.floorplans || [])
      }
    } catch (error) {
      console.error('Error fetching floorplans:', error)
      toast.error('Failed to load floorplans')
    }
  }, [getToken])

  const validateCompliance = useCallback(async (floorplanId: string) => {
    try {
      setValidating(true)
      const token = await getToken()
      const response = await fetch('/api/emergency/validate-compliance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ floor_id: floorplanId })
      })

      if (response.ok) {
        const data = await response.json()
        setComplianceChecks(data.checks || [])
      }
    } catch (error) {
      console.error('Error validating compliance:', error)
      toast.error('Failed to validate compliance')
    } finally {
      setValidating(false)
    }
  }, [getToken])

  const fetchFloorplanData = useCallback(async (floorplanId: string) => {
    try {
      const [poisResponse, nodesResponse, pathsResponse] = await Promise.all([
        fetch(`/api/floorplans/${floorplanId}/pois`, {
          headers: { 'Authorization': `Bearer ${await getToken()}` }
        }),
        fetch(`/api/emergency/nodes?floor_id=${floorplanId}`, {
          headers: { 'Authorization': `Bearer ${await getToken()}` }
        }),
        fetch(`/api/emergency/paths?floor_id=${floorplanId}`, {
          headers: { 'Authorization': `Bearer ${await getToken()}` }
        })
      ])

      if (poisResponse.ok) {
        await poisResponse.json()
        // POI data loaded but not used in current implementation
      }

      if (nodesResponse.ok) {
        const nodesData = await nodesResponse.json()
        setEmergencyNodes(nodesData.nodes || [])
      }

      if (pathsResponse.ok) {
        const pathsData = await pathsResponse.json()
        setEmergencyPaths(pathsData.paths || [])
      }

      // Auto-validate compliance
      validateCompliance(floorplanId)

    } catch (error) {
      console.error('Error fetching floorplan data:', error)
      toast.error('Failed to load floorplan data')
    }
  }, [getToken, validateCompliance])

  const fetchComplianceRules = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/emergency/compliance-rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setComplianceRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching compliance rules:', error)
    }
  }, [getToken])

  const createEmergencyNode = useCallback(async (nodeData: Partial<EmergencyNode>) => {
    try {
      const token = await getToken()
      const response = await fetch('/api/emergency/nodes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...nodeData, floor_id: selectedFloorplan })
      })

      if (response.ok) {
        const data = await response.json()
        setEmergencyNodes(prev => [...prev, data.node])
        toast.success('Emergency node created successfully')
        setEditingNode(null)
        validateCompliance(selectedFloorplan)
      }
    } catch (error) {
      console.error('Error creating emergency node:', error)
      toast.error('Failed to create emergency node')
    }
  }, [getToken, selectedFloorplan, validateCompliance])

  // useEffect hooks
  useEffect(() => {
    fetchVenues()
    fetchComplianceRules()
  }, [fetchVenues, fetchComplianceRules])

  useEffect(() => {
    if (selectedVenue) {
      fetchFloorplans(selectedVenue)
    }
  }, [selectedVenue, fetchFloorplans])

  useEffect(() => {
    if (selectedFloorplan) {
      fetchFloorplanData(selectedFloorplan)
    }
  }, [selectedFloorplan, fetchFloorplanData])

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

  const criticalIssues = complianceChecks.filter(check => 
    check.status === 'fail' && complianceRules.find(rule => rule.id === check.rule_id)?.severity === 'critical'
  )

  const passedChecks = complianceChecks.filter(check => check.status === 'pass')
  const complianceScore = complianceChecks.length > 0 ? Math.round((passedChecks.length / complianceChecks.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onNavigateBack?.()}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Route Configuration</h1>
          <p className="text-sm text-gray-500">Configure emergency routes with safety compliance validation</p>
        </div>
      </div>

      {/* Venue & Floorplan Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Floorplan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floorplan</label>
            <select
              value={selectedFloorplan}
              onChange={(e) => setSelectedFloorplan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedVenue}
            >
              <option value="">Select a floorplan</option>
              {floorplans.map(floorplan => (
                <option key={floorplan.id} value={floorplan.id}>
                  {floorplan.name} (Floor {floorplan.floor_number})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedFloorplan && (
        <>
          {/* Compliance Dashboard */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                Safety Compliance Dashboard
              </h3>
              <button
                onClick={() => validateCompliance(selectedFloorplan)}
                disabled={validating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {validating ? 'Validating...' : 'Re-validate'}
              </button>
            </div>

            {/* Compliance Score */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{complianceScore}%</div>
                <div className="text-sm text-gray-600">Compliance Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{passedChecks.length}</div>
                <div className="text-sm text-gray-600">Passed Checks</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{criticalIssues.length}</div>
                <div className="text-sm text-gray-600">Critical Issues</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{emergencyPaths.length}</div>
                <div className="text-sm text-gray-600">Emergency Paths</div>
              </div>
            </div>

            {/* Critical Issues Alert */}
            {criticalIssues.length > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium text-red-800">
                    {criticalIssues.length} Critical Safety Issue{criticalIssues.length > 1 ? 's' : ''} Found
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  These issues must be resolved before the emergency routes can be approved.
                </p>
              </div>
            )}

            {/* Compliance Checks */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Compliance Checks</h4>
              {complianceChecks.length === 0 ? (
                <p className="text-sm text-gray-500">No compliance checks available. Configure emergency routes to see validation results.</p>
              ) : (
                <div className="space-y-2">
                  {complianceChecks.map((check, index) => {
                    const rule = complianceRules.find(r => r.id === check.rule_id)
                    if (!rule) return null
                    
                    return (
                      <div key={index} className={`p-3 rounded-lg border ${getComplianceColor(check.status, rule.severity)}`}>
                        <div className="flex items-start space-x-3">
                          {getComplianceIcon(check.status)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{rule.name}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {rule.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                            {check.details && (
                              <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Emergency Nodes */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-500" />
                Emergency Nodes ({emergencyNodes.length})
              </h3>
              <button
                onClick={() => setEditingNode({ 
                  id: '', name: '', type: 'exit', coordinates: { x: 0, y: 0 }, 
                  floor_id: selectedFloorplan, accessibility_features: [] 
                })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Add Node
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyNodes.map(node => (
                <div key={node.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{node.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      node.type === 'exit' ? 'bg-red-100 text-red-800' :
                      node.type === 'assembly_point' ? 'bg-green-100 text-green-800' :
                      node.type === 'emergency_equipment' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {node.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Position: ({node.coordinates.x}, {node.coordinates.y})</div>
                    {node.capacity && <div>Capacity: {node.capacity} people</div>}
                    {node.equipment_type && <div>Equipment: {node.equipment_type}</div>}
                    {node.accessibility_features.length > 0 && (
                      <div>Accessibility: {node.accessibility_features.join(', ')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Paths */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Route className="h-5 w-5 mr-2 text-blue-500" />
                Emergency Paths ({emergencyPaths.length})
              </h3>
              <button
                onClick={() => setEditingPath({
                  id: '', name: '', from_node_id: '', to_node_id: '', floor_id: selectedFloorplan,
                  path_coordinates: [], width_meters: 1.2, max_capacity: 100, estimated_time_seconds: 60,
                  accessibility_compliant: false, compliance_validated: false,
                  safety_properties: {
                    fire_rated: false, smoke_protected: false, emergency_lighting: false,
                    clear_signage: false, obstacle_free: false
                  }
                })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={emergencyNodes.length < 2}
              >
                Add Path
              </button>
            </div>

            {emergencyNodes.length < 2 ? (
              <div className="text-center py-8 text-gray-500">
                <Route className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>Add at least 2 emergency nodes to create paths</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emergencyPaths.map(path => {
                  const fromNode = emergencyNodes.find(n => n.id === path.from_node_id)
                  const toNode = emergencyNodes.find(n => n.id === path.to_node_id)
                  
                  return (
                    <div key={path.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">{path.name}</span>
                        <div className="flex items-center space-x-2">
                          {path.compliance_validated ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {path.accessibility_compliant && (
                            <Shield className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="font-medium">Route</div>
                          <div>{fromNode?.name} → {toNode?.name}</div>
                        </div>
                        <div>
                          <div className="font-medium flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            Capacity
                          </div>
                          <div>{path.max_capacity} people</div>
                        </div>
                        <div>
                          <div className="font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Est. Time
                          </div>
                          <div>{path.estimated_time_seconds}s</div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="font-medium text-sm text-gray-700 mb-2">Safety Properties</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(path.safety_properties).map(([key, value]) => (
                            <span key={key} className={`px-2 py-1 text-xs rounded-full ${
                              value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {key.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Node Creation Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Emergency Node</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingNode.name}
                  onChange={(e) => setEditingNode({...editingNode, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Emergency node name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editingNode.type}
                  onChange={(e) => setEditingNode({...editingNode, type: e.target.value as EmergencyNode['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="exit">Exit</option>
                  <option value="assembly_point">Assembly Point</option>
                  <option value="emergency_equipment">Emergency Equipment</option>
                  <option value="safe_zone">Safe Zone</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X Coordinate</label>
                  <input
                    type="number"
                    value={editingNode.coordinates.x}
                    onChange={(e) => setEditingNode({
                      ...editingNode, 
                      coordinates: {...editingNode.coordinates, x: parseFloat(e.target.value) || 0}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y Coordinate</label>
                  <input
                    type="number"
                    value={editingNode.coordinates.y}
                    onChange={(e) => setEditingNode({
                      ...editingNode, 
                      coordinates: {...editingNode.coordinates, y: parseFloat(e.target.value) || 0}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingNode(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createEmergencyNode(editingNode)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Create Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmergencyRouteConfigPage