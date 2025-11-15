import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

type Role = 'admin' | 'staff' | 'sponsor'

export const RoleSelectorPage = () => {
  const { user, updateUserRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleRoleSelect = async (role: Role) => {
    setLoading(true)
    setError(null)
    try {
      await updateUserRole(role)
      navigate('/dashboard') // Role is set, now go to dashboard
    } catch (err: any) {
      setError(err.message || 'Failed to update role')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">No user logged in</h1>
              <p className="mt-1 text-sm text-gray-600">Please log in or register to select a role.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/login')} className="w-1/2">Login</Button>
              <Button variant="outline" onClick={() => navigate('/register')} className="w-1/2">Register</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Select Your Role</h1>
            <p className="mt-1 text-sm text-gray-600">
              Choose your role for the DPM platform. This determines your access level.
            </p>
          </div>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleRoleSelect('admin')}
              disabled={loading}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Event Admin
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleRoleSelect('staff')}
              disabled={loading}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Staff
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleRoleSelect('sponsor')}
              disabled={loading}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Sponsor
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RoleSelectorPage
