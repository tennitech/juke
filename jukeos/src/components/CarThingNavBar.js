import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SpotifyAuthContext } from '../contexts/spotify';

/**
 * CarThingNavBar - A specialized navigation bar for the Spotify Car Thing (800x480 resolution)
 * 
 * This component is a simplified version of the main NavigationBar, optimized for:
 * - Smaller screen size (800x480)
 * - Touch/dial-based interaction
 * - Driving context (larger touch targets, simplified UI)
 * - Reduced animations and visual effects for better performance and less distraction
 */
const CarThingNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken } = useContext(SpotifyAuthContext);
  const [isCarThing] = useState(window.innerWidth <= 800 && window.innerHeight <= 480);

  // Only render this navbar on Car Thing devices
  if (!isCarThing) {
    return null;
  }

  return (
    <nav className="car-thing-navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 15px',
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Left side - Home button */}
      <div className="car-nav-left">
        <NavLink 
          to="/" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/' ? '#FFC764' : 'white',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: location.pathname === '/' ? 'rgba(255, 199, 100, 0.2)' : 'transparent'
          }}
        >
          Home
        </NavLink>
      </div>

      {/* Center - Current page title */}
      <div className="car-nav-title" style={{
        fontFamily: 'Loubag, sans-serif',
        fontSize: '1.2rem',
        color: '#ECE0C4',
        letterSpacing: '1px'
      }}>
        {location.pathname === '/' && 'Now Playing'}
        {location.pathname === '/library' && 'Library'}
        {location.pathname === '/settings' && 'Settings'}
      </div>

      {/* Right side - Quick access buttons */}
      <div className="car-nav-right" style={{
        display: 'flex',
        gap: '15px'
      }}>
        <NavLink 
          to="/library" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/library' ? '#FFC764' : 'white',
            fontSize: '1.2rem',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: location.pathname === '/library' ? 'rgba(255, 199, 100, 0.2)' : 'transparent'
          }}
        >
          Library
        </NavLink>
        
        <NavLink 
          to="/settings" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/settings' ? '#FFC764' : 'white',
            fontSize: '1.2rem',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: location.pathname === '/settings' ? 'rgba(255, 199, 100, 0.2)' : 'transparent'
          }}
        >
          Settings
        </NavLink>
      </div>
    </nav>
  );
};

export default CarThingNavBar; 