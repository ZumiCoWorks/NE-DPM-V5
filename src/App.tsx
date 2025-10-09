import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { EventsPage } from './pages/EventsPage'
import { VenuesPage } from './pages/VenuesPage'
import { FloorplansPage } from './pages/FloorplansPage'
import { CDVPage } from './pages/CDVPage'
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage'
import { EmergencyRouteConfigPage } from './pages/emergency/EmergencyRouteConfigPage'
import { APIDocumentationPage } from './pages/api/APIDocumentationPage'
import MobileSDKPreviewPage from './pages/mobile/MobileSDKPreviewPage'
import { OnboardingFlow } from './components/OnboardingFlow'
import { Building, Calendar, Map, Zap, Shield, Code, Smartphone, LogOut, Brain } from 'lucide-react'
import './index.css'

type TabType = 'dashboard' | 'events' | 'venues' | 'floorplans' | 'cdv' | 'ar' | 'emergency' | 'api' | 'mobile'

function App() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showOnboarding, setShowOnboarding] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Building },
    { id: 'events' as TabType, label: 'Events', icon: Calendar },
    { id: 'venues' as TabType, label: 'Venues', icon: Building },
    { id: 'floorplans' as TabType, label: 'Floorplans', icon: Map },
    { id: 'cdv' as TabType, label: 'CDV Intelligence', icon: Brain },
    { id: 'ar' as TabType, label: 'AR Campaigns', icon: Zap },
    { id: 'emergency' as TabType, label: 'Emergency', icon: Shield },
    { id: 'api' as TabType, label: 'API Docs', icon: Code },
    { id: 'mobile' as TabType, label: 'Mobile SDK', icon: Smartphone },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />
      case 'events':
        return <EventsPage />
      case 'venues':
        return <VenuesPage />
      case 'floorplans':
        return <FloorplansPage />
      case 'cdv':
        return <CDVPage />
      case 'ar':
        return <ARCampaignsPage />
      case 'emergency':
        return <EmergencyRouteConfigPage />
      case 'api':
        return <APIDocumentationPage />
      case 'mobile':
        return <MobileSDKPreviewPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">NavEaze DPM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Quick Start
              </button>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
