import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const RoleSelectorPage = () => {
  const roles = [
    {
      title: 'For Attendees',
      description: 'Download our mobile app to navigate events',
      icon: MapPin,
      link: 'https://apps.apple.com',
      external: true,
      color: 'bg-blue-500'
    },
    {
      title: 'For Sponsors',
      description: 'Access your sponsor dashboard and leads',
      icon: DollarSign,
      link: '/login',
      external: false,
      color: 'bg-green-500'
    },
    {
      title: 'For Event Admins',
      description: 'Manage events, maps, and sponsors',
      icon: Settings,
      link: '/login',
      external: false,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl text-white mb-4">NavEaze</h1>
          <p className="text-xl text-slate-300">Digital Platform Manager</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.title}>
                {role.external ? (
                  <a
                    href={role.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-transform hover:scale-105"
                  >
                    <Card className="h-full cursor-pointer hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className={`w-16 h-16 ${role.color} rounded-lg flex items-center justify-center mb-4`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle>{role.title}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <span className="text-sm text-blue-600">
                          {role.external ? 'Open App Store →' : 'Sign In →'}
                        </span>
                      </CardContent>
                    </Card>
                  </a>
                ) : (
                  <Link
                    to={role.link}
                    className="block transition-transform hover:scale-105"
                  >
                    <Card className="h-full cursor-pointer hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className={`w-16 h-16 ${role.color} rounded-lg flex items-center justify-center mb-4`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle>{role.title}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <span className="text-sm text-blue-600">
                          {role.external ? 'Open App Store →' : 'Sign In →'}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link to="/register" className="text-slate-300 hover:text-white transition-colors">
            Don't have an account? <span className="underline">Sign up here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};