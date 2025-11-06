import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateEvent = async () => {
    if (!user) {
      toast.error('You must be logged in to create an event.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({ name: 'New Event', user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        navigate(`/events/${data.id}/editor`);
      }
    } catch (error: any) {
      toast.error('Failed to create event.', { description: error.message });
    }
  };

  const events = [
    {
      id: 1,
      name: 'Tech Conference 2024',
      date: '2024-11-15',
      venue: 'Convention Center',
      attendees: 500,
      status: 'upcoming',
      description: 'Annual technology conference featuring industry leaders'
    },
    {
      id: 2,
      name: 'Music Festival',
      date: '2024-11-20',
      venue: 'City Park',
      attendees: 2000,
      status: 'upcoming',
      description: 'Three-day outdoor music festival'
    },
    {
      id: 3,
      name: 'Food & Wine Expo',
      date: '2024-11-25',
      venue: 'Downtown Hall',
      attendees: 800,
      status: 'upcoming',
      description: 'Culinary experience with top chefs'
    },
    {
      id: 4,
      name: 'Business Summit',
      date: '2024-12-01',
      venue: 'Grand Hotel',
      attendees: 300,
      status: 'planning',
      description: 'Executive leadership summit'
    }
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Events</h1>
          <p className="text-slate-600">Manage and organize your events.</p>
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <Card 
            key={event.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{event.name}</CardTitle>
                <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                  {event.status}
                </Badge>
              </div>
              <CardDescription>{event.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {event.date}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.venue}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Users className="w-4 h-4 mr-2" />
                  {event.attendees} attendees
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/${event.id}`);
                }}
              >
                Manage Event
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};