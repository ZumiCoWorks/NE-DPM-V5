import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  Calendar,
  MapPin,
  Megaphone,
  Users,
  Plus,
  Eye,
} from 'lucide-react'
import { formatDate } from '../lib/utils'

interface DashboardStats {
  totalEvents: number
  totalVenues: number
  totalCampaigns: number
  totalUsers: number
}

interface RecentActivity {
  id: string
  type: 'event' | 'venue' | 'campaign'
  title: string
  description: string
  created_at: string
}

export const DashboardPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalVenues: 0,
    totalCampaigns: 0,
    totalUsers: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)



  const fetchRecentActivity = useCallback(async () => {
    if (!profile) return

    const activities: RecentActivity[] = []

    try {
      // Fetch recent events
      if (profile.role === 'admin' || profile.role === 'event_organizer') {
        const { data: events } = await supabase
          .from('events')
          .select('id, name, description, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        if (events) {
          activities.push(
            ...events.map((event) => ({
              id: event.id,
              type: 'event' as const,
              title: event.name,
              description: event.description || 'No description',
              created_at: event.created_at,
            }))
          )
        }
      }

      // Fetch recent venues
      if (profile.role === 'admin' || profile.role === 'venue_manager') {
        const { data: venues } = await supabase
          .from('venues')
          .select('id, name, description, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        if (venues) {
          activities.push(
            ...venues.map((venue) => ({
              id: venue.id,
              type: 'venue' as const,
              title: venue.name,
              description: venue.description || 'No description',
              created_at: venue.created_at,
            }))
          )
        }
      }

      // Fetch recent campaigns
      if (profile.role === 'admin' || profile.role === 'advertiser') {
        const { data: campaigns } = await supabase
          .from('ar_advertisements')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        if (campaigns) {
          activities.push(
            ...campaigns.map((campaign) => ({
              id: campaign.id,
              type: 'campaign' as const,
              title: campaign.title,
              description: 'AR Advertisement Campaign',
              created_at: campaign.created_at,
            }))
          )
        }
      }

      // Sort by creation date and limit to 5 most recent
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentActivity(activities.slice(0, 5))
      
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }, [profile])

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      // Fetch stats based on user role
      const statsPromises = []
      
      if (profile.role === 'admin' || profile.role === 'event_organizer') {
        statsPromises.push(
          supabase
            .from('events')
            .select('id', { count: 'exact' })
            .then(({ count }) => ({ totalEvents: count || 0 }))
        )
      }
      
      if (profile.role === 'admin' || profile.role === 'venue_manager') {
        statsPromises.push(
          supabase
            .from('venues')
            .select('id', { count: 'exact' })
            .then(({ count }) => ({ totalVenues: count || 0 }))
        )
      }
      
      if (profile.role === 'admin' || profile.role === 'advertiser') {
        statsPromises.push(
          supabase
            .from('ar_advertisements')
            .select('id', { count: 'exact' })
            .then(({ count }) => ({ totalCampaigns: count || 0 }))
        )
      }
      
      if (profile.role === 'admin') {
        statsPromises.push(
          supabase
            .from('users')
            .select('id', { count: 'exact' })
            .then(({ count }) => ({ totalUsers: count || 0 }))
        )
      }

      const results = await Promise.all(statsPromises)
      const newStats = results.reduce((acc, result) => ({ ...acc, ...result }), {
        totalEvents: 0,
        totalVenues: 0,
        totalCampaigns: 0,
        totalUsers: 0,
      })
      setStats(newStats)

      // Fetch recent activity
      await fetchRecentActivity()
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile, fetchRecentActivity])

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile, fetchDashboardData])

  const getQuickActions = () => {
    const actions = []
    
    if (profile?.role === 'admin' || profile?.role === 'event_organizer') {
      actions.push({
        title: 'Create Event',
        description: 'Set up a new event',
        href: '/events/create',
        icon: Calendar,
        color: 'bg-blue-500',
      })
    }
    
    if (profile?.role === 'admin' || profile?.role === 'venue_manager') {
      actions.push({
        title: 'Add Venue',
        description: 'Register a new venue',
        href: '/venues/create',
        icon: MapPin,
        color: 'bg-green-500',
      })
    }
    
    if (profile?.role === 'admin' || profile?.role === 'advertiser') {
      actions.push({
        title: 'Create Campaign',
        description: 'Launch AR advertisement',
        href: '/ar-campaigns/create',
        icon: Megaphone,
        color: 'bg-purple-500',
      })
    }
    
    return actions
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event':
        return Calendar
      case 'venue':
        return MapPin
      case 'campaign':
        return Megaphone
      default:
        return Eye
    }
  }

  if (authLoading || loading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 capitalize">
          {profile?.role?.replace('_', ' ')} Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(profile?.role === 'admin' || profile?.role === 'event_organizer') && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Events
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalEvents}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {(profile?.role === 'admin' || profile?.role === 'venue_manager') && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPin className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Venues
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalVenues}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {(profile?.role === 'admin' || profile?.role === 'advertiser') && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Megaphone className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      AR Campaigns
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCampaigns}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {profile?.role === 'admin' && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getQuickActions().map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {action.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                  <span
                    className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                    aria-hidden="true"
                  >
                    <Plus className="h-6 w-6" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          {recentActivity.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== recentActivity.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-gray-500" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                {activity.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(activity.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No recent activity to display.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}