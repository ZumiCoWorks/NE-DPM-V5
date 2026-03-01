import { Users, CheckCircle, Download } from 'lucide-react';

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white/90 mb-1">Sponsor Dashboard</h1>
        <p className="text-sm text-white/50">Track your leads and engagement metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-[#111113] border border-[#2A2A2A] rounded-xl p-6 shadow-sm">
              <div className="flex flex-row items-center justify-between pb-4">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">{stat.title}</h3>
                <div className={`w-10 h-10 ${stat.color.replace('bg-', 'bg-').replace('500', '500/10')} border ${stat.color.replace('bg-', 'border-').replace('500', '500/20')} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-').replace('500', '400')}`} />
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white/90">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#111113] border border-[#2A2A2A] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white/90">Captured Lead Details</h2>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-[#3A3A3A] text-sm font-medium rounded-lg text-white/80 bg-[#1C1C1F] hover:bg-[#2A2A2A] hover:text-white transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Leads (CSV)
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2A2A2A]">
            <thead className="bg-[#161618]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Notes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="bg-[#111113] divide-y divide-[#2A2A2A]">
              {capturedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#161618] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/90">{lead.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">{lead.email}</td>
                  <td className="px-6 py-4 text-sm text-white/60 max-w-xs truncate">{lead.notes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/40">{lead.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
