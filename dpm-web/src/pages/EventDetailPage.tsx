import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '@/lib/supabase';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setEvent(data);
      }
      setLoading(false);
    };
    loadEvent();
  }, [id]);

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/events')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
        {!loading && !error && event && (
          <>
            <h1 className="text-3xl mb-2">{event.name}</h1>
            <p className="text-slate-600">
              Created {event.created_at ? new Date(event.created_at).toLocaleDateString() : '—'}
            </p>
          </>
        )}
        {loading && <p className="text-slate-600">Loading event...</p>}
        {!loading && error && <p className="text-slate-600">Error: {error}</p>}
        {!loading && !error && !event && <p className="text-slate-600">Event not found.</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Map</CardTitle>
          <CardDescription>
            Create and edit the interactive map for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-slate-600">
              Use the map editor to create an interactive map with points of interest, paths, and sponsor booths.
            </p>
            <Button onClick={() => navigate(`/map-editor/${id}`)} size="lg" disabled={!event}>
              <Map className="w-4 h-4 mr-2" />
              Edit Map
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};