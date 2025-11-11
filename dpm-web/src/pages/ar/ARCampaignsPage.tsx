import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Calendar,
  MapPin,
} from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'

interface ARAdvertisement {
  id: string
  title: string
  description: string | null
  advertiser_id: string
  venue_id: string
  event_id: string | null
  content_type: 'image' | 'video' | '3d_model'
  content_url: string
  trigger_type: 'location' | 'image' | 'qr_code'
  trigger_data: Record<string, unknown>
  position_x: number
  position_y: number
  position_z: number
  rotation_x: number
  rotation_y: number
  rotation_z: number
  scale_factor: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  budget: number | null
  cost_per_view: number | null
  max_views: number | null
  current_views: number
  click_through_rate: number
  created_at: string
  updated_at: string
  venues?: {
    name: string
  }
  events?: {
    name: string
  } | null
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'scheduled' | 'expired'
type SortField = 'created_at' | 'title' | 'current_views' | 'budget'
type SortOrder = 'asc' | 'desc'

export const ARCampaignsPage: React.FC = () => {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<ARAdvertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showFilters, setShowFilters] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('ar_advertisements')
        .select(`
          *,
          venues(name),
          events(name)
        `)

      // Filter by advertiser if not admin
      if (user?.role !== 'admin') {
        query = query.eq('advertiser_id', user?.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching AR campaigns:', error)
        return
      }

      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching AR campaigns:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const toggleCampaignStatus = async (campaignId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ar_advertisements')
        .update({ is_active: !currentStatus })
        .eq('id', campaignId)

      if (error) {
        console.error('Error updating campaign status:', error)
        alert('Failed to update campaign status. Please try again.')
        return
      }

      // Update local state
      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, is_active: !currentStatus }
          : campaign
      ))
    } catch (error) {
      console.error('Error updating campaign status:', error)
      alert('Failed to update campaign status. Please try again.')
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this AR campaign? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('ar_advertisements')
        .delete()
        .eq('id', campaignId)

      if (error) {
        console.error('Error deleting campaign:', error)
        alert('Failed to delete campaign. Please try again.')
        return
      }

      setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId))
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign. Please try again.')
    }
  }

  const getCampaignStatus = (campaign: ARAdvertisement): FilterStatus => {
    const now = new Date()
    const startDate = campaign.start_date ? new Date(campaign.start_date) : null
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null

    if (!campaign.is_active) return 'inactive'
    if (endDate && endDate < now) return 'expired'
    if (startDate && startDate > now) return 'scheduled'
    return 'active'
  }

  const getStatusColor = (status: FilterStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.venues?.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || getCampaignStatus(campaign) === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'current_views':
          aValue = a.current_views
          bValue = b.current_views
          break
        case 'budget':
          aValue = a.budget || 0
          bValue = b.budget || 0
          break
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const totalBudget = campaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0)
  const totalViews = campaigns.reduce((sum, campaign) => sum + campaign.current_views, 0)
  const activeCampaigns = campaigns.filter(campaign => getCampaignStatus(campaign) === 'active').length
  const averageCTR = campaigns.length > 0 
    ? campaigns.reduce((sum, campaign) => sum + campaign.click_through_rate, 0) / campaigns.length 
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AR Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your augmented reality advertising campaigns
          </p>
        </div>
        <Link
          to="/ar-campaigns/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="h-6 w-6 text-green-400" />
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
                <Eye className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalViews.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-purple-400" />
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
                <Calendar className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Budget</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalBudget)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort by</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  <option value="created_at">Created Date</option>
                  <option value="title">Title</option>
                  <option value="current_views">Views</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredAndSortedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {campaigns.length === 0 
                ? "Get started by creating your first AR campaign."
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
                  Create Campaign
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAndSortedCampaigns.map((campaign) => {
              const status = getCampaignStatus(campaign)
              return (
                <li key={campaign.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {campaign.title}
                          </h3>
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                            getStatusColor(status)
                          )}>
                            {status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
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
                          {campaign.budget && (
                            <div className="flex items-center">
                              <BarChart3 className="h-4 w-4 mr-1" />
                              {formatCurrency(campaign.budget)}
                            </div>
                          )}
                        </div>
                        {campaign.description && (
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleCampaignStatus(campaign.id, campaign.is_active)}
                        className={cn(
                          'inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white text-sm font-medium',
                          campaign.is_active
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        )}
                        title={campaign.is_active ? 'Pause Campaign' : 'Activate Campaign'}
                      >
                        {campaign.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        to={`/ar-campaigns/${campaign.id}/analytics`}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-full shadow-sm bg-white text-gray-400 hover:text-gray-500"
                        title="View Analytics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/ar-campaigns/${campaign.id}/edit`}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-full shadow-sm bg-white text-gray-400 hover:text-gray-500"
                        title="Edit Campaign"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-full shadow-sm bg-white text-red-400 hover:text-red-500"
                        title="Delete Campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}