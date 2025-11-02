// src/components/OnboardingDemo.jsx
import React, { useState } from 'react';
import OnboardingFlow from './OnboardingFlow.jsx';

const OnboardingDemo = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Mock user object for demo
  const mockUser = {
    id: 'demo-user-123',
    email: 'demo@naveaze.com',
    user_metadata: {
      role: 'Venue Owner'
    }
  };

  const handleComplete = () => {
    setShowOnboarding(false);
    alert('Onboarding completed! In the real app, this would update user metadata.');
  };

  const handleSkip = () => {
    setShowOnboarding(false);
    alert('Onboarding skipped! You can access it later from the Help menu.');
  };

  const handleShowDemo = () => {
    setShowOnboarding(true);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 50%, #000000 100%)',
      padding: '2rem',
      color: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#60A5FA'
        }}>
          NavEaze DPM Onboarding Demo
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#E5E4E2', marginBottom: '2rem' }}>
          Experience the interactive onboarding flow that guides new users through NavEaze DPM's key features.
        </p>
        
        {!showOnboarding && (
          <button
            onClick={handleShowDemo}
            style={{
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Launch Onboarding Demo
          </button>
        )}
      </div>

      {/* Demo UI Elements for Interactive Highlighting */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        width: '100%',
        maxWidth: '1200px',
        marginBottom: '2rem'
      }}>
        <div data-onboarding="venue-section" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #C0C0C0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Venue Creation</h3>
          <p style={{ margin: 0, color: '#E5E4E2', fontSize: '0.875rem' }}>Create reusable venue templates</p>
        </div>

        <div data-onboarding="canvas-area" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #C0C0C0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Floorplan Editor</h3>
          <p style={{ margin: 0, color: '#E5E4E2', fontSize: '0.875rem' }}>Interactive canvas editing</p>
        </div>

        <div data-onboarding="vendors-tab" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #C0C0C0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Vendor Management</h3>
          <p style={{ margin: 0, color: '#E5E4E2', fontSize: '0.875rem' }}>Connect and coordinate vendors</p>
        </div>

        <div data-onboarding="beacons-section" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #C0C0C0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Beacon Placement</h3>
          <p style={{ margin: 0, color: '#E5E4E2', fontSize: '0.875rem' }}>Precision navigation setup</p>
        </div>

        <div data-onboarding="events-section" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #C0C0C0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Event Management</h3>
          <p style={{ margin: 0, color: '#E5E4E2', fontSize: '0.875rem' }}>From template to reality</p>
        </div>

        <div data-onboarding="export-section" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #C0C0C0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Export & Deploy</h3>
          <p style={{ margin: 0, color: '#E5E4E2', fontSize: '0.875rem' }}>Share your creation</p>
        </div>
      </div>

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          currentUser={mockUser}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
};

export default OnboardingDemo;