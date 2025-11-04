import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Map, DollarSign, User, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/map-editor', label: 'Map Editor', icon: Map },
    { path: '/sponsors', label: 'Sponsors', icon: DollarSign },
      { path: '/profile', label: 'Profile', icon: User },
      { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl">NavEaze DPM</h1>
        <p className="text-sm text-slate-400 mt-1">{user?.name}</p>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};
