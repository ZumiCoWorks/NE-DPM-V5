import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { EventsPage } from './pages/EventsPage'
import { VenuesPage } from './pages/VenuesPage'
import { FloorplansPage } from './pages/FloorplansPage'
import { ARCampaignsPage } from './pages/ar/ARCampaignsPage'
import { EmergencyRouteConfigPage } from './pages/emergency/EmergencyRouteConfigPage'
import { APIDocumentationPage } from './pages/api/APIDocumentationPage'
import MobileSDKPreviewPage from './pages/mobile/MobileSDKPreviewPage'
import { CDVPage } from './pages/CDVPage'
import DemoWalkthrough from './pages/DemoWalkthrough'
import { OnboardingFlow } from './components/OnboardingFlow'
import { DataIntegrityDashboard } from './components/DataIntegrityDashboard'
import { Building, Calendar, Map, Zap, Shield, Code, Smartphone, LogOut, Brain, Presentation } from 'lucide-react'
import './index.css'

type TabType = 'demo' | 'dashboard' | 'events' | 'venues' | 'floorplans' | 'ar' | 'emergency' | 'api' | 'mobile' | 'cdv' | 'integrity'

interface NavSection {
  title: string
  tabs: Array<{
    id: TabType
    label: string
    icon: typeof Building
  }>
}

function App() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('demo')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      tabs: [
        { id: 'demo' as TabType, label: '🇿🇦 Live Demo', icon: Presentation },
        { id: 'dashboard' as TabType, label: 'Dashboard', icon: Building },
      ]
    },
    {
      title: 'Core Management',
      tabs: [
        { id: 'events' as TabType, label: 'Events', icon: Calendar },
        { id: 'venues' as TabType, label: 'Venues', icon: Building },
        { id: 'floorplans' as TabType, label: 'Floorplans', icon: Map },
      ]
    },
    {
      title: 'Analytics',
      tabs: [
        { id: 'cdv' as TabType, label: 'CDV Intelligence', icon: Brain },
        { id: 'integrity' as TabType, label: 'Data Integrity', icon: Shield },
      ]
    },
    {
      title: 'Advanced Features',
      tabs: [
        { id: 'ar' as TabType, label: 'AR Campaigns', icon: Zap },
        { id: 'emergency' as TabType, label: 'Emergency', icon: Shield },
      ]
    },
    {
      title: 'Developer',
      tabs: [
        { id: 'api' as TabType, label: 'API Docs', icon: Code },
        { id: 'mobile' as TabType, label: 'Mobile SDK', icon: Smartphone },
      ]
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'demo':
        return <DemoWalkthrough />
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />
      case 'events':
        return <EventsPage />
      case 'venues':
        return <VenuesPage />
      case 'floorplans':
        return <FloorplansPage />
      case 'ar':
        return <ARCampaignsPage />
      case 'emergency':
        return <EmergencyRouteConfigPage />
      case 'cdv':
        return <CDVPage />
      case 'integrity':
        return <DataIntegrityDashboard />
      case 'api':
        return <APIDocumentationPage />
      case 'mobile':
        return <MobileSDKPreviewPage />
      default:
        return <DemoWalkthrough />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r shadow-sm transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-semibold text-gray-900">NavEaze DPM 🇿🇦</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            <Map className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-6' : ''}>
              {!sidebarCollapsed && (
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1 px-2">
                {section.tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={sidebarCollapsed ? tab.label : undefined}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      {!sidebarCollapsed && <span>{tab.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t p-4 space-y-2">
          <button
            onClick={() => setShowOnboarding(true)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? 'Quick Start' : undefined}
          >
            <Zap className="h-5 w-5 text-gray-400" />
            {!sidebarCollapsed && <span>Quick Start</span>}
          </button>
          <button
            onClick={signOut}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b shadow-sm h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {navSections.flatMap(s => s.tabs).find(t => t.id === activeTab)?.label || 'NavEaze DPM'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Signed in as</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App
