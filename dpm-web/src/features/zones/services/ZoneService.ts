import { supabase } from '../../../lib/supabase';
import type { Zone, CreateZoneData, ZoneType, ZoneStyle } from '../types/Zone';
import { ZONE_CONFIGS } from '../types/Zone';

export class ZoneService {
    /**
     * Get default style for zone type
     */
    getZoneStyle(zoneType: ZoneType): ZoneStyle {
        const config = ZONE_CONFIGS[zoneType];
        return {
            color: config.color,
            fillOpacity: 0.2,
        };
    }

    /**
     * Create a new zone
     */
    async createZone(data: CreateZoneData): Promise<Zone> {
        const style = data.style || this.getZoneStyle(data.zone_type);
        if (!supabase) throw new Error('Supabase client not initialized');

        const { data: zone, error } = await supabase
            .from('zones')
            .insert({
                ...data,
                style,
            })
            .select()
            .single();

        if (error) throw error;
        return zone as unknown as Zone;
    }

    /**
     * Get all zones for an event
     */
    async getEventZones(eventId: string): Promise<Zone[]> {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('zones')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as Zone[];
    }

    /**
     * Get zones for a specific floorplan
     */
    async getFloorplanZones(floorplanId: string): Promise<Zone[]> {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('zones')
            .select('*')
            .eq('floorplan_id', floorplanId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as Zone[];
    }

    /**
     * Update zone
     */
    async updateZone(zoneId: string, updates: Partial<Zone>): Promise<Zone> {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('zones')
            .update(updates)
            .eq('id', zoneId)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Zone;
    }

    /**
     * Delete zone
     */
    async deleteZone(zoneId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('zones')
            .delete()
            .eq('id', zoneId);

        if (error) throw error;
    }

    /**
     * Link zone to sponsor
     */
    async linkZoneToSponsor(zoneId: string, sponsorId: string | null): Promise<Zone> {
        return this.updateZone(zoneId, { sponsor_id: sponsorId === null ? undefined : sponsorId });
    }
}

export const zoneService = new ZoneService();
