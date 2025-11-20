import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to log in')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="mb-8 flex items-center">
            <img src="/nav-eaze-logo.svg" alt="NavEaze" className="h-16 mb-4" />
          </div>
          <h2 className="text-3xl font-semibold mb-4">Effortlessly manage your team and operations</h2>
          <p className="text-gray-300 text-lg">
            Streamline event navigation, staff management, and attendee experiences with our powerful platform.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E63946' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Real-time Navigation</p>
                <p className="text-sm text-gray-400">GPS-powered indoor wayfinding</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD700' }}>
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Team Management</p>
                <p className="text-sm text-gray-400">Coordinate staff efficiently</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* NavEaze Red accent bar */}
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #FFD700 0%, #E63946 50%, #FFD700 100%)' }}></div>
            
            <div className="p-8">
              {/* Mobile logo */}
              <div className="lg:hidden mb-6 text-center">
                <img src="/nav-eaze-logo.svg" alt="NavEaze" className="h-12 mx-auto mb-2" />
                <p className="text-gray-600">Welcome back</p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-black mb-2">Sign In</h2>
                <p className="text-gray-600">
                  Access your dashboard and manage your events
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-l-4 border-accent text-red-800 px-4 py-3 rounded" role="alert">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <div className="mt-2 text-right">
                    <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-accent transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  style={{ backgroundColor: '#E63946' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D62839'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E63946'}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">New to NavEaze?</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link 
                    to="/register" 
                    className="inline-block w-full py-3 px-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Create Account
                  </Link>
                </div>
              </form>

              <p className="mt-8 text-center text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-accent hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-accent hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            © 2025 NavEaze™. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}