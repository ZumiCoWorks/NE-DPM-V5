import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const VendorSignupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const signupToken = searchParams.get('token');
    if (!signupToken) {
      setError('No signup token provided. Please use the link you received via email.');
      setLoading(false);
      return;
    }
    setToken(signupToken);

    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.rpc('verify_vendor_token', { token_arg: signupToken });
        if (error) throw error;

        if (data) {
          setVendorName(data.vendor_name);
          setEmail(data.vendor_email || '');
        } else {
          setError('Invalid or expired token. Please request a new link.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Token is missing.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      // 1) Create auth user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: vendorName },
        }
      });
      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (!newUserId) {
        throw new Error('Signup succeeded but no user ID was returned. Please check your email for confirmation and try logging in.');
      }

      // 2) Complete vendor signup by linking vendor to user and setting role
      const { error: rpcError } = await supabase.rpc('complete_vendor_signup', {
        token_arg: token,
        user_id_arg: newUserId,
      });
      if (rpcError) throw rpcError;

      setMessage('Signup successful! You will be redirected to the login page shortly.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to complete signup.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vendor Registration</CardTitle>
          <CardDescription>
            Complete your registration for {vendorName || 'your event'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Complete Registration'}
              </Button>
              {message && <p className="text-green-500 text-center mt-4">{message}</p>}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSignupPage;
