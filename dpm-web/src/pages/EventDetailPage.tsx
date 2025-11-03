import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Map, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl mb-2">{event.name}</h1>
        <p className="text-slate-600">{event.date} • {event.venue}</p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="w-4 h-4 mr-2" />
            Map
          </TabsTrigger>
          <TabsTrigger value="sponsors">
            <DollarSign className="w-4 h-4 mr-2" />
            Sponsors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
              <CardDescription>
                Configure Quicket integration for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quicket-event-id">Quicket Event ID</Label>
                  <Input
                    id="quicket-event-id"
                    type="text"
                    placeholder="Enter your Quicket Event ID"
                  />
                  <p className="text-sm text-slate-500">
                    This ID is used to sync attendee data from Quicket
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quicket-api-key">Quicket API Key</Label>
                  <Input
                    id="quicket-api-key"
                    type="password"
                    placeholder="Enter your Quicket API Key"
                  />
                  <p className="text-sm text-slate-500">
                    Your API key will be encrypted and stored securely
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit">Save Settings</Button>
                  <Button type="button" variant="outline">Test Connection</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
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
                <Button onClick={() => navigate(`/map-editor/${id}`)}>
                  <Map className="w-4 h-4 mr-2" />
                  Open Map Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sponsor Management</CardTitle>
              <CardDescription>
                Link sponsors to booths and manage sponsor data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Manage sponsor booth assignments, generate QR codes, and create staff logins.
                </p>
                <Button onClick={() => navigate(`/events/${id}/sponsors`)}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Manage Sponsors
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
