import { useState, useEffect } from 'react';
import { Activity, Users, TrendingUp, Zap, MapPin, DollarSign, Award, AlertCircle } from 'lucide-react';
import { mockCDVAnalytics, mockEvents, mockVenues } from '../services/mockData';

export default function DemoWalkthrough() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animateMetrics, setAnimateMetrics] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setAnimateMetrics(prev => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const activeEvent = mockEvents[0];
  const activeVenue = mockVenues[0];
  const cdvData = mockCDVAnalytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
              🇿🇦 NavEaze DPM - Live Demo
            </h1>
            <p className="text-slate-400 mt-2">Real-time Event Intelligence Platform</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono">{currentTime.toLocaleTimeString('en-ZA')}</div>
            <div className="text-sm text-green-400">● LIVE</div>
          </div>
        </div>

        {/* Event Info Bar */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400">Current Event</div>
              <div className="font-semibold">{activeEvent.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Venue</div>
              <div className="font-semibold">{activeVenue.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Expected Attendees</div>
              <div className="font-semibold">{activeEvent.expected_attendees?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Load Shedding</div>
              <div className="font-semibold text-green-400">{cdvData.realtime_metrics.load_shedding_status}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<Users className="w-8 h-8" />}
          label="Active Attendees"
          value={cdvData.realtime_metrics.active_attendees.toLocaleString()}
          trend="+12%"
          color="blue"
          animate={animateMetrics}
        />
        <MetricCard
          icon={<MapPin className="w-8 h-8" />}
          label="High-Value Zones"
          value={cdvData.realtime_metrics.high_value_zones}
          trend="+2"
          color="purple"
          animate={animateMetrics}
        />
        <MetricCard
          icon={<DollarSign className="w-8 h-8" />}
          label="Revenue Rate (R/hr)"
          value={`R ${cdvData.realtime_metrics.current_revenue_rate.toLocaleString()}`}
          trend="+8%"
          color="green"
          animate={animateMetrics}
        />
        <MetricCard
          icon={<Activity className="w-8 h-8" />}
          label="Engagement Score"
          value={(cdvData.realtime_metrics.avg_engagement_score * 100).toFixed(0) + '%'}
          trend="+5%"
          color="orange"
          animate={animateMetrics}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* HVZ Performance */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            High-Value Zones Performance
          </h2>
          <div className="space-y-3">
            {cdvData.hvz_performance.map((zone, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-600 hover:border-green-500 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-lg">{zone.sponsor}</div>
                    <div className="text-xs text-slate-400">{zone.attendees_in_zone} attendees in zone</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    zone.engagement_quality === 'high' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {zone.engagement_quality.toUpperCase()}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Dwell Time</div>
                    <div className="font-mono">{zone.avg_dwell_time}m</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Rate</div>
                    <div className="font-mono">R{zone.hourly_rate}/hr</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Revenue</div>
                    <div className="font-mono text-green-400">R{zone.current_revenue.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sponsor Leaderboard */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            Sponsor Revenue Leaderboard
          </h2>
          <div className="space-y-3">
            {cdvData.sponsor_leaderboard.map((sponsor, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{sponsor.emoji}</div>
                    <div>
                      <div className="font-semibold">{sponsor.sponsor}</div>
                      <div className="text-xs text-green-400">{sponsor.growth} vs yesterday</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">R{(sponsor.revenue / 1000).toFixed(1)}K</div>
                    <div className="text-xs text-slate-400">Total Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center">
              <div className="text-slate-400">Total Event Revenue</div>
              <div className="text-2xl font-bold text-green-400">R551K</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Revenue Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-400" />
          24-Hour Revenue Trend
        </h2>
        <div className="h-48 flex items-end gap-1">
          {cdvData.time_series.slice(8, 20).map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-500 hover:from-green-400 hover:to-green-200"
                style={{ height: `${(data.revenue / 12000) * 100}%` }}
                title={`R${data.revenue}`}
              />
              <div className="text-xs text-slate-400 rotate-45 origin-top-left mt-2">{data.hour}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Features Showcase */}
      <div className="grid grid-cols-3 gap-4">
        <FeatureCard
          icon="🎯"
          title="Geofencing & HVZ Detection"
          description="Real-time detection of attendees in high-value sponsor zones with automated revenue tracking"
          status="Active"
        />
        <FeatureCard
          icon="📊"
          title="CDV Intelligence"
          description="Contextual Dwell Value analytics providing actionable insights for sponsors and organizers"
          status="Live"
        />
        <FeatureCard
          icon="⚡"
          title="Load Shedding Resilient"
          description="Built for South African market with backup systems and real-time status monitoring"
          status="Operational"
        />
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, color, animate }: any) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-6 transition-all duration-300 ${animate ? 'scale-105' : 'scale-100'}`}>
      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colors[color]} mb-3`}>
        {icon}
      </div>
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-green-400">{trend} from yesterday</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, status }: any) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition-colors">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-3">{description}</p>
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        {status}
      </div>
    </div>
  );
}
