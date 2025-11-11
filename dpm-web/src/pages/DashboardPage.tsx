import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-slate-600">No metrics yet. Head to Events to manage your data.</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Events</CardTitle>
            <CardDescription>Manage events and open the map editor.</CardDescription>
          </div>
          <Button onClick={() => navigate('/events')}>
            <Plus className="w-4 h-4 mr-2" />
            Go to Events
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
};
