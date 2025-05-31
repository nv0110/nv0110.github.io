import React, { useState, useEffect, useCallback } from 'react';
import './OnboardingGuide.css';

function OnboardingGuide({ show, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalStyle, setModalStyle] = useState({});

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Weekly Tracker! 🎉',
      content: (
        <div>
          <p>Track weekly boss completions and rare item drops efficiently.</p>
          <p>Let me show you the key interactive features.</p>
        </div>
      ),
      highlight: null,
      position: 'center',
      offset: { x: 0, y: 0 }
    },
    {
      id: 'characters-title',
      title: 'Analytics Hub 📊',
      content: (
        <div>
          <p><strong>Click "Characters"</strong> to access account-wide analytics.</p>
          <p>View all pitched items and drops across characters and years.</p>
        </div>
      ),
      highlight: '.sidebar-title',
      position: 'right',
      arrow: 'left',
      offset: { x: 24, y: 0 }
    },
    {
      id: 'weekly-progress',
      title: 'Progress Toggle 🔄',
      content: (
        <div>
          <p><strong>Click progress bar</strong> to toggle views:</p>
          <p>• <strong>Account Total:</strong> Overall weekly progress<br/>
          • <strong>Selected Character:</strong> Individual progress</p>
        </div>
      ),
      highlight: '.sidebar-progress-section',
      position: 'right',
      arrow: 'left',
      offset: { x: 24, y: 0 }
    },
    {
      id: 'boss-table',
      title: 'Boss Management 🗡️',
      content: (
        <div>
          <p><strong>Check off bosses</strong> as you complete them.</p>
          <p><strong>Click pitched item icons</strong> to track rare drops.</p>
        </div>
      ),
      highlight: '.weekly-tracker-main .weekly-tracker-content',
      position: 'left',
      arrow: 'right',
      offset: { x: -24, y: 0 }
    },
    {
      id: 'week-navigation',
      title: 'Week Navigation 📅',
      content: (
        <div>
          <p>Navigate between weeks to view historical data and track progress patterns.</p>
        </div>
      ),
      highlight: '.weekly-tracker-navigator-wrapper',
      position: 'bottom',
      arrow: 'top',
      offset: { x: 0, y: 16 }
    },
    {
      id: 'final',
      title: 'Ready to Boss! ✅',
      content: (
        <div>
          <p>You're all set! Start tracking your weekly progress.</p>
          <div className="onboarding-reset-tip">
            <strong>💡 Tip:</strong> To replay this guide, clear localStorage key 'ms-weekly-onboarding-seen'
          </div>
        </div>
      ),
      highlight: null,
      position: 'center',
      offset: { x: 0, y: 0 }
    }
  ];

  // Calculate dynamic positioning based on highlighted element
  const calculateModalPosition = useCallback((stepData) => {
    if (!stepData.highlight) {
      return {}; // Use CSS positioning for non-highlighted steps
    }

    const element = document.querySelector(stepData.highlight);
    if (!element) {
      console.warn(`Onboarding: Element not found for selector: ${stepData.highlight}`);
      return {};
    }

    const rect = element.getBoundingClientRect();
    const modalWidth = 420;
    const { x: offsetX = 0, y: offsetY = 0 } = stepData.offset || {};
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let style = {};

    switch (stepData.position) {
      case 'right':
        style = {
          position: 'fixed',
          left: `${Math.min(rect.right + offsetX, viewport.width - modalWidth - 16)}px`,
          top: `${Math.max(16, rect.top + (rect.height / 2) - 90)}px`, // Center on element
          transform: 'none',
        };
        break;
      case 'left':
        style = {
          position: 'fixed',
          left: `${Math.max(16, rect.left + offsetX - modalWidth)}px`,
          top: `${Math.max(16, rect.top + (rect.height / 2) - 90)}px`, // Center on element
          transform: 'none',
        };
        break;
      case 'bottom':
        style = {
          position: 'fixed',
          left: `${Math.max(16, Math.min(rect.left + (rect.width / 2) + offsetX - modalWidth / 2, viewport.width - modalWidth - 16))}px`,
          top: `${rect.bottom + offsetY}px`, // Just below the element, let CSS handle height
          transform: 'none',
        };
        break;
      case 'top':
        style = {
          position: 'fixed',
          left: `${Math.max(16, Math.min(rect.left + (rect.width / 2) + offsetX - modalWidth / 2, viewport.width - modalWidth - 16))}px`,
          bottom: `${viewport.height - rect.top + offsetY}px`, // Above the element
          transform: 'none',
        };
        break;
      default:
        return {}; // Use CSS positioning
    }

    return style;
  }, []);

  // Update modal position when step changes
  useEffect(() => {
    if (isVisible && currentStep < steps.length) {
      const stepData = steps[currentStep];
      const newStyle = calculateModalPosition(stepData);
      setModalStyle(newStyle);
    }
  }, [currentStep, isVisible, calculateModalPosition]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible && currentStep < steps.length) {
        const stepData = steps[currentStep];
        const newStyle = calculateModalPosition(stepData);
        setModalStyle(newStyle);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep, isVisible, calculateModalPosition]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setCurrentStep(0);
      // Add visual indicators to the page
      document.body.classList.add('onboarding-active');
    } else {
      setIsVisible(false);
      document.body.classList.remove('onboarding-active');
    }

    return () => {
      document.body.classList.remove('onboarding-active');
    };
  }, [show]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    document.body.classList.remove('onboarding-active');
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    document.body.classList.remove('onboarding-active');
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (!show) return null;

  const currentStepData = steps[currentStep];
  
  return (
    <>
      {/* Background overlay */}
      <div className={`onboarding-overlay ${isVisible ? 'visible' : ''}`} />
      
      {/* Spotlight effect for highlighted elements */}
      {currentStepData.highlight && (
        <div className="onboarding-spotlight" data-highlight={currentStepData.highlight} />
      )}

      {/* Main modal */}
      <div 
        className={`onboarding-modal ${isVisible ? 'visible' : ''} ${isTransitioning ? 'transitioning' : ''} position-${currentStepData.position}`} 
        style={modalStyle}
        data-step={currentStepData.id}
      >
        {/* Arrow indicator */}
        {currentStepData.arrow && (
          <div className={`onboarding-arrow arrow-${currentStepData.arrow}`} />
        )}

        <div className="onboarding-content">
          {/* Header */}
          <div className="onboarding-header">
            <h2 className="onboarding-title">{currentStepData.title}</h2>
            <button className="onboarding-skip" onClick={handleSkip} title="Skip tutorial">
              Skip Tour
            </button>
          </div>

          {/* Content */}
          <div className="onboarding-body">
            {currentStepData.content}
          </div>

          {/* Footer */}
          <div className="onboarding-footer">
            <div className="onboarding-progress">
              <span className="onboarding-step-counter">
                {currentStep + 1} of {steps.length}
              </span>
              <div className="onboarding-progress-bar">
                <div 
                  className="onboarding-progress-fill" 
                  data-progress={`${((currentStep + 1) / steps.length) * 100}`}
                />
              </div>
            </div>

            <div className="onboarding-actions">
              {currentStep > 0 && (
                <button className="onboarding-btn secondary" onClick={handlePrevious}>
                  Previous
                </button>
              )}
              <button className="onboarding-btn primary" onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OnboardingGuide; 