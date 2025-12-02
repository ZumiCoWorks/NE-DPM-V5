import { set, get, del, clear } from 'idb-keyval';

/**
 * Offline Storage Layer using IndexedDB
 * Caches event data, POIs, graph nodes/segments for offline access
 */

export interface CachedEventData {
    id: string;
    name: string;
    description?: string;
    navigation_mode: 'indoor' | 'outdoor' | 'hybrid';
    gps_center_lat?: number;
    gps_center_lng?: number;
    gps_bounds_ne_lat?: number;
    gps_bounds_ne_lng?: number;
    gps_bounds_sw_lat?: number;
    gps_bounds_sw_lng?: number;
    start_date?: string;
    end_date?: string;
    floorplan_url?: string;
    pixels_per_meter?: number;
    cachedAt: number;
}

export interface CachedPOIData {
    eventId: string;
    pois: any[];
    cachedAt: number;
}

export interface CachedGraphData {
    eventId: string;
    nodes: any[];
    segments: any[];
    cachedAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cache event metadata for offline access
 */
export async function cacheEventData(eventId: string, data: any): Promise<void> {
    const cacheKey = `event_${eventId}`;
    const cachedData: CachedEventData = {
        ...data,
        cachedAt: Date.now()
    };
    await set(cacheKey, cachedData);
    console.log('📦 Cached event data:', eventId);
}

/**
 * Get cached event data
 */
export async function getCachedEventData(eventId: string): Promise<CachedEventData | null> {
    const cacheKey = `event_${eventId}`;
    const data = await get<CachedEventData>(cacheKey);

    if (!data) return null;

    // Check if cache is stale
    if (Date.now() - data.cachedAt > CACHE_DURATION) {
        console.log('⏰ Cache expired for event:', eventId);
        await del(cacheKey);
        return null;
    }

    console.log('✅ Retrieved cached event data:', eventId);
    return data;
}

/**
 * Cache POI list for an event
 */
export async function cachePOIs(eventId: string, pois: any[]): Promise<void> {
    const cacheKey = `pois_${eventId}`;
    const cachedData: CachedPOIData = {
        eventId,
        pois,
        cachedAt: Date.now()
    };
    await set(cacheKey, cachedData);
    console.log('📦 Cached POIs:', pois.length, 'items');
}

/**
 * Get cached POI list
 */
export async function getCachedPOIs(eventId: string): Promise<any[] | null> {
    const cacheKey = `pois_${eventId}`;
    const data = await get<CachedPOIData>(cacheKey);

    if (!data) return null;

    if (Date.now() - data.cachedAt > CACHE_DURATION) {
        await del(cacheKey);
        return null;
    }

    console.log('✅ Retrieved cached POIs:', data.pois.length, 'items');
    return data.pois;
}

/**
 * Cache graph nodes and segments
 */
export async function cacheGraphData(eventId: string, nodes: any[], segments: any[]): Promise<void> {
    const cacheKey = `graph_${eventId}`;
    const cachedData: CachedGraphData = {
        eventId,
        nodes,
        segments,
        cachedAt: Date.now()
    };
    await set(cacheKey, cachedData);
    console.log('📦 Cached graph data:', nodes.length, 'nodes,', segments.length, 'segments');
}

/**
 * Get cached graph data
 */
export async function getCachedGraphData(eventId: string): Promise<{ nodes: any[]; segments: any[] } | null> {
    const cacheKey = `graph_${eventId}`;
    const data = await get<CachedGraphData>(cacheKey);

    if (!data) return null;

    if (Date.now() - data.cachedAt > CACHE_DURATION) {
        await del(cacheKey);
        return null;
    }

    console.log('✅ Retrieved cached graph:', data.nodes.length, 'nodes,', data.segments.length, 'segments');
    return { nodes: data.nodes, segments: data.segments };
}

/**
 * Clear all cached data for an event
 */
export async function clearEventCache(eventId: string): Promise<void> {
    await del(`event_${eventId}`);
    await del(`pois_${eventId}`);
    await del(`graph_${eventId}`);
    console.log('🗑️ Cleared cache for event:', eventId);
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
    await clear();
    console.log('🗑️ Cleared all cached data');
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Get cache status for debugging
 */
export async function getCacheStatus(eventId: string): Promise<{
    hasEvent: boolean;
    hasPOIs: boolean;
    hasGraph: boolean;
}> {
    const event = await getCachedEventData(eventId);
    const pois = await getCachedPOIs(eventId);
    const graph = await getCachedGraphData(eventId);

    return {
        hasEvent: !!event,
        hasPOIs: !!pois,
        hasGraph: !!graph
    };
}
