import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { User, Building2 } from 'lucide-react'
import type { Database } from '../types/database'

type UserRole = Database['public']['Tables']['users']['Row']['role']

const roles = [
  {
    id: 'event_organizer' as UserRole,
    title: "Event Organizer",
    description: 'Manage events, attendees, and event analytics.',
    icon: User,
    cta: 'Select Event Organizer',
  },
  {
    id: 'venue_manager' as UserRole,
    title: "Venue Manager",
    description: 'Manage venues, spaces, and venue operations.',
    icon: Building2,
    cta: 'Select Venue Manager',
  },
]

export const RoleSelectorPage: React.FC = () => {
  const { user, profile, loading, updateUserRole } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // If user already has a role, redirect to dashboard
    if (!loading && profile?.role) {
      navigate('/dashboard')
    }
  }, [profile, loading, navigate])

  // If no user, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If user has role, show loading while redirecting
  if (profile?.role) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const handleSelect = async (role: UserRole) => {
    setSubmitting(true)
    setError(null)
    try {
      await updateUserRole(role)
      navigate('/dashboard') // Role is set, now go to dashboard
    } catch (err) {
      const error = err as Error
      setError(error.message || 'Failed to update role')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Select Your Role</h1>
          <p className="mt-2 text-sm text-gray-600">Choose how you'll be using the platform</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {roles.map((r) => {
            const Icon = r.icon
            return (
              <div key={r.id} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
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
                      onClick={() => handleSelect(r.id)}
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        r.cta
                      )}
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
