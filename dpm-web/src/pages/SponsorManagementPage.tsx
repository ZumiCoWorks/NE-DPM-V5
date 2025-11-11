import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const SponsorManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Placeholder content removed; awaiting data-backed implementation.

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(`/events/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event
        </Button>
        <h1 className="text-3xl mb-2">Sponsor Management</h1>
        <p className="text-slate-600">Link sponsors to booth locations and manage access</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Sponsor linking and staff access management will be implemented here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
