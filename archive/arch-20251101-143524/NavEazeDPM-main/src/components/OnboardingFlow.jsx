// src/components/OnboardingFlow.jsx
import React, { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';
import OnboardingCard from './OnboardingCard.jsx';
import ProgressIndicator from './ProgressIndicator.jsx';

// SVG Icons for navigation
const ChevronLeftIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRightIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const XIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

// Onboarding content for each step
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to NavEaze DPM',
    subtitle: 'Your Digital Project Management Platform',
    content: 'NavEaze DPM is your comprehensive tool for creating sophisticated event experiences. We\'ll guide you through the key features that make venue and event management seamless.',
    icon: '🚀',
    highlightSelector: null,
    interactive: false
  },
  {
    id: 'venue-creation',
    title: 'Venue Creation',
    subtitle: 'Build Your Foundation',
    content: 'Create reusable venue templates that define the basic layout and structure of your physical spaces. These templates serve as the foundation for all your events.',
    icon: '🏢',
    highlightSelector: '[data-onboarding="venue-section"]',
    interactive: true
  },
  {
    id: 'floorplan-editing',
    title: 'Interactive Floorplan Editor',
    subtitle: 'Design with Precision',
    content: 'Upload floorplan images and bring them to life with our powerful canvas-based editor. Add nodes, segments, points of interest, and define walkable paths.',
    icon: '🎨',
    highlightSelector: '[data-onboarding="canvas-area"]',
    interactive: true
  },
  {
    id: 'vendor-management',
    title: 'Vendor Management',
    subtitle: 'Connect and Coordinate',
    content: 'Pre-register vendors, generate secure sign-up links, and monitor real-time location status. Keep track of who\'s where with dynamic location management.',
    icon: '👥',
    highlightSelector: '[data-onboarding="vendors-tab"]',
    interactive: true
  },
  {
    id: 'zone-configuration',
    title: 'Zone Configuration',
    subtitle: 'Organize Your Space',
    content: 'Define specific areas within your venue such as "Food Court," "Main Stage," or "Restricted Areas." Zones help attendees navigate and understand space organization.',
    icon: '📍',
    highlightSelector: '[data-onboarding="zones-section"]',
    interactive: true
  },
  {
    id: 'beacon-placement',
    title: 'Beacon Placement',
    subtitle: 'Precision Navigation',
    content: 'Place and configure Bluetooth beacons for enhanced indoor positioning. Improve navigation accuracy and enable advanced features like proximity-based notifications.',
    icon: '📡',
    highlightSelector: '[data-onboarding="beacons-section"]',
    interactive: true
  },
  {
    id: 'event-management',
    title: 'Event Management',
    subtitle: 'From Template to Reality',
    content: 'Transform venue templates into live events. Customize layouts, add event-specific details, and prepare your venue for attendees and vendors.',
    icon: '🎪',
    highlightSelector: '[data-onboarding="events-section"]',
    interactive: true
  },
  {
    id: 'export-capabilities',
    title: 'Export & Deploy',
    subtitle: 'Share Your Creation',
    content: 'Export all event data as JSON files for use in the NavEaze mobile app. Your carefully crafted venues become interactive experiences for attendees.',
    icon: '💾',
    highlightSelector: '[data-onboarding="export-section"]',
    interactive: true
  },
  {
    id: 'congratulations',
    title: 'You\'re Ready to Start!',
    subtitle: 'Welcome to NavEaze',
    content: 'Congratulations! You now understand the core features of NavEaze DPM. Start by creating your first venue or uploading a floorplan to begin your journey.',
    icon: '🎉',
    highlightSelector: null,
    interactive: false
  }
];

const OnboardingFlow = ({ currentUser, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = useCallback(async () => {
    if (!currentUser) return;
    
    setIsCompleting(true);
    try {
      // Update user metadata to mark onboarding as completed
      const { error } = await supabase.auth.updateUser({
        data: { 
          ...currentUser.user_metadata,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still complete the onboarding on error - don't block the user
      onComplete();
    } finally {
      setIsCompleting(false);
    }
  }, [currentUser, onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      // Mark as skipped but not completed
      await supabase.auth.updateUser({
        data: { 
          ...currentUser.user_metadata,
          onboarding_skipped: true,
          onboarding_skipped_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error marking onboarding as skipped:', error);
    }
    
    onSkip();
  }, [currentUser, onSkip]);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-2xl">
        {/* Skip Button */}
        {!isLastStep && (
          <button
            onClick={handleSkip}
            className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
          >
            <span>Skip Tour</span>
            <XIcon className="w-4 h-4" />
          </button>
        )}

        {/* Progress Indicator */}
        <ProgressIndicator 
          currentStep={currentStep} 
          totalSteps={ONBOARDING_STEPS.length}
          className="mb-6"
        />

        {/* Onboarding Card */}
        <OnboardingCard
          step={currentStepData}
          isLastStep={isLastStep}
        />

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              currentStep === 0
                ? 'text-gray-600 cursor-not-allowed opacity-50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-gray-600 text-sm">
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>

          <button
            onClick={handleNext}
            disabled={isCompleting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 disabled:opacity-50"
          >
            <span>
              {isLastStep ? (isCompleting ? 'Completing...' : 'Get Started') : 'Next'}
            </span>
            {!isLastStep && <ChevronRightIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;