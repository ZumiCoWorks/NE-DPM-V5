import React from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { HVZFloorplanEditor } from '../components/HVZFloorplanEditor'

interface FloorplansPageProps {
  onTabChange?: (tab: string) => void
  venueId?: string
}

export const FloorplansPage: React.FC<FloorplansPageProps> = ({ onTabChange, venueId }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleBack = () => {
    onTabChange?.('venues')
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
        <HVZFloorplanEditor 
          venueId={venueId} 
          onSave={(floorplan) => {
            console.log('Floorplan saved:', floorplan)
          }}
        />
      </main>
    </div>
  )
}

export default FloorplansPage