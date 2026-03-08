import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/loadingSpinner'
import { ArrowLeft, CheckCircle2, Lock, Circle, Copy, Plus, Trash2, Share2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'

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
    const { user } = useAuth()
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
                <p className="text-white/50">Event not found</p>
                <Link to="/events" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
                    Back to Events
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/events')}
                        className="p-2 rounded-lg bg-[#1C1C1F] border border-[#2A2A2A] text-white/50 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white/90">Event Setup</h1>
                        <p className="text-sm text-white/50">{event.name}</p>
                    </div>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => navigate(`/events/${eventId}/edit`)}
                        className="px-4 py-2 bg-[#1B1B1F] border border-[#2A2A2A] rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors shadow-sm"
                    >
                        Edit Details
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="bg-[#111113] border border-[#2A2A2A] rounded-xl p-6 mb-8 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold text-white/90">Setup Progress</h2>
                    <span className="text-sm font-medium text-white/50">
                        {completedSteps} of {totalSteps} complete
                    </span>
                </div>
                <div className="w-full bg-[#1C1C1F] rounded-full h-2.5 overflow-hidden border border-[#2A2A2A]">
                    <div
                        className="bg-brand-red h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,77,50,0.3)]"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Steps List */}
            <div className="space-y-4 mb-12">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={cn(
                            "bg-[#111113] border border-[#2A2A2A] rounded-xl p-6 transition-all",
                            step.locked ? 'opacity-40 grayscale' : 'hover:border-[#3A3A3A] shadow-sm'
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <div className={cn(
                                    "mt-1 rounded-full p-1 border-2",
                                    step.completed
                                        ? 'bg-green-500/10 border-green-500/50 text-green-500'
                                        : 'bg-[#1C1C1F] border-[#2A2A2A] text-white/30'
                                )}>
                                    {step.completed ? (
                                        <CheckCircle2 className="h-6 w-6" />
                                    ) : (
                                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                                        {step.title}
                                        {step.locked && <Lock className="h-4 w-4 text-white/30" />}
                                    </h3>
                                    <p className="text-sm text-white/50 mt-1 max-w-lg">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {!step.locked && (
                                <button
                                    onClick={step.action}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm",
                                        step.completed
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'
                                    )}
                                >
                                    {step.completed ? 'Edit' : 'Get Started'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Event Floorplans Gallery */}
            <div className="bg-[#111113] border border-[#2A2A2A] rounded-xl p-6 mb-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white/90">Event Floorplans</h2>
                        <p className="text-sm text-white/50 mt-1">Manage and link multiple levels for this event</p>
                    </div>
                    <button
                        onClick={() => navigate(`/map-editor?eventId=${eventId}`)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg text-sm font-semibold hover:bg-blue-600/20 transition-all shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Floorplan
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {floorplans.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-[#1C1C1F]/50 border border-dashed border-[#2A2A2A] rounded-xl">
                            <p className="text-white/40">No floorplans uploaded yet.</p>
                            <button
                                onClick={() => navigate(`/map-editor?eventId=${eventId}`)}
                                className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300"
                            >
                                Upload your first map
                            </button>
                        </div>
                    ) : (
                        floorplans.map((plan) => (
                            <div
                                key={plan.id}
                                className="group relative bg-[#1C1C1F] border border-[#2A2A2A] rounded-xl overflow-hidden hover:border-[#3A3A3A] transition-all shadow-sm flex flex-col"
                            >
                                <div className="aspect-video bg-[#09090B] flex items-center justify-center overflow-hidden border-b border-[#2A2A2A]">
                                    <img
                                        src={plan.image_url}
                                        alt={plan.name}
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                                    />
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-white/90 truncate mr-2">{plan.name}</h3>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border",
                                            plan.is_calibrated
                                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                        )}>
                                            {plan.is_calibrated ? 'Calibrated' : 'Uncalibrated'}
                                        </span>
                                    </div>
                                    <div className="mt-auto flex items-center space-x-2">
                                        <button
                                            onClick={() => navigate(`/map-editor?eventId=${eventId}&floorplanId=${plan.id}`)}
                                            className="flex-1 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white/70 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-transparent hover:border-[#4A4A4A]"
                                        >
                                            Edit Map
                                        </button>
                                        <button
                                            onClick={() => {/* TODO: Add delete floorplan */ }}
                                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Magic Link Generator Section */}
            <div className="bg-[#111113] border border-[#2A2A2A] rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-lg font-semibold text-white/90">Magic Link Generator</h2>
                            <span className="bg-brand-yellow/10 text-brand-yellow text-[10px] px-2 py-0.5 rounded-full font-bold border border-brand-yellow/20">BETA</span>
                        </div>
                        <p className="text-sm text-white/50 max-w-md">
                            Generate unique navigation links for WhatsApp distribution. These bypass volatile mobile browser caches.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                value={attendeePrefix}
                                onChange={(e) => setAttendeePrefix(e.target.value)}
                                placeholder="Enter name or group"
                                className="w-full px-4 py-2 bg-[#1C1C1F] border border-[#2A2A2A] text-white/90 placeholder-white/30 rounded-lg focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow outline-none transition-all sm:text-sm"
                            />
                        </div>
                        <button
                            onClick={handleGenerateLink}
                            disabled={!attendeePrefix}
                            className="bg-brand-red text-white px-6 py-2 rounded-lg font-semibold hover:shadow-[0_0_15px_rgba(255,77,50,0.4)] transition-all disabled:opacity-50 disabled:grayscale sm:text-sm"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                {generatedLink && (
                    <div className="mt-8 space-y-3 relative z-10">
                        <div className="flex items-center gap-3 p-3 bg-[#1C1C1F] border border-[#2A2A2A] rounded-xl group hover:border-[#3A3A3A] transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white/30 mb-1">Generated Magic Link</p>
                                <p className="text-sm text-white/90 truncate font-mono">{generatedLink}</p>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 text-white/50 hover:text-white bg-[#2A2A2A] rounded-lg transition-colors"
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Hi! Here is your custom navigation link for ${event.name}: ${generatedLink}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-green-400 hover:text-green-300 bg-green-400/10 border border-green-400/20 rounded-lg transition-colors"
                            >
                                <Share2 className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EventSetupPage
