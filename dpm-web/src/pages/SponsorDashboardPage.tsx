import { Users, CheckCircle, Download } from 'lucide-react';
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

export const SponsorDashboardPage = () => {
  const stats = [
    {
      title: 'Qualified Leads',
      value: '42',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Verified Engagements',
      value: '135',
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ];

  const capturedLeads = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah.j@email.com', notes: 'Interested in product demo', timestamp: '2024-11-03 10:30' },
    { id: 2, name: 'Michael Chen', email: 'mchen@company.com', notes: 'Requested pricing information', timestamp: '2024-11-03 11:15' },
    { id: 3, name: 'Emily Rodriguez', email: 'emily.r@business.com', notes: 'Wants to schedule a meeting', timestamp: '2024-11-03 12:00' },
    { id: 4, name: 'David Kim', email: 'david.kim@enterprise.com', notes: 'Asked about enterprise plans', timestamp: '2024-11-03 13:45' },
    { id: 5, name: 'Jessica Taylor', email: 'jtaylor@startup.io', notes: 'Interested in partnership', timestamp: '2024-11-03 14:20' },
    { id: 6, name: 'Ryan Martinez', email: 'ryan.m@tech.com', notes: 'Downloaded whitepaper', timestamp: '2024-11-03 15:00' }
  ];

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Notes', 'Timestamp'],
      ...capturedLeads.map(lead => [lead.name, lead.email, lead.notes, lead.timestamp])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-export.csv';
    a.click();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Sponsor Dashboard</h1>
        <p className="text-slate-600">Track your leads and engagement metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{stat.title}</CardTitle>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-5xl">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Captured Lead Details</CardTitle>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Leads (CSV)
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capturedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.notes}</TableCell>
                  <TableCell>{lead.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
