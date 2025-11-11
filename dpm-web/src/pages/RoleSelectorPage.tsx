import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const RoleSelectorPage = () => {
  const { user, updateUserRole, loading } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = async (role: 'admin' | 'sponsor') => {
    // If the user isn't signed in, send them to login first.
    if (!user) {
      navigate('/login');
      return;
    }
    // Avoid duplicate clicks while auth state is resolving for signed-in users.
    if (loading) return;
    try {
      await updateUserRole(role);
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const roles = [
    {
      title: 'For Attendees',
      description: 'Download our mobile app to navigate events',
      icon: MapPin,
      action: () => window.open('https://apps.apple.com', '_blank'),
      buttonText: 'Open App Store',
      color: 'bg-blue-500',
      disabled: false,
    },
    {
      title: 'For Sponsors',
      description: 'Access your sponsor dashboard and leads',
      icon: DollarSign,
      action: () => handleRoleSelect('sponsor'),
      buttonText: user ? 'Become a Sponsor' : 'Sign In',
      color: 'bg-green-500',
      // Allow clicking if not signed in so the user can go to /login
      disabled: !!user && loading,
    },
    {
      title: 'For Event Admins',
      description: 'Manage events, maps, and sponsors',
      icon: Settings,
      action: () => handleRoleSelect('admin'),
      buttonText: user ? 'Continue as Admin' : 'Sign In as Admin',
      color: 'bg-purple-500',
      disabled: !!user && loading,
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
              <Card key={role.title} className="h-full flex flex-col">
                <CardHeader>
                  <div className={`w-16 h-16 ${role.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end">
                  <Button onClick={role.action} className="w-full" disabled={role.disabled}>
                    {role.disabled ? 'Authenticating...' : role.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
