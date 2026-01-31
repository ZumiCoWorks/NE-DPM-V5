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

        const { data: zone, error } = await supabase
            .from('zones')
            .insert({
                ...data,
                style,
            })
            .select()
            .single();

        if (error) throw error;
        return zone;
    }

    /**
     * Get all zones for an event
     */
    async getEventZones(eventId: string): Promise<Zone[]> {
        const { data, error } = await supabase
            .from('zones')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get zones for a specific floorplan
     */
    async getFloorplanZones(floorplanId: string): Promise<Zone[]> {
        const { data, error } = await supabase
            .from('zones')
            .select('*')
            .eq('floorplan_id', floorplanId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Update zone
     */
    async updateZone(zoneId: string, updates: Partial<Zone>): Promise<Zone> {
        const { data, error } = await supabase
            .from('zones')
            .update(updates)
            .eq('id', zoneId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete zone
     */
    async deleteZone(zoneId: string): Promise<void> {
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
        return this.updateZone(zoneId, { sponsor_id: sponsorId });
    }
}

export const zoneService = new ZoneService();
