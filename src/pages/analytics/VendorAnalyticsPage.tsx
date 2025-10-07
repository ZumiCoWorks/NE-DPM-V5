import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Users, TrendingUp, DollarSign, Eye, Download, Key, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface Vendor {
  id: string
  name: string
  contact_email: string
  subscription_tier: 'basic' | 'premium' | 'enterprise'
  api_key: string
  access_level: string[]
  created_at: string
  last_access?: string
  is_active: boolean
}

interface VendorAnalytics {
  vendor_id: string
  total_visitors: number
  unique_visitors: number
  avg_dwell_time: number
  peak_hours: string[]
  conversion_metrics?: {
    impressions: number
    interactions: number
    conversion_rate: number
  }
  zone_performance: {
    zone_id: string
    zone_name: string
    visitors: number
    engagement_score: number
  }[]
  time_series: {
    timestamp: string
    visitors: number
    engagement: number
  }[]
}

interface VendorData {
  vendors: Vendor[]
  selectedVendorAnalytics?: VendorAnalytics
  aggregatedStats: {
    totalVendors: number
    activeVendors: number
    totalApiCalls: number
    revenueGenerated: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const VendorAnalyticsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [vendorData, setVendorData] = useState<VendorData | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: '',
    contact_email: '',
    subscription_tier: 'basic' as const
  })
  const [showAddVendor, setShowAddVendor] = useState(false)

  const fetchVendorData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/auth')
        return
      }

      // Fetch all vendors
      const vendorsResponse = await fetch('/api/analytics/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!vendorsResponse.ok) {
        throw new Error('Failed to fetch vendor data')
      }

      const vendorsData = await vendorsResponse.json()
      
      let selectedAnalytics = undefined
      if (selectedVendor) {
        // Fetch analytics for selected vendor
        const analyticsResponse = await fetch(`/api/analytics/vendor/${selectedVendor}/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (analyticsResponse.ok) {
          selectedAnalytics = await analyticsResponse.json()
        }
      }

      setVendorData({
        ...vendorsData,
        selectedVendorAnalytics: selectedAnalytics
      })
    } catch (error) {
      console.error('Error fetching vendor data:', error)
      toast.error('Failed to load vendor data')
    } finally {
      setLoading(false)
    }
  }

  const addVendor = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/analytics/vendors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newVendor)
      })

      if (!response.ok) {
        throw new Error('Failed to add vendor')
      }

      toast.success('Vendor added successfully')
      setShowAddVendor(false)
      setNewVendor({ name: '', contact_email: '', subscription_tier: 'basic' })
      fetchVendorData()
    } catch (error) {
      console.error('Error adding vendor:', error)
      toast.error('Failed to add vendor')
    }
  }

  const toggleVendorStatus = async (vendorId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/analytics/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update vendor status')
      }

      toast.success(`Vendor ${!isActive ? 'activated' : 'deactivated'} successfully`)
      fetchVendorData()
    } catch (error) {
      console.error('Error updating vendor status:', error)
      toast.error('Failed to update vendor status')
    }
  }

  const regenerateApiKey = async (vendorId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/analytics/vendors/${vendorId}/regenerate-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate API key')
      }

      toast.success('API key regenerated successfully')
      fetchVendorData()
    } catch (error) {
      console.error('Error regenerating API key:', error)
      toast.error('Failed to regenerate API key')
    }
  }

  const exportVendorData = async (vendorId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/analytics/vendor/${vendorId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export vendor data')
      }

      const data = await response.json()
      const csvContent = data.csvData
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vendor-analytics-${vendorId}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Vendor data exported successfully')
    } catch (error) {
      console.error('Error exporting vendor data:', error)
      toast.error('Failed to export vendor data')
    }
  }

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return {
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          label: 'Enterprise',
          features: ['Full Analytics', 'Real-time Data', 'Custom Reports', 'Priority Support']
        }
      case 'premium':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          label: 'Premium',
          features: ['Advanced Analytics', 'Hourly Updates', 'Standard Reports']
        }
      case 'basic':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          label: 'Basic',
          features: ['Basic Analytics', 'Daily Updates']
        }
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: 'Unknown',
          features: []
        }
    }
  }

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return 'Not generated'
    return showApiKeys ? apiKey : `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
  }

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Never'
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return time.toLocaleDateString()
  }

  useEffect(() => {
    fetchVendorData()
  }, [eventId, selectedVendor])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vendor analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 border-l border-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Vendor Analytics</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showApiKeys}
                  onChange={(e) => setShowApiKeys(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show API Keys</span>
              </label>
              
              <button
                onClick={() => setShowAddVendor(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Vendor
              </button>
              
              <button
                onClick={fetchVendorData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vendorData?.aggregatedStats.totalVendors || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <p className="text-2xl font-bold text-green-600">
                  {vendorData?.aggregatedStats.activeVendors || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">API Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vendorData?.aggregatedStats.totalApiCalls?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${vendorData?.aggregatedStats.revenueGenerated?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vendor List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Vendors</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {vendorData?.vendors.map((vendor) => {
                  const tierConfig = getTierConfig(vendor.subscription_tier)
                  return (
                    <div
                      key={vendor.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedVendor === vendor.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedVendor(vendor.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierConfig.bg} ${tierConfig.color}`}>
                            {tierConfig.label}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            vendor.is_active ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{vendor.contact_email}</p>
                      <p className="text-xs text-gray-500">
                        Last access: {formatTimeAgo(vendor.last_access)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="lg:col-span-2">
            {selectedVendor ? (
              <div className="space-y-6">
                {/* Vendor Info */}
                {(() => {
                  const vendor = vendorData?.vendors.find(v => v.id === selectedVendor)
                  if (!vendor) return null
                  
                  const tierConfig = getTierConfig(vendor.subscription_tier)
                  
                  return (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{vendor.name}</h3>
                          <p className="text-gray-600">{vendor.contact_email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleVendorStatus(vendor.id, vendor.is_active)}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                              vendor.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {vendor.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => exportVendorData(vendor.id)}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tierConfig.bg} ${tierConfig.color}`}>
                            {tierConfig.label}
                          </span>
                          <ul className="mt-2 text-xs text-gray-600">
                            {tierConfig.features.map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                          <div className="flex items-center space-x-2">
                            <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                              {maskApiKey(vendor.api_key)}
                            </code>
                            <button
                              onClick={() => regenerateApiKey(vendor.id)}
                              className="flex items-center px-2 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                              title="Regenerate API Key"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Analytics Charts */}
                {vendorData?.selectedVendorAnalytics && (
                  <>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                          <Users className="h-6 w-6 text-blue-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                            <p className="text-xl font-bold text-gray-900">
                              {vendorData.selectedVendorAnalytics.total_visitors.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                          <Eye className="h-6 w-6 text-green-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                            <p className="text-xl font-bold text-gray-900">
                              {vendorData.selectedVendorAnalytics.unique_visitors.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Avg Dwell Time</p>
                            <p className="text-xl font-bold text-gray-900">
                              {Math.round(vendorData.selectedVendorAnalytics.avg_dwell_time)}s
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Series Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Visitor Trends</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={vendorData.selectedVendorAnalytics.time_series}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="timestamp" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            fontSize={12}
                          />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="visitors" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Visitors"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="engagement" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Engagement Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Zone Performance */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Zone Performance</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={vendorData.selectedVendorAnalytics.zone_performance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="zone_name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="visitors" fill="#3b82f6" name="Visitors" />
                          <Bar dataKey="engagement_score" fill="#10b981" name="Engagement Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Vendor</h3>
                <p className="text-gray-600">Choose a vendor from the list to view their analytics and manage their access.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Vendor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter vendor name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={newVendor.contact_email}
                  onChange={(e) => setNewVendor({ ...newVendor, contact_email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter contact email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
                <select
                  value={newVendor.subscription_tier}
                  onChange={(e) => setNewVendor({ ...newVendor, subscription_tier: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddVendor(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addVendor}
                disabled={!newVendor.name || !newVendor.contact_email}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorAnalyticsPage