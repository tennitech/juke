import React, { useEffect, useState } from 'react';
import harmonyGoldStar from '../assets/harmony-gold-star.svg';
import harmonyBlueStar from '../assets/harmony-blue-star.svg';
import AnimatedBlob from './AnimatedBlob';
import './HarmonyStars.css';

const HarmonyStars = ({ 
  isInNavBar = true, 
  size = 'small', // 'small' for navbar, 'large' for center screen
  position = {}, // custom positioning if needed
  animateBlob = false
}) => {
  // Size configurations
  const sizes = {
    small: {
      container: { width: '40px', height: '30px' },
      goldStar: { width: '30px' },
      blueStar: { width: '15px', top: '-7px', right: '0px' },
      blob: { 
        width: '46px',
        height: '35px',
        filter: 'blur(8px)',
      }
    },
    large: {
      container: { width: '300px', height: '300px' },
      goldStar: { width: '300px' },
      blueStar: { width: '120px', top: '-30px', right: '20px' },
      blob: { 
        width: '320px', 
        height: '320px',
        filter: 'blur(30px)',
      }
    }
  };

  // Animation states for the stars
  const [goldStarRotation, setGoldStarRotation] = useState(0);
  const [blueStarRotation, setBlueStarRotation] = useState(0);

  // Animation effect
  useEffect(() => {
    let animationFrame;
    let startTime;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Calculate rotations with opposite directions
      // Gold star rotates clockwise (positive values)
      const goldRotation = 3 * Math.sin(elapsed / 1000);
      // Blue star rotates counterclockwise (negative values)
      const blueRotation = -3 * Math.sin(elapsed / 1000);
      
      setGoldStarRotation(goldRotation);
      setBlueStarRotation(blueRotation);
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Vibrant, saturated colors
  const harmonyColors = [
    'rgba(166, 104, 255, 1.0)', // Pure purple - full opacity
    'rgba(151, 225, 251, 1.0)', // Pure light blue - full opacity
    'rgba(155, 198, 252, 1.0)'  // Pure medium blue - full opacity
  ];

  const currentSize = sizes[size];
  
  // Default styles for navbar positioning
  const defaultNavBarStyles = isInNavBar ? {
    position: 'absolute',
    left: '-38px',
    top: '50%',
    transform: 'translateY(-50%)',
  } : {}; // Empty object if not in navbar
  
  // Merge default positioning with any custom position props
  const containerStyle = {
    ...defaultNavBarStyles,
    ...position,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...currentSize.container,
    zIndex: 2,
    position: isInNavBar ? 'absolute' : 'relative',
    overflow: 'visible !important' // Ensure visibility
  };

  // Adjust blob position based on size
  const blobPosition = size === 'small' 
    ? { left: '-2px', top: '0px' } 
    : { left: '0', top: '0' };

  // Common blob styles with focused positioning
  const blobStyle = {
    ...currentSize.blob,
    ...blobPosition,
    position: 'absolute',
    zIndex: 1,
    borderRadius: '60% 40% 50% 50% / 50% 50% 60% 40%',
    boxShadow: '0 0 15px rgba(166, 104, 255, 0.7)',
    opacity: 0.9,
    transform: 'rotate(-5deg)',
    pointerEvents: 'none', // Prevent blob from interfering with interactions
  };

  return (
    <div style={containerStyle} className="harmony-stars-container">
      {/* Tightly focused animated blob */}
      <AnimatedBlob
        colors={harmonyColors}
        style={blobStyle}
        static={!animateBlob}
        speed={0.4}
      />
      
      {/* Gold star with clockwise rotation */}
      <img 
        src={harmonyGoldStar} 
        alt=""
        style={{ 
          ...currentSize.goldStar,
          height: 'auto',
          position: 'relative',
          zIndex: 2,
          transform: `rotate(${goldStarRotation}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      />
      
      {/* Blue star with counterclockwise rotation */}
      <img 
        src={harmonyBlueStar} 
        alt=""
        style={{ 
          ...currentSize.blueStar,
          height: 'auto',
          position: 'absolute',
          zIndex: 3,
          transform: `rotate(${blueStarRotation}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      />
    </div>
  );
};

export default HarmonyStars; 