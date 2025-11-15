import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface DashboardStats {
  role: string;
  stats: Record<string, number>;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        Failed to load dashboard data
      </div>
    );
  }

  const renderStatCard = (title: string, value: number, icon: string) => (
    <Card key={title} className="bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </Card>
  );

  const renderQuickActions = () => {
    const actions = [];

    if (stats.role === 'admin') {
      actions.push(
        { title: 'Create Event', href: '/events/create', icon: '📅' },
        { title: 'Map Editor', href: '/admin/map-editor', icon: '🗺️' },
        { title: 'Settings', href: '/settings', icon: '⚙️' },
        { title: 'AR Campaigns', href: '/campaigns', icon: '🎯' }
      );
    } else if (stats.role === 'event_organizer') {
      actions.push(
        { title: 'Create Event', href: '/events/create', icon: '📅' },
        { title: 'My Events', href: '/events', icon: '📋' },
        { title: 'Settings', href: '/settings', icon: '⚙️' }
      );
    } else if (stats.role === 'staff') {
      actions.push(
        { title: 'Profile', href: '/profile', icon: '👤' },
        { title: 'Settings', href: '/settings', icon: '⚙️' }
      );
    } else if (stats.role === 'sponsor') {
      actions.push(
        { title: 'View Campaigns', href: '/campaigns', icon: '🎯' },
        { title: 'Export Leads', href: '/leads/export', icon: '📊' }
      );
    }

    return (
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="secondary"
              onClick={() => window.location.href = action.href}
              className="flex items-center space-x-2"
            >
              <span>{action.icon}</span>
              <span>{action.title}</span>
            </Button>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Role: <span className="font-medium capitalize">{stats.role.replace('_', ' ')}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(stats.stats).map(([key, value]) => {
          const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const icons: Record<string, string> = {
            'Total Events': '📅',
            'Total Venues': '🏢',
            'Total Users': '👥',
            'Total Campaigns': '🎯',
            'Total Active Campaigns': '🎯',
          };
          
          return renderStatCard(title, value, icons[title] || '📊');
        })}
      </div>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <div className="text-center text-gray-500 py-8">
          <p>No recent activity to display</p>
          <p className="text-sm mt-2">Your recent events and actions will appear here</p>
        </div>
      </Card>
    </div>
  );
}