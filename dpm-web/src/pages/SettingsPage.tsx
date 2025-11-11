import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quicketApiKey, setQuicketApiKey] = useState('');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('quicket_api_key')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore "No rows found" style error
          throw error;
        }
        if (data) {
          setQuicketApiKey(data.quicket_api_key || '');
        }
      } catch (error: any) {
        toast.error('Failed to fetch settings.', { description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchUserSettings();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, quicket_api_key: quicketApiKey }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save settings.', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Settings</CardTitle>
          <CardDescription>Manage your application settings and integrations.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveSettings}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Quicket Integration</h3>
              <p className="text-sm text-muted-foreground">
                Enter your Quicket API key to automatically import event and ticket data.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="quicket-api-key" className="text-sm font-medium">
                Quicket API Key
              </label>
              <Input
                id="quicket-api-key"
                type="password"
                value={quicketApiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuicketApiKey(e.target.value)}
                placeholder="Enter your Quicket API key"
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;
