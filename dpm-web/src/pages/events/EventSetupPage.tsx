import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { ArrowLeft, CheckCircle2, Lock, Circle, Copy } from 'lucide-react'

interface Event {
    id: string
    name: string
    start_date: string
    end_date: string
}

interface Floorplan {
    id: string
    name: string
    image_url: string
    is_calibrated: boolean
}

interface SetupStep {
    id: string
    title: string
    description: string
    completed: boolean
    locked: boolean
    action?: () => void
}

export const EventSetupPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>()
    const navigate = useNavigate()
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [floorplans, setFloorplans] = useState<Floorplan[]>([])
    const [hasFloorplan, setHasFloorplan] = useState(false)
    const [hasGPSBounds, setHasGPSBounds] = useState(false)
    const [hasNavigationPoints, setHasNavigationPoints] = useState(false)

    // Magic Link Generator State
    const [attendeePrefix, setAttendeePrefix] = useState('')
    const [generatedLink, setGeneratedLink] = useState('')

    const handleGenerateLink = () => {
        if (!attendeePrefix) return;
        const id = `${attendeePrefix.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(Math.random() * 10000)}`
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://naveaze-attendee-app.vercel.app'
        setGeneratedLink(`${baseUrl}?attendee_id=${id}&event_id=${eventId}`)
    }

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink)
            alert('Magic link copied to clipboard!')
        }
    }

    useEffect(() => {
        if (eventId) {
            loadEventData()
        }
    }, [eventId])

    const loadEventData = async () => {
        try {
            setLoading(true)

            if (!supabase) throw new Error('Supabase client not initialized');
            // Load event details
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('id, name, start_date, end_date')
                .eq('id', eventId)
                .single()

            if (eventError) throw eventError
            setEvent(eventData as unknown as Event)

            if (!supabase) throw new Error('Supabase client not initialized');
            // Check for floorplans
            const { data: floorplanData, error: floorplanError } = await supabase
                .from('floorplans')
                .select('id, name, image_url, is_calibrated')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true })

            if (floorplanError && (floorplanError as any).code !== 'PGRST116') {
                console.error('Error loading floorplans:', floorplanError)
            }

            const plans = (floorplanData || []) as Floorplan[];
            setFloorplans(plans)
            setHasFloorplan(plans.length > 0)
            setHasGPSBounds(plans.some(p => p.is_calibrated))

            // Check for navigation points (using floorplan-centric schema)
            if (plans.length > 0) {
                if (!supabase) throw new Error('Supabase client not initialized');

                // Get all floorplan IDs
                const planIds = plans.map(p => p.id);

                const { data: navPoints, error: navError } = await supabase
                    .from('navigation_points')
                    .select('id')
                    .in('floorplan_id', planIds)
                    .limit(1)

                if (navError && (navError as any).code !== 'PGRST116') {
                    console.error('Error loading navigation points:', navError)
                }

                setHasNavigationPoints(Array.isArray(navPoints) && navPoints.length > 0)
            } else {
                setHasNavigationPoints(false)
            }

        } catch (error) {
            console.error('Error loading event data:', error)
        } finally {
            setLoading(false)
        }
    }

    const steps: SetupStep[] = [
        {
            id: 'event-created',
            title: 'Event Created',
            description: 'Basic event details saved successfully',
            completed: true,
            locked: false,
        },
        {
            id: 'upload-floorplan',
            title: 'Upload Floorplan',
            description: 'Upload a floor plan image to enable GPS calibration',
            completed: hasFloorplan,
            locked: false,
            action: () => navigate(`/map-editor?eventId=${eventId}`),
        },
        {
            id: 'calibrate-gps',
            title: 'Calibrate GPS',
            description: 'Set GPS bounds for accurate positioning',
            completed: hasGPSBounds,
            locked: !hasFloorplan,
            action: () => navigate(`/map-editor?eventId=${eventId}`),
        },
        {
            id: 'add-navigation',
            title: 'Add Navigation Points',
            description: 'Place POIs and waypoints on the map',
            completed: hasNavigationPoints,
            locked: !hasGPSBounds,
            action: () => navigate(`/map-editor?eventId=${eventId}`),
        },
        {
            id: 'generate-qr',
            title: 'Generate QR Codes',
            description: 'Create printable QR codes for indoor positioning',
            completed: false,
            locked: !hasNavigationPoints,
            action: () => navigate(`/map-editor?eventId=${eventId}`),
        },
    ]

    const completedSteps = steps.filter(s => s.completed).length
    const totalSteps = steps.length
    const progressPercentage = (completedSteps / totalSteps) * 100

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    if (!event) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Event not found</p>
                <Link to="/events" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                    Back to Events
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link
                    to="/events"
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Event Setup</h1>
                    <p className="mt-1 text-sm text-gray-500">{event.name}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-gray-900">Setup Progress</h2>
                    <span className="text-sm font-medium text-gray-600">
                        {completedSteps} of {totalSteps} complete
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Setup Steps */}
            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`bg-white shadow rounded-lg p-6 border-2 transition-all ${step.completed
                            ? 'border-green-200 bg-green-50'
                            : step.locked
                                ? 'border-gray-200 bg-gray-50 opacity-60'
                                : 'border-blue-200 bg-blue-50'
                            }`}
                    >
                        <div className="flex items-start space-x-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                {step.completed ? (
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                ) : step.locked ? (
                                    <Lock className="h-8 w-8 text-gray-400" />
                                ) : (
                                    <Circle className="h-8 w-8 text-blue-600" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {index + 1}. {step.title}
                                    </h3>
                                    {step.completed && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Complete
                                        </span>
                                    )}
                                    {step.locked && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            Locked
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-gray-600">{step.description}</p>

                                {/* Action Button - Show for both incomplete and completed steps */}
                                {!step.locked && step.action && (
                                    <button
                                        onClick={step.action}
                                        className={`mt-4 inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${step.completed
                                            ? 'border-green-600 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
                                            : 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                            }`}
                                    >
                                        {step.completed ? (
                                            <>
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </>
                                        ) : (
                                            <>
                                                {step.id === 'upload-floorplan' && 'Upload Floorplan'}
                                                {step.id === 'calibrate-gps' && 'Calibrate GPS'}
                                                {step.id === 'add-navigation' && 'Add Navigation Points'}
                                                {step.id === 'generate-qr' && 'Generate QR Codes'}
                                            </>
                                        )}
                                    </button>
                                )}

                                {step.locked && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Complete the previous step to unlock
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completion Message */}
            {completedSteps === totalSteps && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <div>
                            <h3 className="text-lg font-medium text-green-900">Setup Complete!</h3>
                            <p className="mt-1 text-sm text-green-700">
                                Your event is ready for the pilot. You can now test the attendee experience.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Floorplans Gallery */}
            <div className="bg-white shadow rounded-lg p-6 border-2 border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Event Floorplans</h2>
                        <p className="text-sm text-gray-600">Upload multiple floorplans to create a multi-level or hybrid indoor/outdoor campus.</p>
                    </div>
                    <Link
                        to={`/map-editor?eventId=${eventId}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                    >
                        + Add Floorplan
                    </Link>
                </div>

                {floorplans.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">No floorplans uploaded yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Upload your first map to start building the navigation graph.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {floorplans.map((f, i) => (
                            <div key={f.id} className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                                <Link to={`/map-editor?eventId=${eventId}&floorplanId=${f.id}`} className="block">
                                    <div className="aspect-[4/3] bg-gray-200 w-full overflow-hidden">
                                        {f.image_url ? (
                                            <img src={f.image_url} alt={f.name || `Floorplan ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 truncate">{f.name || `Floorplan ${i + 1}`}</h3>
                                        <div className="flex items-center mt-2">
                                            {f.is_calibrated ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    GPS Calibrated
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Indoor (No GPS)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Magic Link Generator */}
            <div className="bg-white shadow rounded-lg p-6 border-2 border-brand-yellow/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow"></div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Generate Attendee Magic Link (WhatsApp)</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Create persistent, trackable links to distribute via WhatsApp. These bypass the volatile in-app browser cache.
                </p>

                <div className="flex gap-3 mb-4">
                    <input
                        type="text"
                        value={attendeePrefix}
                        onChange={(e) => setAttendeePrefix(e.target.value)}
                        placeholder="Enter name or group (e.g. VIP_John)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none"
                    />
                    <button
                        onClick={handleGenerateLink}
                        disabled={!attendeePrefix}
                        className="px-6 py-2 bg-brand-yellow text-brand-black font-bold rounded-lg shadow-sm hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                    >
                        Generate URL
                    </button>
                </div>

                {generatedLink && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                        <code className="text-sm text-blue-600 break-all mr-4">{generatedLink}</code>
                        <button
                            onClick={copyToClipboard}
                            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors flex-shrink-0"
                            title="Copy to clipboard"
                        >
                            <Copy className="h-5 w-5 text-gray-700" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EventSetupPage
