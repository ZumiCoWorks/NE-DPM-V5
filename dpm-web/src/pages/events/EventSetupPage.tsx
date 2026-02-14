import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { ArrowLeft, CheckCircle2, Lock, Circle } from 'lucide-react'

interface Event {
    id: string
    name: string
    start_date: string
    end_date: string
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
    const [hasFloorplan, setHasFloorplan] = useState(false)
    const [hasGPSBounds, setHasGPSBounds] = useState(false)
    const [hasNavigationPoints, setHasNavigationPoints] = useState(false)

    useEffect(() => {
        if (eventId) {
            loadEventData()
        }
    }, [eventId])

    const loadEventData = async () => {
        try {
            setLoading(true)

            // Load event details
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('id, name, start_date, end_date')
                .eq('id', eventId)
                .single()

            if (eventError) throw eventError
            setEvent(eventData)

            // Check for floorplan
            const { data: floorplanData, error: floorplanError } = await supabase
                .from('floorplans')
                .select('id, is_calibrated')
                .eq('event_id', eventId)
                .maybeSingle()

            if (floorplanError && floorplanError.code !== 'PGRST116') {
                console.error('Error loading floorplan:', floorplanError)
            }

            setHasFloorplan(!!floorplanData)
            setHasGPSBounds(!!floorplanData?.is_calibrated)

            // Check for navigation points (using floorplan-centric schema)
            if (floorplanData?.id) {
                const { data: navPoints, error: navError } = await supabase
                    .from('navigation_points')
                    .select('id')
                    .eq('floorplan_id', floorplanData.id)
                    .limit(1)

                if (navError && navError.code !== 'PGRST116') {
                    console.error('Error loading navigation points:', navError)
                }

                setHasNavigationPoints((navPoints?.length || 0) > 0)
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
                    <div className="mt-4 flex space-x-3">
                        <Link
                            to={`/map-editor?eventId=${eventId}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                        >
                            View Map Editor
                        </Link>
                        <Link
                            to="/events"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Back to Events
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EventSetupPage
