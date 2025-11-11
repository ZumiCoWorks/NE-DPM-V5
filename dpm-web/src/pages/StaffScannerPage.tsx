import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { Camera, Save, CheckCircle, AlertCircle } from 'lucide-react'

export const StaffScannerPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [ticketId, setTicketId] = useState('')
  const [scannedLead, setScannedLead] = useState<{ name: string; email: string; ticket_id: string } | null>(null)
  const [currentEventId, setCurrentEventId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user has staff or admin role
    if (!loading && user && user.role !== 'admin' && user.role !== 'staff') {
      toast.error('Access denied. This page is for staff only.')
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  const handleScanTicket = async () => {
    if (!ticketId.trim()) {
      setError('Please enter a ticket ID')
      return
    }

    setLoading(true)
    setError(null)
    setScannedLead(null)

    try {
      // Get the Quicket API key from session storage
      const quicketApiKey = sessionStorage.getItem('quicket_api_key')
      
      if (!quicketApiKey) {
        setError('Quicket API key not found. Please configure it in Settings.')
        setLoading(false)
        return
      }

      // Get the auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // Call the Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-quicket-lead`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'X-Quicket-Api-Key': quicketApiKey,
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          event_id: currentEventId || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch lead data')
      }

      const leadData = await response.json()
      setScannedLead(leadData)
      toast.success('Lead scanned successfully!')
      
    } catch (err: any) {
      console.error('Error scanning ticket:', err)
      setError(err.message || 'Failed to scan ticket')
      toast.error(err.message || 'Failed to scan ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLead = async () => {
    if (!scannedLead || !user) {
      return
    }

    if (!currentEventId) {
      setError('Please enter an Event ID')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('qualified_leads')
        .insert({
          event_id: currentEventId,
          staff_user_id: user.id,
          lead_name: scannedLead.name,
          lead_email: scannedLead.email,
        })

      if (error) {
        // Check if it's a duplicate error
        if (error.code === '23505') {
          toast.warning('This lead has already been captured for this event')
        } else {
          throw error
        }
      } else {
        toast.success('Lead saved successfully!')
      }

      // Clear the form
      setScannedLead(null)
      setTicketId('')
      
    } catch (err: any) {
      console.error('Error saving lead:', err)
      setError(err.message || 'Failed to save lead')
      toast.error(err.message || 'Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  const handleManualEntry = () => {
    // For development/testing: allow manual ticket ID entry
    handleScanTicket()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Camera className="mr-2 h-6 w-6" />
          Lead Scanner
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Scan Quicket tickets to capture qualified leads
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Card>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="event-id" className="block text-sm font-medium text-gray-700 mb-1">
              Event ID *
            </label>
            <Input
              id="event-id"
              type="text"
              placeholder="Enter event UUID"
              value={currentEventId}
              onChange={(e) => setCurrentEventId(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Required to associate leads with the correct event
            </p>
          </div>

          <div>
            <label htmlFor="ticket-id" className="block text-sm font-medium text-gray-700 mb-1">
              Ticket ID
            </label>
            <Input
              id="ticket-id"
              type="text"
              placeholder="Scan QR code or enter ticket ID"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualEntry()
                }
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a QR scanner or enter the ticket ID manually
            </p>
          </div>

          <Button
            onClick={handleManualEntry}
            disabled={loading || !ticketId.trim() || !currentEventId}
            className="w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Scanning...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Scan Ticket
              </>
            )}
          </Button>
        </div>
      </Card>

      {scannedLead && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Scanned Lead</h2>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <p className="text-base font-semibold text-gray-900">{scannedLead.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-base text-gray-900">{scannedLead.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Ticket ID:</span>
                <p className="text-sm text-gray-600">{scannedLead.ticket_id}</p>
              </div>
            </div>

            <Button
              onClick={handleSaveLead}
              disabled={saving}
              className="w-full"
              variant="primary"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Lead
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Enter the Event ID for the current event</li>
            <li>Scan attendee's Quicket ticket QR code or enter ticket ID manually</li>
            <li>Review the lead information displayed</li>
            <li>Click "Save Lead" to capture the qualified lead</li>
            <li>The lead will be associated with your staff account and the event</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default StaffScannerPage
