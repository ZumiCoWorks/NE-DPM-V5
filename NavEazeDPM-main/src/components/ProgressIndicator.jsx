// src/components/ProgressIndicator.jsx
import React from 'react';

const ProgressIndicator = ({ currentStep, totalSteps, className = '' }) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={`progress-indicator ${className}`}>
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-white to-transparent opacity-20 animate-shine"></div>
        </div>
      </div>

      {/* Step Dots */}
      <div className="flex justify-between items-center mt-4">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className={`progress-step-dot ${
                index < currentStep
                  ? 'completed'
                  : index === currentStep
                  ? 'completed active'
                  : 'incomplete'
              }`}
            >
              {/* Active indicator for current step */}
              {index === currentStep && (
                <div className="w-full h-full rounded-full bg-gray-200 animate-pulse"></div>
              )}
            </div>
            
            {/* Step number */}
            <span 
              className={`progress-step-number ${
                index <= currentStep ? 'completed' : 'incomplete'
              }`}
            >
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Text */}
      <div className="text-center mt-3">
        <span className="text-gray-400 text-sm">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <div className="text-gray-600 text-xs mt-1">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;