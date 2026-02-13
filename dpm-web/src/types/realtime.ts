// Database types for real-time tracking and safety features
// Auto-generated from migration 007_add_realtime_tracking.sql

export interface AttendeeLocation {
    id: string
    event_id: string
    attendee_id?: string | null
    session_id: string
    x_coord: number
    y_coord: number
    floor_level: number
    source: 'gps' | 'qr' | 'manual'
    accuracy_meters?: number | null
    timestamp: string
    created_at: string
}

export interface EmergencyAlert {
    id: string
    event_id: string
    attendee_id?: string | null
    session_id?: string | null
    alert_type: 'medical' | 'security' | 'lost' | 'other'
    severity: 'low' | 'medium' | 'high' | 'critical'
    location_x?: number | null
    location_y?: number | null
    floor_level: number
    message?: string | null
    status: 'active' | 'acknowledged' | 'responding' | 'resolved'
    acknowledged_by?: string | null
    acknowledged_at?: string | null
    resolved_by?: string | null
    resolved_at?: string | null
    resolution_notes?: string | null
    created_at: string
    updated_at: string
}

export interface CapacityAlert {
    id: string
    event_id: string
    zone_id?: string | null
    zone_name: string
    alert_level: 'green' | 'amber' | 'red'
    current_count: number
    capacity_limit: number
    capacity_percentage: number
    threshold_exceeded: string // '50%', '80%', '100%'
    status: 'active' | 'acknowledged' | 'resolved'
    acknowledged_by?: string | null
    acknowledged_at?: string | null
    resolved_at?: string | null
    created_at: string
}

export interface LocationHistory {
    id: string
    event_id: string
    session_id: string
    zone_id?: string | null
    zone_name?: string | null
    entry_time: string
    exit_time?: string | null
    dwell_time_seconds?: number | null
    avg_x?: number | null
    avg_y?: number | null
    source?: string | null
    created_at: string
}

// Insert types
export interface CreateAttendeeLocation {
    event_id: string
    attendee_id?: string
    session_id: string
    x_coord: number
    y_coord: number
    floor_level?: number
    source: 'gps' | 'qr' | 'manual'
    accuracy_meters?: number
}

export interface CreateEmergencyAlert {
    event_id: string
    attendee_id?: string
    session_id?: string
    alert_type: 'medical' | 'security' | 'lost' | 'other'
    severity?: 'low' | 'medium' | 'high' | 'critical'
    location_x?: number
    location_y?: number
    floor_level?: number
    message?: string
}

export interface CreateCapacityAlert {
    event_id: string
    zone_id?: string
    zone_name: string
    alert_level: 'green' | 'amber' | 'red'
    current_count: number
    capacity_limit: number
    capacity_percentage: number
    threshold_exceeded: string
}
