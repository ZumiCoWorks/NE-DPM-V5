import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { User, DollarSign, Shield } from 'lucide-react'

const roles = [
  {
    id: 'attendee',
    title: "I'm an Attendee",
    description: 'Browse sessions, collect materials, and scan QR codes at booths.',
    icon: User,
    cta: 'Enter as Attendee',
  },
  {
    id: 'sponsor',
    title: "I'm a Sponsor",
    description: 'Manage your booth leads, share collateral and follow up with prospects.',
    icon: DollarSign,
    cta: 'Enter as Sponsor',
  },
  {
    id: 'admin',
    title: "I'm an Admin",
    description: 'Event setup, analytics and data exports for organisers and admins.',
    icon: Shield,
    cta: 'Enter as Admin',
  },
]

export const RoleSelectorPage: React.FC = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const handleSelect = (role: string) => {
    try {
      // persist choice so subsequent flows can pick it up (login/register pages can read this)
      sessionStorage.setItem('selectedRole', role)
    } catch (e) {
      // ignore storage errors
    }
    // send user to login to continue; pages can read sessionStorage to pre-select flows
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome to NavEaze</h1>
          <p className="mt-2 text-sm text-gray-600">Select how you'd like to use the app</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((r) => {
            const Icon = r.icon
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(r.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(r.id)
                  }
                }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              >
                <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow" padding="lg">
                  <div>
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{r.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{r.description}</p>
                  </div>

                  <div className="mt-6">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(r.id)
                      }}
                      className="w-full"
                    >
                      {r.cta}
                    </Button>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RoleSelectorPage
