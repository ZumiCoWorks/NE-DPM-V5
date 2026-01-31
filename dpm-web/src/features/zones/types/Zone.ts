// Zone type definitions
export type ZoneType =
    | 'general'
    | 'restricted'
    | 'food_court'
    | 'stage'
    | 'entrance'
    | 'parking'
    | 'vip';

export interface ZoneStyle {
    color: string;
    fillOpacity: number;
    dashArray?: string;
}

export interface Zone {
    id: string;
    name: string;
    zone_type: ZoneType;
    geo_json: GeoJSON.Polygon;
    event_id: string;
    map_id?: string;
    floorplan_id?: string;
    sponsor_id?: string;
    style: ZoneStyle;
    created_at: string;
}

export interface CreateZoneData {
    name: string;
    zone_type: ZoneType;
    geo_json: GeoJSON.Polygon;
    event_id: string;
    floorplan_id?: string;
    sponsor_id?: string;
    style?: ZoneStyle;
}

// Zone type configurations
export const ZONE_CONFIGS: Record<ZoneType, { label: string; color: string; icon: string }> = {
    general: {
        label: 'General',
        color: '#3388ff',
        icon: '📍'
    },
    vip: {
        label: 'VIP',
        color: '#9333ea',
        icon: '👑'
    },
    food_court: {
        label: 'Food Court',
        color: '#f97316',
        icon: '🍔'
    },
    stage: {
        label: 'Stage',
        color: '#ef4444',
        icon: '🎭'
    },
    entrance: {
        label: 'Entrance',
        color: '#22c55e',
        icon: '🚪'
    },
    parking: {
        label: 'Parking',
        color: '#6b7280',
        icon: '🅿️'
    },
    restricted: {
        label: 'Restricted',
        color: '#eab308',
        icon: '⚠️'
    }
};
