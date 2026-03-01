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
    <div className="flex h-screen bg-[#050505] text-white selection:bg-brand-red/30">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-red/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-logic-blue/10 blur-[120px]" />
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-[#0A0A0A] border-r border-white/10 shadow-2xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
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
          <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300',
                    isActive
                      ? 'bg-brand-red/10 text-brand-red text-shadow-glow shadow-[inset_0px_0px_20px_0px_rgba(255,77,50,0.15)] border border-brand-red/20'
                      : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 transition-colors duration-300',
                      isActive ? 'text-brand-red drop-shadow-[0_0_8px_rgba(255,77,50,0.8)]' : 'text-white/40 group-hover:text-white/80'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-4 bg-white/[0.02]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-red to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(255,77,50,0.4)] border border-white/10">
                  <span className="text-sm font-bold text-white tracking-wider">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs font-mono text-white/50 capitalize truncate">
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
                <User className="mr-3 h-4 w-4 text-white/40 group-hover:text-white/80" />
                Profile
              </Link>
              {user?.role !== 'staff' && (
                <Link
                  to="/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4 text-white/40 group-hover:text-white/80" />
                  Settings
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="group flex w-full items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4 text-white/40 group-hover:text-red-400" />
                Sign out
              </button>

              {/* Demo Mode Toggle */}
              <div className="pt-3 mt-3 border-t border-white/10">
                <button
                  onClick={toggleDemoMode}
                  className={`group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${demoMode
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[inset_0px_0px_10px_0px_rgba(245,158,11,0.1)]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                >
                  <FlaskConical className={`mr-3 h-4 w-4 transition-colors ${demoMode ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'text-white/40'
                    }`} />
                  {demoMode ? 'Demo Mode ON' : 'Demo Mode OFF'}
                </button>
                {demoMode && (
                  <p className="mt-2 px-3 text-[10px] font-mono uppercase tracking-wider text-amber-500/70">
                    Showing mock data for demos
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-40">
        <div className="flex flex-col flex-grow bg-white/5 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]">
          <div className="flex items-center h-20 px-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
              <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-8 w-auto" />
            </div>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300',
                    isActive
                      ? 'bg-brand-red/10 text-brand-red text-shadow-glow shadow-[inset_0px_0px_20px_0px_rgba(255,77,50,0.15)] border border-brand-red/20'
                      : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-4 h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                      isActive ? 'text-brand-red drop-shadow-[0_0_8px_rgba(255,77,50,0.8)]' : 'text-white/40 group-hover:text-white/80'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-6 bg-white/[0.02]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-red to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,77,50,0.4)] border border-white/10">
                  <span className="text-lg font-black text-white tracking-wider">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-4 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs font-mono text-white/50 capitalize truncate">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-1">
              <Link
                to="/profile"
                className="group flex items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
              >
                <User className="mr-3 h-4 w-4 text-white/40 group-hover:text-white/80" />
                Profile
              </Link>
              {user?.role !== 'staff' && (
                <Link
                  to="/settings"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4 text-white/40 group-hover:text-white/80" />
                  Settings
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="group flex w-full items-center px-3 py-2 text-sm font-medium text-white/60 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4 text-white/40 group-hover:text-red-400" />
                Sign out
              </button>

              {/* Demo Mode Toggle */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <button
                  onClick={toggleDemoMode}
                  className={`group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${demoMode
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[inset_0px_0px_15px_0px_rgba(245,158,11,0.15)]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                >
                  <FlaskConical className={`mr-3 h-4 w-4 transition-colors ${demoMode ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-white/40 group-hover:text-white/80'
                    }`} />
                  {demoMode ? 'Demo Mode ON' : 'Demo Mode OFF'}
                </button>
                {demoMode && (
                  <p className="mt-2 px-3 text-[10px] font-mono uppercase tracking-wider text-amber-500/70">
                    Showing mock data for demos
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1 relative z-10">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white/5 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-8 w-auto" />
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className={cn("flex-1 overflow-y-auto relative z-10", (location.pathname.startsWith('/map-editor') || location.pathname.startsWith('/security')) ? "bg-[#050505] h-full" : "bg-transparent")}>
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
