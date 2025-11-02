// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import FloorplanEditor from './components/FloorplanEditor.jsx';
import VendorSignupPage from './components/VendorSignupPage.jsx';
import OnboardingFlow from './components/OnboardingFlow.jsx';
import './App.css';
import './index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Check the URL for a 'token' query parameter
  const urlParams = new URLSearchParams(globalThis.location.search);
  const signupToken = urlParams.get('token');

  useEffect(() => {
    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      if (user) {
        // Check if user needs onboarding
        const hasCompletedOnboarding = user.user_metadata?.onboarding_completed;
        const hasSkippedOnboarding = user.user_metadata?.onboarding_skipped;
        
        // Show onboarding if user hasn't completed it and hasn't skipped it
        setShowOnboarding(!hasCompletedOnboarding && !hasSkippedOnboarding);
      } else {
        setShowOnboarding(false);
      }
      
      setIsLoadingAuth(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      if (user) {
        const hasCompletedOnboarding = user.user_metadata?.onboarding_completed;
        const hasSkippedOnboarding = user.user_metadata?.onboarding_skipped;
        setShowOnboarding(!hasCompletedOnboarding && !hasSkippedOnboarding);
      }
      
      setIsLoadingAuth(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Show loading while checking auth
  if (isLoadingAuth) {
    return (
      <div className="App">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* If a signup token is in the URL, show the signup page. Otherwise, show the main editor. */}
      {signupToken ? (
        <VendorSignupPage token={signupToken} />
      ) : (
        <>
          <FloorplanEditor />
          {/* Show onboarding overlay for authenticated users who need it */}
          {currentUser && showOnboarding && (
            <OnboardingFlow
              currentUser={currentUser}
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingSkip}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;