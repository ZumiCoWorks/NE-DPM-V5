import { Plus, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateEvent = async () => {
    if (!user) {
      toast.error('You must be logged in to create an event.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: 'New Event',
          user_id: user.id,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        navigate(`/map-editor/${data.id}`);
      }
    } catch (error: any) {
      console.error('Create Event failed:', error);
      toast.error('Failed to create event.', { description: error.message });
    }
  };

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) {
        setEvents([]);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    loadEvents();
  }, [user]);

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

      {!user && (
        <Card>
          <CardHeader>
            <CardTitle>Sign in to view your events</CardTitle>
            <CardDescription>Events are loaded from your account.</CardDescription>
          </CardHeader>
        </Card>
      )}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading && (
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
            </Card>
          )}
          {!loading && error && (
            <Card>
              <CardHeader>
                <CardTitle>Error loading events</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          )}
          {!loading && !error && events.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No events found</CardTitle>
                <CardDescription>Create an event to get started.</CardDescription>
              </CardHeader>
            </Card>
          )}
          {!loading && !error && events.map((event) => (
            <Card 
              key={event.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  Created {event.created_at ? new Date(event.created_at).toLocaleDateString() : '—'}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
      )}
    </div>
  );
};