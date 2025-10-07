import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Calendar,
  MapPin,
  Zap,
  Shield,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'

interface GeographicalZone {
  id: string
  name: string
  coordinates: number[][]
  type: 'polygon' | 'circle'
}

interface ARCampaign {
  id: string
  title: string
  description: string
  venue_id: string
  event_id?: string
  geographical_zones: GeographicalZone[]
  revenue_model: 'cpm' | 'cpc' | 'flat_rate'
  sdk_ready: boolean
  status: 'active' | 'inactive' | 'scheduled' | 'expired'
  created_at: string
  updated_at: string
  venues?: {
    name: string
  }
  events?: {
    name: string
  }
  current_views: number
  click_through_rate: number
  budget: number
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'scheduled' | 'expired'
type SortField = 'created_at' | 'title' | 'current_views' | 'budget'
type SortOrder = 'asc' | 'desc'

export const ARCampaignsPage: React.FC = () => {
  const { user, getToken } = useAuth()
  const [campaigns, setCampaigns] = useState<ARCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch('/api/ar-campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }
      
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load AR campaigns')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    }
  }, [user, fetchCampaigns])

  const getCampaignStatus = (campaign: ARCampaign): string => {
    const now = new Date()
    const createdAt = new Date(campaign.created_at)
    
    if (campaign.status === 'active') return 'active'
    if (campaign.status === 'inactive') return 'inactive'
    if (createdAt > now) return 'scheduled'
    return 'expired'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || getCampaignStatus(campaign) === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: string | number = a[sortField]
      let bValue: string | number = b[sortField]
      
      if (sortField === 'created_at') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      const token = await getToken()
      const response = await fetch(`/api/ar-campaigns/${campaignId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update campaign status')
      }
      
      await fetchCampaigns()
      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating campaign status:', error)
      toast.error('Failed to update campaign status')
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }
    
    try {
      const token = await getToken()
      const response = await fetch(`/api/ar-campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete campaign')
      }
      
      await fetchCampaigns()
      toast.success('Campaign deleted successfully')
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  // Calculate stats
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(campaign => getCampaignStatus(campaign) === 'active').length
  const averageCTR = campaigns.length > 0 
    ? campaigns.reduce((sum, campaign) => sum + campaign.click_through_rate, 0) / campaigns.length 
    : 0
  const sdkReadyCampaigns = campaigns.filter(campaign => campaign.sdk_ready).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AR Campaigns</h1>
          <p className="text-sm text-gray-500">Manage your augmented reality advertising campaigns with geographical targeting</p>
        </div>
        <Link
          to="/ar-campaigns/create"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalCampaigns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeCampaigns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. CTR</dt>
                  <dd className="text-lg font-medium text-gray-900">{averageCTR.toFixed(2)}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">SDK Ready</dt>
                  <dd className="text-lg font-medium text-gray-900">{sdkReadyCampaigns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortField(field as SortField)
                  setSortOrder(order as SortOrder)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="current_views-desc">Most Views</option>
                <option value="budget-desc">Highest Budget</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white shadow rounded-lg">
        {filteredAndSortedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {campaigns.length === 0 
                ? "Get started by creating your first AR campaign with geographical targeting."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {campaigns.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/ar-campaigns/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredAndSortedCampaigns.map((campaign) => {
                const status = getCampaignStatus(campaign)
                return (
                  <li key={campaign.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {campaign.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status}
                          </span>
                          {campaign.sdk_ready && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Shield className="h-3 w-3 mr-1" />
                              SDK Ready
                            </span>
                          )}
                          {campaign.geographical_zones && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Globe className="h-3 w-3 mr-1" />
                              Geo-Targeted
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 truncate">{campaign.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {campaign.venues?.name}
                          </div>
                          {campaign.events && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {campaign.events.name}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {campaign.current_views.toLocaleString()} views
                          </div>
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            {campaign.click_through_rate.toFixed(2)}% CTR
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.revenue_model.toUpperCase()} - ${campaign.budget.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCampaignStatus(campaign.id, status)}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                            status === 'active'
                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                              : 'text-green-700 bg-green-100 hover:bg-green-200'
                          }`}
                        >
                          {status === 'active' ? (
                            <><Pause className="h-4 w-4 mr-1" /> Pause</>
                          ) : (
                            <><Play className="h-4 w-4 mr-1" /> Activate</>
                          )}
                        </button>
                        <Link
                          to={`/ar-campaigns/${campaign.id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default ARCampaignsPage