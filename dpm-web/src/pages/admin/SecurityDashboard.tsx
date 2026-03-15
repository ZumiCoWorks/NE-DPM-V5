import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Shield, AlertTriangle, CheckCircle, MapPin, Clock, Radio, User, Maximize2, Users, ArrowLeft, Ticket } from 'lucide-react';
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
    /** Populated when the alert was sent by a registered attendee. */
    attendee_id?: string;
    metadata?: any;
}

/** Resolved identity info for an attendee, fetched once on demand. */
interface AttendeeInfo {
    full_name: string;
    ticket_type: string;
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
    /** One-time cache: attendee UUID → resolved identity info. */
    const [attendeeInfoCache, setAttendeeInfoCache] = useState<Map<string, AttendeeInfo>>(new Map());
    /** Tracks in-flight attendee lookups to prevent duplicate requests. */
    const pendingLookups = React.useRef<Set<string>>(new Set());

    /** Escape a string for safe insertion into an HTML template. */
    const escapeHtml = (str: string): string =>
        str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    /**
     * Look up a single attendee record by their UUID and store the result in
     * the local cache. The lookup is skipped when the ID is already cached,
     * a fetch is already in-flight, or the ID looks like an anonymous one.
     */
    const fetchAttendeeInfo = useCallback(async (attendeeId: string) => {
        if (!supabase || !attendeeId || attendeeId.startsWith('anon_')) return;
        if (pendingLookups.current.has(attendeeId)) return;

        setAttendeeInfoCache(prev => {
            if (prev.has(attendeeId)) return prev;
            // Mark as in-flight before starting the async work
            pendingLookups.current.add(attendeeId);
            (async () => {
                try {
                    const { data, error } = await (supabase as any)
                        .from('attendees')
                        .select('first_name, last_name, ticket_type')
                        .eq('id', attendeeId)
                        .single();

                    if (error || !data) return;

                    const full_name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';
                    const ticket_type = data.ticket_type || 'General';

                    setAttendeeInfoCache(cache => {
                        const next = new Map(cache);
                        next.set(attendeeId, { full_name, ticket_type });
                        return next;
                    });
                } catch {
                    // Non-fatal — silently ignore lookup failures
                } finally {
                    pendingLookups.current.delete(attendeeId);
                }
            })();
            return prev;
        });
    }, []);

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
            if (alertsData) {
                const fetchedAlerts = alertsData as unknown as Alert[];
                setAlerts(fetchedAlerts);
                // Kick off one-time attendee lookups for all loaded alerts
                fetchedAlerts.forEach(a => {
                    const id = a.attendee_id || a.user_id;
                    if (id) fetchAttendeeInfo(id);
                });
            }

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
                // Trigger one-time identity lookup for the incoming alert
                const id = newAlert.attendee_id || newAlert.user_id;
                if (id) fetchAttendeeInfo(id);
                // Safe audio playback for E2E tests
                if (typeof Audio !== 'undefined') {
                    try {
                        const audio = new Audio('/notification.mp3');
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(e => console.log('Audio autoplay prevented by browser (common in tests/e2e):', e));
                        }
                    } catch (e) {
                        console.error('Failed to instantiate Audio object:', e);
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'safety_alerts' }, (payload: any) => {
                console.log('🔄 REALTIME UPDATE RECEIVED:', payload);
                setAlerts((prev) => prev.map(a => a.id === payload.new.id ? payload.new : a));
            })
            .subscribe((status: any) => {
                console.log('🔌 SUBSCRIPTION STATUS:', status);
            });

        return () => { subscription.unsubscribe(); };
    }, [fetchAttendeeInfo]);

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
        <div className="h-screen bg-[#09090B] text-white font-sans flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-[#111113] border-b border-[#2A2A2A] p-3 flex-shrink-0 z-20 shadow-sm">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 mr-2 bg-[#1C1C1F] border border-[#2A2A2A] hover:bg-[#2A2A2A] hover:border-[#3A3A3A] rounded-lg transition-colors text-white/50 hover:text-white flex items-center gap-2 group"
                            title="Return to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold tracking-wider hidden sm:block uppercase">Exit</span>
                        </button>
                        <Shield className="w-6 h-6 text-brand-red opacity-90" />
                        <h1 className="text-lg font-bold tracking-tight text-white/90">SECURITY CMD CENTER</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-logic-blue" />
                            <span className="text-xl font-mono font-bold text-logic-blue">{liveAttendees.length}</span>
                            <span className="text-[10px] font-bold text-white/50 tracking-wider">ON SITE</span>
                        </div>
                        <div className="h-6 w-px bg-[#2A2A2A]"></div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-red-400 tracking-wider">LIVE</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout: Split View */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT PANEL: Alerts Feed (30%) */}
                <div className="w-1/3 min-w-[350px] max-w-[450px] border-r border-[#2A2A2A] flex flex-col bg-[#111113] z-10">
                    <div className="p-4 border-b border-[#2A2A2A] bg-[#161618]">
                        <div className="flex gap-2 p-1 bg-[#09090B] border border-[#2A2A2A] rounded-lg">
                            <button
                                onClick={() => setActiveTab('live')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'live' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                            >
                                Active ({activeAlerts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'history' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#09090B]">
                        {(activeTab === 'live' ? activeAlerts : alerts.filter(a => a.status === 'resolved')).map(alert => {
                            const attendeeId = alert.attendee_id || alert.user_id;
                            const attendeeInfo = attendeeId ? attendeeInfoCache.get(attendeeId) : undefined;
                            return (
                            <div key={alert.id} className={`p-4 rounded-xl border transition-all ${alert.status === 'new'
                                ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                                : 'bg-[#1C1C1F] border-[#2A2A2A]'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {alert.status === 'new' ? (
                                            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-green-500 opacity-80" />
                                        )}
                                        <span className={`font-bold uppercase text-[10px] tracking-wider ${alert.status === 'new' ? 'text-red-400' : 'text-white/50'}`}>
                                            {alert.type}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-white/30">{new Date(alert.created_at).toLocaleTimeString()}</span>
                                </div>

                                {/* Safety Intelligence: Attendee Identity Panel */}
                                {attendeeInfo ? (
                                    <div className="mb-3 pl-6">
                                        <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                            <User className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-amber-300 truncate" data-testid="alert-attendee-name">{attendeeInfo.full_name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Ticket className="w-2.5 h-2.5 text-amber-500/70" />
                                                    <p className="text-[10px] text-amber-500/80 font-medium tracking-wide uppercase" data-testid="alert-attendee-ticket">{attendeeInfo.ticket_type}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                <div className="text-sm text-white/70 mb-3 pl-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-3.5 h-3.5 text-white/30" />
                                        <span className="text-xs">User: {attendeeId?.slice(0, 6) || 'Guest'}</span>
                                    </div>
                                </div>
                                )}

                                <div className="text-sm text-white/70 mb-3 pl-6">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-white/30" />
                                        <span className="text-xs">{alert.gps_lat != null ? `${alert.gps_lat.toFixed(5)}, ${alert.gps_lng.toFixed(5)}` : '📍 Location Unknown'}</span>
                                    </div>
                                </div>

                                {alert.status !== 'resolved' && (
                                    <div className="flex gap-2 pl-6">
                                        {alert.gps_lat != null && (
                                            <a
                                                href={`https://www.google.com/maps?q=${alert.gps_lat},${alert.gps_lng}`}
                                                target="_blank" rel="noreferrer"
                                                className="px-3 py-1.5 text-xs font-medium bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-[#3A3A3A] hover:border-[#4A4A4A] rounded-lg text-white/70 hover:text-white transition-colors"
                                            >
                                                Locate
                                            </a>
                                        )}
                                        <button
                                            onClick={() => updateAlertStatus(alert.id, 'resolved')}
                                            className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white transition-colors"
                                        >
                                            Mark Resolved
                                        </button>
                                    </div>
                                )}
                            </div>
                            );
                        })}

                        {activeTab === 'live' && activeAlerts.length === 0 && (
                            <div className="text-center py-12 opacity-40">
                                <div className="mx-auto w-12 h-12 rounded-full bg-[#1C1C1F] border border-[#2A2A2A] flex items-center justify-center mb-3">
                                    <Shield className="w-5 h-5 text-white/50" />
                                </div>
                                <p className="text-sm font-medium text-white/70">All Systems Normal</p>
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
                            {activeAlerts.filter(a => a.gps_lat != null && a.gps_lng != null).map(alert => {
                                const attendeeId = alert.attendee_id || alert.user_id;
                                const info = attendeeId ? attendeeInfoCache.get(attendeeId) : undefined;
                                // Icon dimensions: [width, height] and anchor point [x, y]
                                const ICON_WITH_LABEL: [number, number] = [120, 80];
                                const ANCHOR_WITH_LABEL: [number, number] = [60, 80];
                                const ICON_DEFAULT: [number, number] = [48, 48];
                                const ANCHOR_DEFAULT: [number, number] = [24, 48];
                                const nameLabel = info
                                    ? `<div style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);border-radius:6px;padding:4px 8px;margin-bottom:4px;white-space:nowrap;text-align:center;">
                                          <div style="color:#fbbf24;font-size:11px;font-weight:700;line-height:1.3;">${escapeHtml(info.full_name)}</div>
                                          <div style="color:#f59e0b;font-size:9px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(info.ticket_type)}</div>
                                       </div>`
                                    : '';
                                return (
                                <Marker
                                    key={alert.id}
                                    position={[alert.gps_lat, alert.gps_lng]}
                                    icon={new L.DivIcon({
                                        className: 'bg-transparent',
                                        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
                                            ${nameLabel}
                                            <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
                                                <div style="position:absolute;inset:0;background:#ef4444;border-radius:50%;animation:ping 1s cubic-bezier(0,0,0.2,1) infinite;opacity:0.75;"></div>
                                                <div style="position:relative;width:16px;height:16px;background:#dc2626;border:2px solid white;border-radius:50%;box-shadow:0 4px 6px rgba(0,0,0,0.3);"></div>
                                            </div>
                                        </div>`,
                                        iconSize: info ? ICON_WITH_LABEL : ICON_DEFAULT,
                                        iconAnchor: info ? ANCHOR_WITH_LABEL : ANCHOR_DEFAULT,
                                    })}
                                />
                                );
                            })}

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
                    <div className="absolute top-4 right-4 z-[400] bg-[#111113]/90 backdrop-blur-md border border-[#2A2A2A] rounded-xl p-4 shadow-sm">
                        <div className="text-[10px] font-bold text-white/50 mb-3 uppercase tracking-wider">Crowd Density</div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-logic-blue/80 border border-logic-blue"></div>
                            <span className="text-xs text-white/70 font-medium tracking-wide">Normal Activity</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-red border border-brand-red/50 relative">
                                <div className="absolute inset-0 bg-brand-red rounded-full animate-ping opacity-50"></div>
                            </div>
                            <span className="text-xs text-red-400 font-bold tracking-wide">Critical Alert</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
