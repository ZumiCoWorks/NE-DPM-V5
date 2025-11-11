import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SponsorDashboardPage = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Sponsor Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Metrics unavailable</CardTitle>
          <CardDescription>
            Sponsor metrics will appear here once data collection is connected.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default SponsorDashboardPage;
