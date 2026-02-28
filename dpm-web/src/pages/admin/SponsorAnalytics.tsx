import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, Users, Clock, Award, TrendingUp, Calendar, Download } from 'lucide-react';

// --- Mock Data ---
const HOURLY_TRAFFIC = [
    { time: '10:00', visitors: 45 },
    { time: '11:00', visitors: 120 },
    { time: '12:00', visitors: 340 },
    { time: '13:00', visitors: 280 },
    { time: '14:00', visitors: 450 },
    { time: '15:00', visitors: 380 },
    { time: '16:00', visitors: 220 },
];

const SPONSOR_PERFORMANCE = [
    { name: 'Red Bull', visits: 1240, dwell: 15.5, conversion: 24, color: '#fca5a5' }, // Red-ish
    { name: 'Samsung', visits: 890, dwell: 8.2, conversion: 18, color: '#93c5fd' }, // Blue-ish
    { name: 'Spotify', visits: 650, dwell: 5.5, conversion: 12, color: '#86efac' }, // Green-ish
    { name: 'Uber', visits: 420, dwell: 3.1, conversion: 8, color: '#d1d5db' }, // Gray
];

const DWELL_TIME_DISTRIBUTION = [
    { name: '< 1 min', value: 30, color: '#9ca3af' },
    { name: '1-5 mins', value: 45, color: '#60a5fa' },
    { name: '5-15 mins', value: 20, color: '#3b82f6' },
    { name: '15+ mins', value: 5, color: '#1d4ed8' },
];

export default function SponsorAnalytics() {
    const [selectedSponsor, setSelectedSponsor] = useState(SPONSOR_PERFORMANCE[0]);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans overflow-y-auto">

            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <DollarSign className="w-6 h-6 text-green-400" />
                            <h1 className="text-2xl font-bold tracking-tight">SPONSOR ROI DASHBOARD</h1>
                        </div>
                        <p className="text-gray-400 text-sm">Real-time attendee engagement metrics</p>
                    </div>

                    <div className="flex bg-gray-700 rounded-lg p-1">
                        {SPONSOR_PERFORMANCE.map(sponsor => (
                            <button
                                key={sponsor.name}
                                onClick={() => setSelectedSponsor(sponsor)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedSponsor.name === sponsor.name
                                        ? 'bg-gray-600 text-white shadow'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {sponsor.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-6">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-medium">Total Booth Visits</span>
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">{selectedSponsor.visits.toLocaleString()}</div>
                        <div className="text-sm text-green-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12% vs last hour</span>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                            <Clock className="w-5 h-5 text-brand-yellow" />
                            <span className="text-sm font-medium">Avg. Dwell Time</span>
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">{selectedSponsor.dwell}m</div>
                        <div className="text-sm text-gray-500">Industry avg: 4.5m</div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                            <Award className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium">Conversion Rate</span>
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">{selectedSponsor.conversion}%</div>
                        <div className="text-sm text-gray-500">Scanned QR codes</div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-center items-center text-center cursor-pointer hover:bg-gray-750 transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-3 group-hover:bg-gray-600 transition-colors">
                            <Download className="w-6 h-6 text-gray-300" />
                        </div>
                        <h3 className="font-medium text-white">Export Report</h3>
                        <p className="text-xs text-gray-400">PDF / CSV Format</p>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                    {/* Traffic Chart (2/3 width) */}
                    <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            Hourly Foot Traffic
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={HOURLY_TRAFFIC}>
                                    <defs>
                                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="time"
                                        stroke="#6b7280"
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ stroke: '#4b5563', strokeWidth: 1 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="visitors"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorVisits)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Dwell Time Pie Chart (1/3 width) */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-2">Engagement Depth</h3>
                        <div className="flex-1 w-full min-h-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={DWELL_TIME_DISTRIBUTION}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {DWELL_TIME_DISTRIBUTION.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">{selectedSponsor.dwell}m</div>
                                    <div className="text-xs text-gray-500">Avg Time</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {DWELL_TIME_DISTRIBUTION.map((item) => (
                                <div key={item.name} className="flex items-center gap-2 text-xs text-gray-400">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span>{item.name} ({item.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Heatmap Placeholder */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden relative group">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-red-400" />
                            Zone Heatmap Analysis
                        </h3>
                        <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded">SIMULATION MODE</span>
                    </div>

                    <div className="h-64 relative bg-gray-900 flex items-center justify-center overflow-hidden">
                        {/* Fake Heatmap Overlay */}
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_40%,rgba(239,68,68,0.6),transparent_25%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.5),transparent_30%),radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.3),transparent_40%)] blur-xl"></div>

                        {/* Grid Lines */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                        <p className="relative z-10 text-gray-400 text-sm font-medium bg-gray-900/80 px-4 py-2 rounded-lg backdrop-blur border border-gray-700">
                            Heatmap data is aggregated from {selectedSponsor.visits} distinct device signals.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
}
