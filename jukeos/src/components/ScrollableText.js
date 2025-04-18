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
  const [isHovered, setIsHovered] = useState(false);
  const lastTimestampRef = useRef(null);
  const phaseStartTimeRef = useRef(null);
  
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

  // Handle hover events
  const handleMouseEnter = () => {
    if (shouldScroll) {
      setIsHovered(true);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const handleMouseLeave = () => {
    if (shouldScroll) {
      setIsHovered(false);
      lastTimestampRef.current = null;
      phaseStartTimeRef.current = null;
      startAnimation();
    }
  };

  const startAnimation = () => {
    if (!shouldScroll || isHovered) return;

    const animate = (timestamp) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
        phaseStartTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      switch (phase) {
        case 'initial-pause':
          if (timestamp - phaseStartTimeRef.current >= PAUSE_DURATION) {
            setPhase('scrolling');
            phaseStartTimeRef.current = timestamp;
          }
          break;

        case 'scrolling':
          let newPos = position + (direction * PIXELS_PER_SECOND * elapsed / 1000);

          if (direction > 0 && newPos >= maxScroll) {
            newPos = maxScroll;
            setPhase('pause-end');
            phaseStartTimeRef.current = timestamp;
          } else if (direction < 0 && newPos <= 0) {
            newPos = 0;
            setPhase('pause-start');
            phaseStartTimeRef.current = timestamp;
          }

          setPosition(newPos);
          break;

        case 'pause-end':
          if (timestamp - phaseStartTimeRef.current >= PAUSE_DURATION) {
            setDirection(-1);
            setPhase('scrolling');
            phaseStartTimeRef.current = timestamp;
          }
          break;

        case 'pause-start':
          if (timestamp - phaseStartTimeRef.current >= PAUSE_DURATION) {
            setDirection(1);
            setPhase('scrolling');
            phaseStartTimeRef.current = timestamp;
          }
          break;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Handle animation lifecycle
  useEffect(() => {
    setPosition(0);
    setDirection(1);
    setPhase('initial-pause');
    lastTimestampRef.current = null;
    phaseStartTimeRef.current = null;
    
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
    if (!shouldScroll || isHovered) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }
    
    startAnimation();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldScroll, position, direction, phase, maxScroll, isHovered]);
  
  // Determine CSS classes based on current animation phase
  const isScrolling = phase === 'scrolling' && !isHovered;
  const isPaused = phase === 'pause-end' || phase === 'pause-start' || phase === 'initial-pause' || isHovered;
  
  // Build class names based on current state
  const containerClass = `scrollable-text-container ${className} 
    ${isScrolling ? 'is-scrolling' : ''} 
    ${isPaused ? 'is-paused' : ''}
    ${isHovered ? 'is-hovered' : ''}`.replace(/\s+/g, ' ').trim();
  
  // Apply inline transform for precise positioning
  const textStyle = shouldScroll ? {
    transform: `translateX(${-position}px)`,
    transition: isHovered ? 'transform 0.3s ease-out' : 'none'
  } : {};
  
  return React.createElement(
    'div',
    {
      className: containerClass,
      ref: containerRef,
      style: style,
      'data-direction': direction,
      'data-phase': phase,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleMouseEnter,
      onTouchEnd: handleMouseLeave
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