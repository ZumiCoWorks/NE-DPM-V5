import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Building, Calendar, Map, Zap } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

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
                <p className="text-2xl font-bold text-gray-900">0</p>
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
                <p className="text-2xl font-bold text-gray-900">0</p>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Management</h3>
            <p className="text-gray-600 mb-4">
              Create and manage your event venues with detailed information and floorplans.
            </p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Manage Venues
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Planning</h3>
            <p className="text-gray-600 mb-4">
              Set up events, configure navigation paths, and manage emergency routes.
            </p>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Plan Events
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AR Campaigns</h3>
            <p className="text-gray-600 mb-4">
              Create immersive AR experiences and manage digital assets for your events.
            </p>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Create AR
            </button>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h3>
          <p className="text-blue-700 mb-4">
            Welcome to NavEaze! Start by creating your first venue, then add events and configure navigation.
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              Create your first venue with basic information
            </div>
            <div className="flex items-center text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              Upload a floorplan and set up navigation nodes
            </div>
            <div className="flex items-center text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              Configure emergency paths and safety routes
            </div>
            <div className="flex items-center text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              Create AR campaigns to enhance visitor experience
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}