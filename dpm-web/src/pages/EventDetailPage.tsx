import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock event data
  const event = {
    id: id,
    name: 'Tech Conference 2024',
    date: '2024-11-15',
    venue: 'Convention Center'
  };

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/events')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
        <h1 className="text-3xl mb-2">{event.name}</h1>
        <p className="text-slate-600">{event.date} • {event.venue}</p>
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
            <Button onClick={() => navigate(`/events/${id}/editor`)} size="lg">
              <Map className="w-4 h-4 mr-2" />
              Edit Map
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};