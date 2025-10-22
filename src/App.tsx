import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { CDVPage } from './pages/CDVPage'
import { EventsManagementPage } from './pages/EventsManagementPage'
import { VenuesManagementPage } from './pages/VenuesManagementPage'
import { QuicketIntegrationPage } from './pages/QuicketIntegrationPage'
import { OnboardingFlow } from './components/OnboardingFlow'
import { Building, LogOut, Brain, Calendar, MapPin, Link2 } from 'lucide-react'
import './index.css'

// Admin tabs for B2B configuration + CDV Revenue
type TabType = 'dashboard' | 'events' | 'venues' | 'quicket' | 'cdv'

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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // DEMO MODE: Bypass authentication for B2B showcase
  const demoMode = true
  const demoUser = { email: 'demo@naveaze.co.za', id: 'demo-user-001' }

  if (loading && !demoMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && !demoMode) {
    return <AuthPage />
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  const navSections: NavSection[] = [
    {
      title: 'B2B Intelligence',
      tabs: [
        { id: 'dashboard' as TabType, label: '🏠 Dashboard', icon: Building },
        { id: 'cdv' as TabType, label: '💰 Revenue & Engagement', icon: Brain },
      ]
    },
    {
      title: 'Configuration',
      tabs: [
        { id: 'events' as TabType, label: '📅 Events', icon: Calendar },
        { id: 'venues' as TabType, label: '📍 Venues & Booths', icon: MapPin },
        { id: 'quicket' as TabType, label: '🎫 Quicket Integration', icon: Link2 },
      ]
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />
      case 'events':
        return <EventsManagementPage />
      case 'venues':
        return <VenuesManagementPage />
      case 'quicket':
        return <QuicketIntegrationPage />
      case 'cdv':
        return <CDVPage />
      default:
        return <Dashboard onTabChange={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r shadow-sm transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900">NavEaze B2B 🇿🇦</h1>
              <p className="text-xs text-gray-500">Intelligence & Assurance</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            <Brain className="h-5 w-5" />
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
        <div className="border-t p-4">
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
            <span className="font-medium">{demoMode ? demoUser.email : user?.email}</span>
            {demoMode && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                DEMO MODE
              </span>
            )}
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
