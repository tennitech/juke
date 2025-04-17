import React, { useEffect, useRef, useState } from 'react';
import './ScrollableText.css';

const ScrollableText = ({ text, style, className = '', speed = 'title' }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const animationRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [phase, setPhase] = useState('initial-pause');
  const [maxScroll, setMaxScroll] = useState(0);
  
  // Constants for animation speed
  const PIXELS_PER_SECOND = speed === 'title' ? 80 : 40;
  const PAUSE_DURATION = 3000; // 3 seconds
  const FADE_DURATION = 800;
  
  // Check if text is too long for container
  const checkOverflow = () => {
    if (!containerRef.current || !textRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const textWidth = textRef.current.scrollWidth;
    const needsScroll = textWidth > containerWidth + 20;
    
    setShouldScroll(needsScroll);
    
    if (needsScroll) {
      const overflow = textWidth - containerWidth;
      const visiblePortion = Math.max(containerWidth * 0.4, 150);
      const scrollDistance = Math.min(overflow, textWidth - visiblePortion);
      setMaxScroll(scrollDistance);
      setPosition(0);
    }
  };
  
  // Handle animation lifecycle
  useEffect(() => {
    setPosition(0);
    setDirection(1);
    setPhase('initial-pause');
    
    checkOverflow();
    
    const initialTimer = setTimeout(() => {
      checkOverflow();
    }, 100);
    
    const fontTimer = setTimeout(() => {
      checkOverflow();
    }, 1000);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(fontTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      checkOverflow();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Main animation loop
  useEffect(() => {
    if (!shouldScroll) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setPhase('initial-pause');
      return;
    }
    
    let lastTimestamp = null;
    let phaseStartTime = null;
    
    const animate = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        phaseStartTime = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      switch (phase) {
        case 'initial-pause':
          if (timestamp - phaseStartTime >= PAUSE_DURATION) {
            setPhase('scrolling');
            phaseStartTime = timestamp;
          }
          break;
          
        case 'scrolling':
          let newPos = position + (direction * PIXELS_PER_SECOND * elapsed / 1000);
          
          if (direction > 0 && newPos >= maxScroll) {
            newPos = maxScroll;
            setPhase('pause-end');
            phaseStartTime = timestamp;
          } else if (direction < 0 && newPos <= 0) {
            newPos = 0;
            setPhase('pause-start');
            phaseStartTime = timestamp;
          }
          
          setPosition(newPos);
          break;
          
        case 'pause-end':
          if (timestamp - phaseStartTime >= PAUSE_DURATION) {
            setDirection(-1);
            setPhase('scrolling');
            phaseStartTime = timestamp;
          }
          break;
          
        case 'pause-start':
          if (timestamp - phaseStartTime >= PAUSE_DURATION) {
            setDirection(1);
            setPhase('scrolling');
            phaseStartTime = timestamp;
          }
          break;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldScroll, position, direction, phase, maxScroll]);
  
  // Determine CSS classes based on current animation phase
  const isScrolling = phase === 'scrolling';
  const isPaused = phase === 'pause-end' || phase === 'pause-start' || phase === 'initial-pause';
  
  // Build class names based on current state
  const containerClass = `scrollable-text-container ${className} 
    ${isScrolling ? 'is-scrolling' : ''} 
    ${isPaused ? 'is-paused' : ''}`.replace(/\s+/g, ' ').trim();
  
  // Apply inline transform for precise positioning
  const textStyle = shouldScroll ? {
    transform: `translateX(${-position}px)`,
    transition: 'none'
  } : {};
  
  return React.createElement(
    'div',
    {
      className: containerClass,
      ref: containerRef,
      style: style,
      'data-direction': direction,
      'data-phase': phase
    },
    shouldScroll
      ? React.createElement(
          'div',
          { className: 'scrolling-wrapper' },
          React.createElement(
            'div',
            { className: 'scrolling-content' },
            React.createElement(
              'div',
              {
                className: 'scrollable-text',
                ref: textRef,
                style: textStyle
              },
              text
            )
          )
        )
      : React.createElement(
          'div',
          { className: 'scrolling-content', ref: textRef },
          text
        )
  );
};

export default ScrollableText; 