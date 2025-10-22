import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Building, Calendar, Map, Zap, Plus, ArrowRight, Shield, Brain, Code, Smartphone, Upload, BarChart3, TrendingUp, AlertTriangle, Users } from 'lucide-react'
import { eventsApi, venuesApi } from '../services/api'
import type { Event, Venue } from '../services/api'

interface DashboardProps {
  onTabChange?: (tab: any) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const { user, signOut } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  const handleSignOut = async () => {
    await signOut()
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, venuesData] = await Promise.all([
          eventsApi.getAll(),
          venuesApi.getAll()
        ])
        setEvents(eventsData)
        setVenues(venuesData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">NavEaze DPM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.full_name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Manage your venues, events, and AR campaigns from this central hub.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Venues</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '-' : venues.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '-' : events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Map className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Floorplans</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AR Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Recent Events</h3>
            <button
              onClick={() => onTabChange?.('events')}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
              <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="p-6 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No events yet</h4>
                <p className="text-gray-600 mb-4">Create your first event to get started</p>
                <button
                  onClick={() => onTabChange?.('events')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Create Event
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {events.slice(0, 3).map((event) => {
                  const venue = venues.find(v => v.id === event.venue_id)
                  return (
                    <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">{event.name}</h4>
                          <p className="text-gray-600 mb-2">{event.description}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>📍 {venue?.name || 'Unknown Venue'}</span>
                            <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.status === 'active' ? 'bg-green-100 text-green-800' :
                              event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => onTabChange?.('events')}
                          className="ml-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              Venue Management
            </h3>
            <p className="text-gray-600 mb-4">
              Create and manage your event venues with detailed information and floorplans.
            </p>
            <button
              onClick={() => onTabChange?.('venues')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Manage Venues
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Event Planning
            </h3>
            <p className="text-gray-600 mb-4">
              Set up events, configure navigation paths, and manage emergency routes.
            </p>
            <button
              onClick={() => onTabChange?.('events')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Plan Events
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-orange-600" />
              AR Campaigns
            </h3>
            <p className="text-gray-600 mb-4">
              Create and manage AR campaigns with geographical zones and asset uploads.
            </p>
            <button
              onClick={() => onTabChange?.('ar')}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Manage AR Campaigns
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              AI Floorplan Upload
            </h3>
            <p className="text-gray-600 mb-4">
              Upload floorplans with AI-powered POI suggestions and compliance validation.
            </p>
            <button
              onClick={() => onTabChange?.('floorplans')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Upload with AI
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-red-600" />
              Emergency Routes
            </h3>
            <p className="text-gray-600 mb-4">
              Configure emergency routes with safety compliance indicators and validation.
            </p>
            <button
              onClick={() => onTabChange?.('emergency')}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Configure Safety
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Code className="h-5 w-5 mr-2 text-indigo-600" />
              API Documentation
            </h3>
            <p className="text-gray-600 mb-4">
              Access comprehensive API documentation for third-party SDK integration.
            </p>
            <button
              onClick={() => onTabChange?.('api')}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              View API Docs
            </button>
          </div>
        </div>

        {/* B2B Analytics Section */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">B2B Analytics & Revenue Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Real-Time Heatmap
              </h4>
              <p className="text-gray-600 mb-4 text-sm">
                Visualize visitor movement patterns and zone popularity in real-time.
              </p>
              <button
                onClick={() => onTabChange?.('api')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View Heatmap
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Engagement Reports
              </h4>
              <p className="text-gray-600 mb-4 text-sm">
                Track visitor engagement velocity and zone performance metrics.
              </p>
              <button
                onClick={() => onTabChange?.('api')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                View Reports
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Bottleneck Alerts
              </h4>
              <p className="text-gray-600 mb-4 text-sm">
                Monitor crowd density and receive automated bottleneck alerts.
              </p>
              <button
                onClick={() => onTabChange?.('api')}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                View Alerts
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Vendor Analytics
              </h4>
              <p className="text-gray-600 mb-4 text-sm">
                Manage vendor access and provide data monetization services.
              </p>
              <button
                onClick={() => onTabChange?.('api')}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Manage Vendors
              </button>
            </div>
          </div>
        </div>

        {/* API-First Features Section */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">API-First Development Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
                Mobile SDK Preview
              </h4>
              <p className="text-gray-600 mb-4">
                Test and preview mobile SDK functionality with real-time data visualization and performance monitoring.
              </p>
              <button
                onClick={() => onTabChange?.('mobile')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Launch SDK Preview
              </button>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-green-600" />
                Zumi AI Integration
              </h4>
              <p className="text-gray-600 mb-4">
                Leverage AI-powered asset processing, floorplan analysis, and compliance validation for enhanced safety.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => onTabChange?.('floorplans')}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  AI Upload
                </button>
                <button
                  onClick={() => onTabChange?.('emergency')}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Safety Check
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">API-First MVP Workflow</h3>
          <p className="text-blue-700 mb-4">
            Follow this safety-guaranteed workflow to set up your complete NavEaze system with AI-enhanced features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-blue-700">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                Create venues with AI-enhanced floorplan upload
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                Configure emergency routes with compliance validation
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                Set up AR campaigns with geographical zones
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-blue-700">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Test mobile SDK with real-time preview
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Review API documentation for integration
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Deploy with safety-first compliance checks
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}