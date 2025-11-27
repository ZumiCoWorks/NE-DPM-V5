import { supabase } from './supabase';

const QUEUE_KEY = 'analytics_queue';

export interface AnalyticsEvent {
    event_id: string;
    event_type: string;
    payload: any;
    timestamp: string;
}

export const logEvent = (eventId: string, eventType: string, payload: any = {}) => {
    try {
        const event: AnalyticsEvent = {
            event_id: eventId,
            event_type: eventType,
            payload,
            timestamp: new Date().toISOString(),
        };

        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        queue.push(event);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        console.log(`📊 Queued event: ${eventType}`, event);
    } catch (err) {
        console.error('Failed to log analytics event:', err);
    }
};

export const flushEvents = async () => {
    if (!navigator.onLine) {
        console.log('📴 Offline: Skipping analytics flush');
        return;
    }

    const queueStr = localStorage.getItem(QUEUE_KEY);
    if (!queueStr) return;

    const queue: AnalyticsEvent[] = JSON.parse(queueStr);
    if (queue.length === 0) return;

    console.log(`📡 Flushing ${queue.length} analytics events...`);

    try {
        // Assuming 'analytics_pings' table exists
        // If not, we might want to just log to console or try/catch silently
        // For the pilot, we'll assume it exists or fail gracefully

        // We need to map the local event structure to the DB schema if different
        // Schema Assumption: event_id, event_type, payload, created_at
        // We might need to add user_id if available, but for now we'll keep it simple

        if (!supabase) {
            console.warn('Supabase client not initialized');
            return;
        }

        const { error } = await supabase
            .from('analytics_pings')
            .insert(queue.map(e => ({
                event_id: e.event_id,
                event_type: e.event_type,
                payload: e.payload,
                created_at: e.timestamp
            })));

        if (error) {
            console.warn('⚠️ Failed to flush analytics to Supabase:', error);
            // If it's a schema error, maybe we should clear the queue to avoid infinite loops?
            // For now, keep in queue to retry later unless it's a 400-ish error
            return;
        }

        console.log('✅ Analytics flushed successfully');
        localStorage.removeItem(QUEUE_KEY);
    } catch (err) {
        console.error('Error flushing analytics:', err);
    }
};
