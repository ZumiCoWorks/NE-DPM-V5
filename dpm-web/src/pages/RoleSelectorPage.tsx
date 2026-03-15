import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Settings, ShieldCheck, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';

export const RoleSelectorPage = () => {
  const navigate = useNavigate();
  const { verifyAttendeeIdentity } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(false);

    try {
      const ok = await verifyAttendeeIdentity(identifier.trim());
      if (ok) {
        setVerifySuccess(true);
        // Small delay so the user sees the success state, then navigate
        setTimeout(() => {
          navigate('/e2e-attendee');
        }, 800);
      } else {
        setVerifyError('Ticket not found. Please check your email or phone number and try again.');
      }
    } catch {
      setVerifyError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const sponsorAndAdminRoles = [
    {
      title: 'For Sponsors',
      description: 'Access your sponsor dashboard and leads',
      icon: DollarSign,
      link: '/login',
      color: 'bg-green-500',
      cta: 'Sign In →',
    },
    {
      title: 'For Event Admins',
      description: 'Manage events, maps, and sponsors',
      icon: Settings,
      link: '/login',
      color: 'bg-purple-500',
      cta: 'Sign In →',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl text-white mb-4">NavEaze</h1>
          <p className="text-xl text-slate-300">Digital Platform Manager</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── Attendee verification card ── */}
          <Card className="h-full hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <CardTitle>For Attendees</CardTitle>
              <CardDescription>Enter your email or phone to verify your ticket and access the event map</CardDescription>
            </CardHeader>
            <CardContent>
              {verifySuccess ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Verified! Loading your map…
                </div>
              ) : (
                <form onSubmit={handleVerify} className="space-y-3">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setVerifyError(null);
                    }}
                    placeholder="Email or phone number"
                    disabled={verifying}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                    autoComplete="email"
                  />
                  {verifyError && (
                    <div className="flex items-start gap-1.5 text-red-600 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {verifyError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={verifying || !identifier.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      'Verify Ticket →'
                    )}
                  </button>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                    Your data is hashed and never stored in plain text.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {/* ── Sponsor & Admin cards ── */}
          {sponsorAndAdminRoles.map((role) => {
            const Icon = role.icon;
            return (
              <Link key={role.title} to={role.link} className="block transition-transform hover:scale-105">
                <Card className="h-full cursor-pointer hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className={`w-16 h-16 ${role.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle>{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-blue-600">{role.cta}</span>
                  </CardContent>
                </Card>
              </Link>
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
