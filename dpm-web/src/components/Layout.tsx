import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDemoMode } from '../contexts/DemoModeContext'
import {
  Home,
  Calendar,
  MapPin,
  Megaphone,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  FlaskConical,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'sponsor', 'staff', 'organizer'],
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
    roles: ['admin', 'organizer'],
  },
  {
    name: 'Venues',
    href: '/venues',
    icon: MapPin,
    roles: ['admin', 'organizer'],
  },
  {
    name: 'Map Editor',
    href: '/map-editor',
    icon: MapPin,
    roles: ['admin', 'organizer'], // Added organizer
  },
  {
    name: 'Security Dashboard',
    href: '/security',
    icon: ShieldAlert,
    roles: ['admin', 'organizer'],
  },
  {
    name: 'ROI Reports',
    href: '/roi-reports',
    icon: Megaphone,
    roles: ['admin', 'organizer'],
  },
  {
    name: 'AR Campaigns',
    href: '/ar-campaigns',
    icon: MapPin,
    roles: ['admin', 'organizer'],
  },
  {
    name: 'Lead Scanner',
    href: '/staff/scanner',
    icon: Megaphone,
    roles: ['staff'],
  },
]

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { demoMode, toggleDemoMode } = useDemoMode()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true
    return user && user.role && item.roles.includes(user.role)
  })

  return (
    <div className="app-shell flex h-screen bg-[#09090B] text-white selection:bg-brand-red/30">
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-[#111113] border-r border-white/5 shadow-2xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
            <div className="flex items-center">
              <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-8 w-auto" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/5 p-4 bg-[#111113]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-[#1C1C1F] flex items-center justify-center border border-white/10">
                  <span className="text-sm font-medium text-white/80 tracking-wider">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white/90 truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-white/50 capitalize truncate">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
              >
                <User className="mr-3 h-4 w-4 text-white/40" />
                Profile
              </Link>
              {user?.role !== 'staff' && (
                <Link
                  to="/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4 text-white/40" />
                  Settings
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="group flex w-full items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4 text-white/40" />
                Sign out
              </button>

              {/* Demo Mode Toggle */}
              <div className="pt-3 mt-3 border-t border-white/5">
                <button
                  onClick={toggleDemoMode}
                  className={`group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${demoMode
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <FlaskConical className={`mr-3 h-4 w-4 ${demoMode ? 'text-amber-400' : 'text-white/40'
                    }`} />
                  {demoMode ? 'Demo Mode ON' : 'Demo Mode OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-40 transition-all duration-200',
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
      )}>
        <div className="flex flex-col flex-grow bg-[#111113] border-r border-white/5 overflow-hidden">
          {/* Header with collapse toggle */}
          <div className="flex items-center h-16 px-3 border-b border-white/5 justify-between">
            {!sidebarCollapsed && (
              <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-7 w-auto opacity-90" />
            )}
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className={cn(
                'text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5',
                sidebarCollapsed && 'mx-auto'
              )}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto scrollbar-none">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      !sidebarCollapsed && 'mr-3',
                      isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                    )}
                  />
                  {!sidebarCollapsed && item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer (hidden when collapsed) */}
          {!sidebarCollapsed && (
            <div className="border-t border-white/5 p-4 bg-[#111113]">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[#1C1C1F] flex items-center justify-center border border-white/10">
                    <span className="text-sm font-medium text-white/80 tracking-wider">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-white/90 truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-white/50 capitalize truncate">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <Link
                  to="/profile"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                >
                  <User className="mr-3 h-4 w-4 text-white/40" />
                  Profile
                </Link>
                {user?.role !== 'staff' && (
                  <Link
                    to="/settings"
                    className="group flex items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Settings className="mr-3 h-4 w-4 text-white/40" />
                    Settings
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="group flex w-full items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4 text-white/40" />
                  Sign out
                </button>
                <div className="pt-3 mt-3 border-t border-white/5">
                  <button
                    onClick={toggleDemoMode}
                    className={`group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${demoMode ? 'text-amber-400 bg-amber-400/10' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <FlaskConical className={`mr-3 h-4 w-4 ${demoMode ? 'text-amber-400' : 'text-white/40'}`} />
                    {demoMode ? 'Demo Mode ON' : 'Demo Mode OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed footer: just sign-out icon */}
          {sidebarCollapsed && (
            <div className="border-t border-white/5 p-2 space-y-1">
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex w-full justify-center p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        'flex flex-col flex-1 relative z-10 transition-all duration-200',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'
      )}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-[#111113] border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-7 w-auto" />
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className={cn("flex-1 overflow-y-auto relative z-10", (location.pathname.startsWith('/map-editor') || location.pathname.startsWith('/security')) ? "bg-[#09090B] h-full" : "bg-transparent")}>
          <div className={cn((location.pathname.startsWith('/map-editor') || location.pathname.startsWith('/security')) ? "h-full w-full" : "py-8")}>
            <div className={cn((location.pathname.startsWith('/map-editor') || location.pathname.startsWith('/security')) ? "h-full w-full" : "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8")}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
