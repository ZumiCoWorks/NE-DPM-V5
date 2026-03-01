import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Shield, AlertTriangle, CheckCircle, MapPin, Clock, Radio, User, Maximize2, Users, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, ImageOverlay, Marker, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Alert {
    id: string;
    type: string;
    status: string;
    gps_lat: number;
    gps_lng: number;
    created_at: string;
    user_id?: string;
    metadata?: any;
}

interface AttendeeLocation {
    attendee_id: string;
    event_id: string;
    lat: number;
    lng: number;
    accuracy?: number;
    last_ping_at: string;
}

// --- Live Attendee Tracking Hook ---
const useLiveAttendees = () => {
    const [attendees, setAttendees] = useState<Map<string, AttendeeLocation>>(new Map());

    useEffect(() => {
        if (!supabase) return;

        // Fetch initial active attendees (last 5 minutes)
        const fetchInitial = async () => {
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const query = supabase!.from('attendee_locations').select('*') as any;
            const { data, error } = await query.gte('last_ping_at', fiveMinsAgo);

            if (error) {
                console.error("Error fetching live attendees:", error);
                return;
            }

            if (data) {
                const map = new Map<string, AttendeeLocation>();
                data.forEach((a: any) => map.set(a.attendee_id, a as AttendeeLocation));
                setAttendees(map);
            }
        };

        fetchInitial();

        // Subscribe to real-time location updates
        const client = supabase as any;
        const subscription = client
            .channel('live_attendees')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendee_locations' }, (payload: any) => {
                const newLoc = payload.new as AttendeeLocation;
                // Only keep recent pings
                const isRecent = new Date(newLoc.last_ping_at).getTime() > Date.now() - 5 * 60 * 1000;
                setAttendees(prev => {
                    const next = new Map(prev);
                    if (isRecent) {
                        next.set(newLoc.attendee_id, newLoc);
                    } else {
                        next.delete(newLoc.attendee_id);
                    }
                    return next;
                });
            })
            .subscribe();

        // Periodic cleanup of stale locations
        const cleanup = setInterval(() => {
            setAttendees(prev => {
                const next = new Map(prev);
                let changed = false;
                const fiveMinsAgo = Date.now() - 5 * 60 * 1000;

                for (const [id, loc] of next.entries()) {
                    if (new Date(loc.last_ping_at).getTime() < fiveMinsAgo) {
                        next.delete(id);
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 30000); // Check every 30s

        return () => {
            subscription.unsubscribe();
            clearInterval(cleanup);
        };
    }, []);

    return Array.from(attendees.values());
};
// --- Map Center Helper ---
function MapReCenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export default function SecurityDashboard() {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
    const [floorplan, setFloorplan] = useState<any>(null);
    const [gpsBounds, setGpsBounds] = useState<[[number, number], [number, number]] | null>(null);

    // Fetch Alerts & Floorplan
    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            const client = supabase;
            if (!client) return;

            // 1. Fetch Alerts
            const { data: alertsData } = await client
                .from('safety_alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (alertsData) setAlerts(alertsData as unknown as Alert[]);

            // 2. Fetch Active Floorplan (Just grab the most recent one for the demo)
            const { data: fpData } = await client
                .from('floorplans')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fpData && (fpData as Record<string, any>).image_url) {
                setFloorplan(fpData as any);
                const fp = fpData as any;
                // Use calibrated bounds if available, else event bounds, else default
                if (fp.is_calibrated && fp.gps_top_left_lat) {
                    setGpsBounds([
                        [Math.min(fp.gps_bottom_left_lat, fp.gps_bottom_right_lat), Math.min(fp.gps_bottom_left_lng, fp.gps_top_left_lng)], // SW
                        [Math.max(fp.gps_top_left_lat, fp.gps_top_right_lat), Math.max(fp.gps_top_right_lng, fp.gps_bottom_right_lng)]    // NE
                    ]);
                } else {
                    // Fallback to strict event bounds or hardcoded default for demo
                    setGpsBounds([
                        [-26.0, 28.0],
                        [-25.9, 28.1]
                    ]);
                }
            }

            setLoading(false);
        };

        initData();

        // Realtime Subscription
        const client = supabase;
        if (!client) return;

        const subscription = (client as any)
            .channel('security_dashboard_main')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'safety_alerts' }, (payload: any) => {
                console.log('🚨 REALTIME ALERT RECEIVED:', payload);
                const newAlert = payload.new as Alert;
                setAlerts(prev => [newAlert, ...prev]);
                new Audio('/notification.mp3').play().catch((e) => console.log('Audio play failed:', e));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'safety_alerts' }, (payload: any) => {
                console.log('🔄 REALTIME UPDATE RECEIVED:', payload);
                setAlerts((prev) => prev.map(a => a.id === payload.new.id ? payload.new : a));
            })
            .subscribe((status: any) => {
                console.log('🔌 SUBSCRIPTION STATUS:', status);
            });

        return () => { subscription.unsubscribe(); };
    }, []);

    const updateAlertStatus = async (id: string, status: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a)); // Optimistic
        if (supabase) {
            await supabase.from('safety_alerts').update({
                status,
                resolved_at: status === 'resolved' ? new Date().toISOString() : null
            }).eq('id', id);
        }
    };

    const activeAlerts = alerts.filter(a => a.status !== 'resolved');
    const liveAttendees = useLiveAttendees();

    // Calculate map center
    const mapCenter: [number, number] = gpsBounds
        ? [(gpsBounds[0][0] + gpsBounds[1][0]) / 2, (gpsBounds[0][1] + gpsBounds[1][1]) / 2]
        : [-25.747, 28.187]; // Default fallback

    return (
        <div className="h-screen bg-gray-900 text-white font-sans flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-3 flex-shrink-0 z-20 shadow-md">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 mr-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300 hover:text-white flex items-center gap-2 group"
                            title="Return to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold tracking-wider hidden sm:block uppercase">Exit</span>
                        </button>
                        <Shield className="w-6 h-6 text-brand-yellow" />
                        <h1 className="text-lg font-bold tracking-tight">SECURITY CMD CENTER</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-xl font-mono font-bold text-blue-400">{liveAttendees.length}</span>
                            <span className="text-xs text-gray-400">ON SITE</span>
                        </div>
                        <div className="h-6 w-px bg-gray-700"></div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-900/40 border border-red-500/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-red-200 tracking-wider">LIVE</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout: Split View */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT PANEL: Alerts Feed (30%) */}
                <div className="w-1/3 min-w-[350px] max-w-[450px] border-r border-gray-700 flex flex-col bg-gray-900/95 backdrop-blur z-10">
                    <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                        <div className="flex gap-2 p-1 bg-gray-900 rounded-lg">
                            <button
                                onClick={() => setActiveTab('live')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'live' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Active ({activeAlerts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {(activeTab === 'live' ? activeAlerts : alerts.filter(a => a.status === 'resolved')).map(alert => (
                            <div key={alert.id} className={`p-4 rounded-xl border transition-all ${alert.status === 'new'
                                ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                : 'bg-gray-800 border-gray-700'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {alert.status === 'new' ? (
                                            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                        <span className={`font-bold uppercase text-sm ${alert.status === 'new' ? 'text-red-400' : 'text-gray-300'}`}>
                                            {alert.type}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">{new Date(alert.created_at).toLocaleTimeString()}</span>
                                </div>

                                <div className="text-sm text-gray-300 mb-3 pl-7">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-3 h-3 text-gray-500" />
                                        <span>User: {alert.user_id?.slice(0, 6) || 'Guest'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-gray-500" />
                                        <span>{alert.gps_lat != null ? `${alert.gps_lat.toFixed(5)}, ${alert.gps_lng.toFixed(5)}` : '📍 Location Unknown'}</span>
                                    </div>
                                </div>

                                {alert.status !== 'resolved' && (
                                    <div className="flex gap-2 pl-7">
                                        {alert.gps_lat != null && (
                                            <a
                                                href={`https://www.google.com/maps?q=${alert.gps_lat},${alert.gps_lng}`}
                                                target="_blank" rel="noreferrer"
                                                className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors"
                                            >
                                                Locate
                                            </a>
                                        )}
                                        <button
                                            onClick={() => updateAlertStatus(alert.id, 'resolved')}
                                            className="flex-1 px-3 py-1.5 text-xs bg-white text-black font-bold hover:bg-gray-200 rounded transition-colors"
                                        >
                                            Mark Resolved
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {activeTab === 'live' && activeAlerts.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                <p>All Systems Normal</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Live Map (70%) */}
                <div className="flex-1 relative bg-black">
                    {floorplan && gpsBounds ? (
                        <MapContainer
                            center={mapCenter}
                            zoom={19}
                            minZoom={17}
                            maxZoom={22}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />

                            <ImageOverlay
                                url={floorplan.image_url}
                                bounds={gpsBounds}
                                opacity={0.6}
                            />

                            {/* LIVE ATTENDEES LAYER */}
                            {liveAttendees.map(p => (
                                <CircleMarker
                                    key={`attendee-${p.attendee_id}`}
                                    center={[p.lat, p.lng]}
                                    radius={4}
                                    pathOptions={{
                                        color: '#3b82f6',
                                        fillColor: '#60a5fa',
                                        fillOpacity: 0.8,
                                        weight: 1
                                    }}
                                />
                            ))}

                            {/* ACTIVE ALERTS LAYER — only render if GPS available */}
                            {activeAlerts.filter(a => a.gps_lat != null && a.gps_lng != null).map(alert => (
                                <Marker
                                    key={alert.id}
                                    position={[alert.gps_lat, alert.gps_lng]}
                                    icon={new L.DivIcon({
                                        className: 'bg-transparent',
                                        html: `<div class="relative w-12 h-12 flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                                            <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                                            <div class="relative w-4 h-4 bg-red-600 border-2 border-white rounded-full shadow-lg"></div>
                                        </div>`
                                    })}
                                />
                            ))}

                            <MapReCenter center={mapCenter} />
                        </MapContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p>Calibrating Map Systems...</p>
                            </div>
                        </div>
                    )}

                    {/* Map Overlay Controls */}
                    <div className="absolute top-4 right-4 z-[400] bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg p-3 shadow-xl">
                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Crowd Density</div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
                            <span className="text-xs text-gray-300">Normal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-xs text-gray-300">Critical Alert</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
