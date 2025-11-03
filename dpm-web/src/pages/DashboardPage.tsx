import { Calendar, MapPin, Building2, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Button } from '../components/ui/button';

export const DashboardPage = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Events',
      value: '24',
      icon: Calendar,
      change: '+12% from last month',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Sponsors',
      value: '156',
      icon: Building2,
      change: '+8% from last month',
      color: 'bg-green-500'
    },
    {
      title: 'Active Maps',
      value: '18',
      icon: MapPin,
      change: '+4 new this week',
      color: 'bg-purple-500'
    },
    {
      title: 'Total Engagements',
      value: '3,248',
      icon: TrendingUp,
      change: '+23% from last month',
      color: 'bg-orange-500'
    }
  ];

  const upcomingEvents = [
    { id: 1, name: 'Tech Conference 2024', date: '2024-11-15', venue: 'Convention Center', attendees: 500 },
    { id: 2, name: 'Music Festival', date: '2024-11-20', venue: 'City Park', attendees: 2000 },
    { id: 3, name: 'Food & Wine Expo', date: '2024-11-25', venue: 'Downtown Hall', attendees: 800 },
    { id: 4, name: 'Business Summit', date: '2024-12-01', venue: 'Grand Hotel', attendees: 300 },
    { id: 5, name: 'Art Gallery Opening', date: '2024-12-05', venue: 'Modern Art Museum', attendees: 150 }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl mb-1">{stat.value}</div>
                <p className="text-xs text-slate-600">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events</CardTitle>
          <Button onClick={() => navigate('/events/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Event
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingEvents.map((event) => (
                <TableRow 
                  key={event.id} 
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>{event.attendees}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
