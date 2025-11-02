// src/components/OnboardingCard.jsx
import React, { useEffect, useState } from 'react';

const OnboardingCard = ({ step, isLastStep }) => {
  const [highlightElement, setHighlightElement] = useState(null);

  useEffect(() => {
    // Clear any existing highlights
    const existingHighlights = document.querySelectorAll('.onboarding-highlight');
    existingHighlights.forEach(el => el.classList.remove('onboarding-highlight'));

    // Add highlight to target element if specified
    if (step.highlightSelector && step.interactive) {
      const targetElement = document.querySelector(step.highlightSelector);
      if (targetElement) {
        targetElement.classList.add('onboarding-highlight');
        setHighlightElement(targetElement);
        
        // Scroll element into view smoothly
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }

    // Cleanup function
    return () => {
      if (highlightElement) {
        highlightElement.classList.remove('onboarding-highlight');
      }
    };
  }, [step, highlightElement]);

  return (
    <div className="onboarding-card">
      {/* Card Container */}
      <div className="onboarding-card-container">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="onboarding-icon-container">
            {step.icon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="onboarding-title">
            {step.title}
          </h2>
          
          <h3 className="onboarding-subtitle">
            {step.subtitle}
          </h3>
          
          <div className="onboarding-content">
            {step.content}
          </div>

          {/* Interactive indicator */}
          {step.interactive && (
            <div className="onboarding-interactive-indicator">
              <div className="onboarding-pulse-dot"></div>
              <span>Look for the highlighted area</span>
            </div>
          )}

          {/* Special styling for final card */}
          {isLastStep && (
            <div className="onboarding-final-card">
              <p className="onboarding-final-text">
                Ready to create amazing event experiences? Let's get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingCard;