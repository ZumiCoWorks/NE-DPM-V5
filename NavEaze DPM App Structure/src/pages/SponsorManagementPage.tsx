import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, UserPlus, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';

export const SponsorManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const sponsors = [
    { id: 1, name: 'Sponsor A', type: 'Gold' },
    { id: 2, name: 'Sponsor B', type: 'Silver' },
    { id: 3, name: 'Sponsor C', type: 'Bronze' },
  ];

  const pois = [
    { id: 1, name: 'BCom Project 1', type: 'Booth' },
    { id: 2, name: 'BCom Project 2', type: 'Booth' },
    { id: 3, name: 'Engineering Showcase', type: 'Booth' },
    { id: 4, name: 'Main Stage', type: 'Stage' },
  ];

  const linkedSponsors = [
    { id: 1, sponsor: 'Sponsor A', poi: 'BCom Project 1', qrGenerated: true },
    { id: 2, sponsor: 'Sponsor B', poi: 'BCom Project 2', qrGenerated: true },
    { id: 3, sponsor: 'Sponsor C', poi: 'Engineering Showcase', qrGenerated: false },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LinkIcon className="w-5 h-5 mr-2" />
              Link Sponsor to POI
            </CardTitle>
            <CardDescription>
              Associate a sponsor with a specific booth or location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sponsor-select">Select Sponsor</Label>
                <Select>
                  <SelectTrigger id="sponsor-select">
                    <SelectValue placeholder="Choose a sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sponsors.map((sponsor) => (
                      <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                        {sponsor.name} ({sponsor.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poi-select">Select POI/Booth</Label>
                <Select>
                  <SelectTrigger id="poi-select">
                    <SelectValue placeholder="Choose a booth location" />
                  </SelectTrigger>
                  <SelectContent>
                    {pois.map((poi) => (
                      <SelectItem key={poi.id} value={poi.id.toString()}>
                        {poi.name} ({poi.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Link Sponsor to Booth
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Create Staff Logins
            </CardTitle>
            <CardDescription>
              Generate login credentials for sponsor staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-sponsor">Sponsor</Label>
                <Select>
                  <SelectTrigger id="staff-sponsor">
                    <SelectValue placeholder="Choose sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sponsors.map((sponsor) => (
                      <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                        {sponsor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">Staff Member Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="staff@sponsor.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-name">Staff Member Name</Label>
                <Input
                  id="staff-name"
                  type="text"
                  placeholder="John Doe"
                />
              </div>

              <Button type="submit" className="w-full">
                Create Staff Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Linked Sponsors & Booths</CardTitle>
            <CardDescription>Current sponsor booth assignments</CardDescription>
          </div>
          <Button>
            <QrCode className="w-4 h-4 mr-2" />
            Generate All QR Codes
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sponsor</TableHead>
                <TableHead>Booth/POI</TableHead>
                <TableHead>QR Code Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedSponsors.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>{link.sponsor}</TableCell>
                  <TableCell>{link.poi}</TableCell>
                  <TableCell>
                    {link.qrGenerated ? (
                      <Badge variant="default">Generated</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <QrCode className="w-3 h-3 mr-1" />
                        QR Code
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
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
