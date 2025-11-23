import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/loadingSpinner'
import {
  Calendar,
  MapPin,
  Megaphone,
  Users,
  Plus,
  Eye,
  TrendingUp,
} from 'lucide-react'
import { formatDate } from '../lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// DEMO MODE TOGGLE
const DEMO_MODE = true;

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

// Mock Data for Investor Pitch
const MOCK_TRAFFIC_DATA = [
  { time: '09:00', users: 120 },
  { time: '10:00', users: 250 },
  { time: '11:00', users: 480 },
  { time: '12:00', users: 850 },
  { time: '13:00', users: 1420 }, // Peak
  { time: '14:00', users: 1100 },
  { time: '15:00', users: 600 },
  { time: '16:00', users: 350 },
];

export const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalVenues: 0,
    totalCampaigns: 0,
    totalUsers: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)



  const fetchRecentActivity = useCallback(async () => {
    if (!user) return
    if (!supabase) return

    // DEMO MODE: Mock Activity
    if (DEMO_MODE) {
      setRecentActivity([
        { id: '1', type: 'event', title: 'TechSummit 2025', description: 'Main Hall A', created_at: new Date().toISOString() },
        { id: '2', type: 'campaign', title: 'VIP Scavenger Hunt', description: 'Active - 350 Leads', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'venue', title: 'Convention Center', description: 'Floorplan Updated', created_at: new Date(Date.now() - 7200000).toISOString() },
      ]);
      return;
    }

    const activities: RecentActivity[] = []

    try {
      // Fetch recent events (admin only)
      if (user.role === 'admin') {
        const { data: events, error } = await supabase
          .from('events')
          .select('id, name, description, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) {
          console.error('Error fetching events:', error);
        }

        if (events) {
          type EventRow = { id: string; name: string; description?: string | null; created_at: string }
          activities.push(
            ...(events as EventRow[]).map((event) => ({
              id: event.id,
              type: 'event' as const,
              title: event.name,
              description: event.description || 'No description',
              created_at: event.created_at,
            }))
          )
        }
      }
      if (user.role === 'staff') {
        const { data: events, error } = await supabase
          .from('events')
          .select('id, name, description, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) {
          console.error('Error fetching events:', error);
        }

        if (events) {
          type EventRow = { id: string; name: string; description?: string | null; created_at: string }
          activities.push(
            ...(events as EventRow[]).map((event) => ({
              id: event.id,
              type: 'event' as const,
              title: event.name,
              description: event.description || 'No description',
              created_at: event.created_at,
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
  }, [user])

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    if (!supabase) return

    console.log('📊 Starting dashboard data fetch for user:', user.email);

    try {
      setLoading(true)
      console.log('⏳ Dashboard loading set to true');

      // DEMO MODE: Mock Stats
      if (DEMO_MODE) {
        console.log('🎭 DEMO MODE: Loading mock stats');
        await new Promise(resolve => setTimeout(resolve, 800)); // Fake loading delay
        setStats({
          totalEvents: 12,
          totalVenues: 4,
          totalCampaigns: 8,
          totalUsers: 1420, // Active Users
        });
        await fetchRecentActivity();
        setLoading(false);
        return;
      }

      // Set a timeout to prevent indefinite loading
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      // Fetch stats based on user role
      const statsPromises: Promise<Partial<DashboardStats>>[] = []

      if (user.role === 'admin') {
        console.log('👑 Fetching admin stats...');
        statsPromises.push((async () => {
          const { data, error } = await supabase.from('events').select('id')
          if (error) console.error('Error fetching events:', error);
          const totalEvents = Array.isArray(data) ? data.length : 0
          console.log('📅 Events fetched:', totalEvents);
          return { totalEvents }
        })())
      }
      if (user.role === 'staff') {
        console.log('👤 Fetching staff stats...');
        statsPromises.push((async () => {
          const { data: events, error: eventsError } = await supabase.from('events').select('id')
          const { data: venues, error: venuesError } = await supabase.from('venues').select('id')
          if (eventsError) console.error('Error fetching events:', eventsError);
          if (venuesError) console.error('Error fetching venues:', venuesError);
          const totalEvents = Array.isArray(events) ? events.length : 0
          const totalVenues = Array.isArray(venues) ? venues.length : 0
          return { totalEvents, totalVenues }
        })())
      }

      const results = await Promise.race([
        Promise.all(statsPromises),
        timeout
      ]) as Partial<DashboardStats>[];

      let newStats: DashboardStats = {
        totalEvents: 0,
        totalVenues: 0,
        totalCampaigns: 0,
        totalUsers: 0,
      }
      for (const r of results) {
        newStats = { ...newStats, ...r }
      }
      setStats(newStats)
      console.log('📈 Stats updated:', newStats);

      // Fetch recent activity
      console.log('🔄 Fetching recent activity...');
      await fetchRecentActivity()
      console.log('✅ Recent activity fetched');

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      // Set loading to false even on error
    } finally {
      console.log('✅ Dashboard loading complete, setting loading to false');
      setLoading(false)
    }
  }, [user, fetchRecentActivity])

  useEffect(() => {
    if (user) {
      // Set a maximum timeout for the entire loading process
      const maxLoadTimeout = setTimeout(() => {
        console.warn('Dashboard loading timeout - forcing completion');
        setLoading(false);
      }, 3000);

      fetchDashboardData().finally(() => {
        clearTimeout(maxLoadTimeout);
      });

      return () => clearTimeout(maxLoadTimeout);
    }
  }, [user]) // Removed fetchDashboardData from dependencies to prevent double-fetch

  const getQuickActions = () => {
    const actions = []

    if (user?.role === 'admin') {
      actions.push({
        title: 'Create Event',
        description: 'Set up a new event',
        href: '/events/create',
        icon: Calendar,
        color: 'bg-brand-red',
      })
      actions.push({
        title: 'Create Venue',
        description: 'Add a new venue',
        href: '/venues/create',
        icon: MapPin,
        color: 'bg-teal-500',
      })
      actions.push({
        title: 'Map Editor',
        description: 'Edit floorplan and QR codes',
        href: '/map-editor',
        icon: MapPin,
        color: 'bg-green-500',
      })
      actions.push({
        title: 'Settings',
        description: 'Configure Quicket API',
        href: '/settings',
        icon: Users,
        color: 'bg-purple-500',
      })
    }

    if (user?.role === 'admin') {
      actions.push({
        title: 'AR Campaigns',
        description: 'Manage scavenger hunts',
        href: '/ar-campaigns',
        icon: MapPin,
        color: 'bg-orange-500',
      })
    }
    if (user?.role === 'staff') {
      actions.push({
        title: 'Profile',
        description: 'View and update your details',
        href: '/profile',
        icon: Users,
        color: 'bg-brand-red',
      })
      actions.push({
        title: 'Settings',
        description: 'Configure personal settings',
        href: '/settings',
        icon: Megaphone,
        color: 'bg-green-500',
      })
    }

    if (user?.role === 'sponsor') {
      actions.push({
        title: 'My Leads',
        description: 'View captured leads',
        href: '/sponsor',
        icon: Users,
        color: 'bg-brand-red',
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

  if (authLoading || loading || !user) {
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
          Welcome back, {user?.full_name || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 capitalize">
          {user?.role?.replace('_', ' ')} Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <>
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

            {/* Demo Mode Extra Stats */}
            {DEMO_MODE && (
              <>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-6 w-6 text-brand-red" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Users
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.totalUsers.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Megaphone className="h-6 w-6 text-brand-yellow" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Leads Captured
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            350
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {user?.role === 'staff' && !DEMO_MODE && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
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
      </div>

      {/* Traffic Chart (Demo Mode Only) */}
      {DEMO_MODE && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Live Traffic Overview</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
              Live
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_TRAFFIC_DATA}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ed1c24" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ed1c24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#ed1c24" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-red border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
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
