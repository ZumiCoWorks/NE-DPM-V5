// src/components/VendorSignupPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js'; // FIX: Added .js extension

const VendorSignupPage = () => {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  useEffect(() => {
    // In a real app, you'd get the token from the URL
    const urlParams = new URLSearchParams(globalThis.location.search); // FIX: Used globalThis
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setMessage("Sign-up token not found. Please use the link provided in your email.");
      setMessageType('error');
    }
  }, []);

  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('vendor-signup', {
        body: { token, email, password, name },
      });

      if (error) throw error;

      setMessage(data.message || "Registration successful! You can now log in on the NavEaze mobile app.");
      setMessageType('success');

    } catch (err) {
      setMessage(err.message || "An unknown error occurred.");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  if (!token) {
      return (
          <div style={{color: 'var(--text-primary)', textAlign: 'center', padding: '50px'}}>
              <h1>Error</h1>
              <p style={{color: messageType === 'error' ? 'var(--danger)' : 'var(--text-secondary)'}}>{message}</p>
          </div>
      )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '20px'
    }}>
      <div style={{
        padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)', width: '100%', maxWidth: '450px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      }}>
        <h1 style={{ textAlign: 'center', color: 'var(--accent-solid)', marginBottom: '10px', fontSize: '2rem', fontWeight: 'bold' }}>Vendor Account Setup</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '0', marginBottom: '30px' }}>
          Create your account to access the NavEaze vendor dashboard.
        </p>

        {message && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: messageType === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: messageType === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${messageType === 'success' ? '#22c55e' : '#ef4444'}`
          }}>
            {message}
          </div>
        )}

        {!message || messageType !== 'success' ? (
          <form onSubmit={handleRegistration}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Your Name / Business Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Choose a Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid var(--silver-accent)', background: 'var(--accent)', color: 'white', cursor: 'pointer', opacity: loading ? 0.6 : 1, boxShadow: '0 2px 8px rgba(192, 192, 192, 0.2)', transition: 'all 0.2s ease-in-out' }}>
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default VendorSignupPage;