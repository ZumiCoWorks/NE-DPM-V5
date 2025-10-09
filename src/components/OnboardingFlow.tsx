import React, { useState } from 'react'
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Building, Calendar, Map, Zap } from 'lucide-react'

interface OnboardingFlowProps {
  onComplete: () => void
}

type Step = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Welcome to NavEaze DPM',
      description: 'Your Digital Placemaking Management portal',
      icon: Building,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Building className="h-12 w-12 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to NavEaze DPM</h3>
            <p className="text-lg text-gray-600 mb-6">
              Your comprehensive Digital Placemaking Management portal for creating immersive AR experiences.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                This quick setup will help you get started with managing venues, events, and AR campaigns.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'venues',
      title: 'Set Up Your Venues',
      description: 'Create and manage your physical locations',
      icon: Building,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Venue Management</h3>
            <p className="text-gray-600 mb-6">
              Start by adding your venues - these are the physical locations where your events will take place.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">What you can do:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Add venue details (name, address, capacity)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Upload floorplans and layouts</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Configure emergency routes</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'events',
      title: 'Create Your Events',
      description: 'Plan and organize your experiences',
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Event Planning</h3>
            <p className="text-gray-600 mb-6">
              Create events that will host your AR experiences and manage attendee flow.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Event features:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Set event dates and times</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Link to specific venues</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Configure capacity and access</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'ar-campaigns',
      title: 'Design AR Experiences',
      description: 'Create immersive augmented reality campaigns',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AR Campaign Creation</h3>
            <p className="text-gray-600 mb-6">
              Design and deploy augmented reality experiences that engage your visitors.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">AR capabilities:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Place AR zones on floorplans</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Upload 3D assets and media</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Configure trigger conditions</span>
              </li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Progress Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Quick Start Guide</h2>
              <span className="text-blue-200 text-sm">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = completedSteps.has(index)
                const isCurrent = index === currentStep
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => handleStepClick(index)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                          ? 'bg-white border-white text-blue-600'
                          : 'border-blue-300 text-blue-300 hover:border-blue-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-400' : 'bg-blue-300'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>
            
            <div className="mb-8">
              {steps[currentStep].content}
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-gray-50 px-8 py-4 flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={onComplete}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip tutorial
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}