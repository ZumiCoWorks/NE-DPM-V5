// src/components/ScreenSizeRestriction.jsx
import React from 'react';

const MonitorIcon = ({ className = 'w-16 h-16' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const TabletIcon = ({ className = 'w-12 h-12' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);

const SmartphoneIcon = ({ className = 'w-8 h-8' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);

const ScreenSizeRestriction = ({ onClose, currentWidth, currentHeight }) => {
  const minimumWidth = 1024;
  const minimumHeight = 768;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(31, 41, 55, 0.95) 100%)',
        padding: '50px 40px',
        borderRadius: '24px',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3), 0 12px 40px rgba(59, 130, 246, 0.15)',
        width: '90%',
        maxWidth: '600px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Decorative background elements */}
        <div style={{ 
          position: 'absolute', 
          top: '-100px', 
          right: '-100px', 
          width: '200px', 
          height: '200px', 
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', 
          borderRadius: '50%' 
        }}></div>
        <div style={{ 
          position: 'absolute', 
          bottom: '-50px', 
          left: '-50px', 
          width: '100px', 
          height: '100px', 
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)', 
          borderRadius: '50%' 
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              gap: '16px'
            }}>
              <MonitorIcon style={{ color: '#3b82f6' }} />
              <h2 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Screen Size Required
              </h2>
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '18px',
              lineHeight: '1.6',
              margin: '0 0 24px 0'
            }}>
              The FloorPlan Editor requires a larger screen for the best experience
            </p>
          </div>

          {/* Current vs Required */}
          <div style={{ 
            marginBottom: '36px',
            padding: '24px',
            background: 'rgba(17, 24, 39, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
              <div>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: '#ef4444', 
                  fontSize: '16px', 
                  fontWeight: '600' 
                }}>
                  Current Screen
                </h4>
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  padding: '12px 16px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#ef4444', 
                    fontSize: '18px', 
                    fontWeight: 'bold' 
                  }}>
                    {currentWidth} × {currentHeight}
                  </p>
                </div>
              </div>
              <div>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: '#22c55e', 
                  fontSize: '16px', 
                  fontWeight: '600' 
                }}>
                  Required Minimum
                </h4>
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  padding: '12px 16px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#22c55e', 
                    fontSize: '18px', 
                    fontWeight: 'bold' 
                  }}>
                    {minimumWidth} × {minimumHeight}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Device Icons */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '16px', 
              marginBottom: '20px' 
            }}>
              Supported devices:
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '32px' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <MonitorIcon style={{ color: '#22c55e', marginBottom: '8px' }} />
                <p style={{ 
                  margin: 0, 
                  color: '#22c55e', 
                  fontSize: '14px', 
                  fontWeight: '500' 
                }}>
                  Desktop
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <TabletIcon style={{ color: '#22c55e', marginBottom: '8px' }} />
                <p style={{ 
                  margin: 0, 
                  color: '#22c55e', 
                  fontSize: '14px', 
                  fontWeight: '500' 
                }}>
                  Tablet
                </p>
              </div>
              <div style={{ textAlign: 'center', opacity: 0.5 }}>
                <SmartphoneIcon style={{ color: '#ef4444', marginBottom: '8px' }} />
                <p style={{ 
                  margin: 0, 
                  color: '#ef4444', 
                  fontSize: '14px', 
                  fontWeight: '500' 
                }}>
                  Phone
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            padding: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '32px'
          }}>
            <p style={{
              color: 'var(--text-primary)',
              fontSize: '16px',
              margin: 0,
              lineHeight: '1.5'
            }}>
              <strong>💡 Quick Solutions:</strong><br />
              • Use a desktop computer or laptop<br />
              • Rotate your tablet to landscape orientation<br />
              • Increase your browser zoom level
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: '500',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
              }}
            >
              Check Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenSizeRestriction;