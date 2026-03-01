import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDemoMode } from '../contexts/DemoModeContext'
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
  FlaskConical,
} from 'lucide-react'
import { formatDate } from '../lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OnboardingChecklist } from '../features/onboarding/components/OnboardingChecklist';

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
  const { demoMode } = useDemoMode() // Use global demo mode context

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
    if (demoMode) {
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
  }, [user, demoMode])

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    if (!supabase) return

    console.log('📊 Starting dashboard data fetch for user:', user.email);

    try {
      setLoading(true)
      console.log('⏳ Dashboard loading set to true');

      // DEMO MODE: Mock Stats
      if (demoMode) {
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
  }, [user, demoMode]) // Removed fetchDashboardData from dependencies to prevent double-fetch

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          Welcome back, {user?.full_name || 'User'}!
        </h1>
        <p className="mt-2 text-sm font-mono text-white/50 uppercase tracking-widest">
          {user?.role?.replace('_', ' ')} Command Center
        </p>
      </div>

      {/* Onboarding Checklist */}
      {user?.role === 'admin' && <OnboardingChecklist key={Date.now()} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <>
            {/* Dark Premium Card: Total Events */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative group hover:border-brand-red/30 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-6 relative z-10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-brand-red drop-shadow-[0_0_8px_rgba(255,77,50,0.6)]" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest truncate">
                        Total Events
                      </dt>
                      <dd>
                        <div className="text-3xl font-black text-white mt-1">
                          {stats.totalEvents}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Premium Card: Total Venues */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative group hover:border-logic-blue/30 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-logic-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-6 relative z-10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MapPin className="h-8 w-8 text-logic-blue drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest truncate">
                        Total Venues
                      </dt>
                      <dd>
                        <div className="text-3xl font-black text-white mt-1">
                          {stats.totalVenues}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            {/* Dark Premium Card: Active Users (Demo) */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative group hover:border-teal-400/30 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-6 relative z-10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest truncate">
                        Active Users
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-3xl font-black text-white mt-1">
                          {stats.totalUsers}
                        </div>
                        <span className="ml-2 text-sm font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> 14%
                        </span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Premium Card: AR Campaigns */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative group hover:border-orange-500/30 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-6 relative z-10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Megaphone className="h-8 w-8 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest truncate">
                        AR Campaigns
                      </dt>
                      <dd>
                        <div className="text-3xl font-black text-white mt-1">
                          {stats.totalCampaigns}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Traffic Chart (Demo Mode Only) */}
      {demoMode && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">Live Traffic Overview</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></div>
              LIVE
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_TRAFFIC_DATA}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D32" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#FF4D32" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff15" />
                <XAxis dataKey="time" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#FF4D32', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="users" stroke="#FF4D32" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="md:flex md:items-center md:justify-between pt-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-white/90 sm:text-3xl sm:truncate">
            Management
          </h2>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden">
        <div className="px-6 py-6 sm:p-8">
          <h3 className="text-sm font-mono font-bold text-white/50 uppercase tracking-widest mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {getQuickActions().map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className="relative group bg-white/5 backdrop-blur-md p-6 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${action.color}`} />
                  <div>
                    <span className={`rounded-lg inline-flex p-3 bg-black/40 border border-white/5 shadow-inner text-white group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-5 relative z-10">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {action.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      {action.description}
                    </p>
                  </div>
                  <span
                    className="pointer-events-none absolute top-6 right-6 text-white/20 group-hover:text-white/60 transition-colors"
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden mb-12">
        <div className="px-6 py-6 sm:p-8">
          <h3 className="text-sm font-mono font-bold text-white/50 uppercase tracking-widest mb-6">
            System Log
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
                            className="absolute top-5 left-5 -ml-px h-full w-[1px] bg-white/10"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-4">
                          <div className="relative">
                            <span className="h-10 w-10 rounded-full bg-black/50 border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)] flex items-center justify-center ring-4 ring-[#050505]">
                              <Icon className="h-5 w-5 text-white/70" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 py-1.5 flex flex-col sm:flex-row sm:justify-between sm:space-x-4">
                            <div>
                              <p className="text-sm font-bold text-white">
                                {activity.title}
                              </p>
                              <p className="text-sm text-white/50 mt-1">
                                {activity.description}
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0 text-left sm:text-right text-xs font-mono text-white/40 whitespace-nowrap">
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
            <div className="border border-dashed border-white/20 rounded-xl p-8 text-center bg-white/[0.02]">
              <Eye className="mx-auto h-8 w-8 text-white/30 mb-3" />
              <p className="text-white/50 font-medium">
                No recent activity logged in the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
