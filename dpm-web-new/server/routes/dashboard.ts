import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

let supabase: any = null;
const getSupabase = () => {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
};

// Get dashboard stats
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    let stats = {};
    const client = getSupabase();

    switch (userRole) {
      case 'admin':
        // Admin gets full stats
        const [totalEvents, totalVenues, totalUsers, totalCampaigns] = await Promise.all([
          client.from('events').select('id', { count: 'exact', head: true }),
          client.from('venues').select('id', { count: 'exact', head: true }),
          client.from('profiles').select('id', { count: 'exact', head: true }),
          client.from('ar_campaigns').select('id', { count: 'exact', head: true }),
        ]);

        stats = {
          totalEvents: totalEvents.count || 0,
          totalVenues: totalVenues.count || 0,
          totalUsers: totalUsers.count || 0,
          totalCampaigns: totalCampaigns.count || 0,
        };
        break;

      case 'event_organizer':
        // Event organizer gets their own stats
        const [myEvents, myVenues, myCampaigns] = await Promise.all([
          client.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', userId),
          client.from('events').select('venue_id').eq('organizer_id', userId),
          client.from('ar_campaigns').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
        ]);

        // Get unique venue count
        const uniqueVenueIds = new Set(myVenues.data?.map((e: any) => e.venue_id).filter(Boolean));

        stats = {
          totalEvents: myEvents.count || 0,
          totalVenues: uniqueVenueIds.size,
          totalCampaigns: myCampaigns.count || 0,
        };
        break;

      case 'venue_manager':
        // Venue manager gets venue-related stats
        const [managedVenues, venueEvents] = await Promise.all([
          client.from('venues').select('id', { count: 'exact', head: true }),
          client.from('events').select('id', { count: 'exact', head: true }).not('venue_id', 'is', null),
        ]);

        stats = {
          totalVenues: managedVenues.count || 0,
          totalEvents: venueEvents.count || 0,
        };
        break;

      case 'staff':
        // Staff gets basic stats
        const [activeEvents, activeVenues] = await Promise.all([
          client.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          client.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ]);

        stats = {
          totalEvents: activeEvents.count || 0,
          totalVenues: activeVenues.count || 0,
        };
        break;

      case 'sponsor':
        // Sponsor gets campaign and lead stats
        const [activeCampaigns] = await Promise.all([
          client.from('ar_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ]);

        stats = {
          totalActiveCampaigns: activeCampaigns.count || 0,
        };
        break;

      default:
        stats = {
          message: 'Welcome to DPM',
        };
    }

    res.json({
      role: userRole,
      stats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

export default router;
