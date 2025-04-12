import React, { useEffect, useRef, useState } from 'react';
import './ScrollableText.css';

const ScrollableText = ({ text, style, className = '', speed = 'title' }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const oscillatingRef = useRef(null);
  const timerRefs = useRef([]);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollEnd, setScrollEnd] = useState(0);
  const [isCurrentlyScrolling, setIsCurrentlyScrolling] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Check if text is too long for container and calculate scroll distance
  const checkOverflow = () => {
    if (!containerRef.current || !textRef.current) return;
    
    // Get accurate measurements
    const containerWidth = containerRef.current.clientWidth;
    const textWidth = textRef.current.scrollWidth;
    
    // For debugging
    // console.log(`Text: "${text}", Container: ${containerWidth}px, Text: ${textWidth}px, Diff: ${textWidth - containerWidth}px`);
    
    // Be more conservative - only scroll if text is significantly wider than container
    // Increase threshold to 20px to avoid unnecessary scrolling
    const needsScroll = textWidth > containerWidth + 20;
    
    // Set state based on overflow check
    setShouldScroll(needsScroll);
    
    if (needsScroll) {
      // Calculate how far we need to scroll
      // We only want to scroll enough so the end of the text is just visible
      
      // For shorter overflows, we scroll less to ensure text remains visible throughout
      const overflow = textWidth - containerWidth;
      
      // Ensure at least 40% of text is visible at end position to avoid "disappearing" text
      const visiblePortion = Math.max(containerWidth * 0.4, 150);
      const scrollDistance = -Math.min(overflow, textWidth - visiblePortion);
      
      setScrollEnd(scrollDistance);
    }
  };

  // Function to clear all active timers
  const clearAllTimers = () => {
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current = [];
  };

  // Force measurements to happen after render and font loading
  useEffect(() => {
    // Reset scroll state when text changes
    setShouldScroll(false);
    setIsCurrentlyScrolling(false);
    setIsPreparing(false);
    setIsScrolled(false);
    
    // First measurement after initial render
    const initialTimer = setTimeout(() => {
      checkOverflow();
    }, 100);
    
    // Second measurement after fonts have likely loaded
    const fontTimer = setTimeout(() => {
      checkOverflow();
    }, 1000);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(fontTimer);
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

  // Set up animation monitoring to track when text is actually moving
  useEffect(() => {
    if (!shouldScroll || !oscillatingRef.current) {
      setIsCurrentlyScrolling(false);
      setIsPreparing(false);
      setIsScrolled(false);
      return;
    }

    // Timing for animation phases based on a 28s duration for title
    // We need to adjust timings based on speed
    const animationDuration = speed === 'title' ? 28000 : 26000;
    
    // Adjusted timing percentages for smoother fade
    const prepareBeforeStartTime = animationDuration * 0.05; // At 5% - start fade earlier
    const startMovingTime = animationDuration * 0.10; // At 10% - movement begins
    const approachingEndTime = animationDuration * 0.35; // At 35% - start fading out earlier
    const endingMovementTime = animationDuration * 0.40; // At 40% - reached end
    const startReturnTime = animationDuration * 0.45; // At 45% - prepare return earlier
    const returningMovementTime = animationDuration * 0.50; // At 50% - return begins
    const approachingHomeTime = animationDuration * 0.75; // At 75% - start fade out earlier
    const endingAnimation = animationDuration * 0.80; // At 80% - reached start

    const handleAnimationStart = () => {
      // Clear any existing timers when animation starts/restarts
      clearAllTimers();
      
      // Initialize with no effects
      setIsCurrentlyScrolling(false);
      setIsPreparing(false);
      setIsScrolled(false);
      
      // PHASE 1: Prepare for movement - start fade earlier
      const timer1 = setTimeout(() => {
        setIsPreparing(true);
      }, prepareBeforeStartTime);
      
      // PHASE 2: Start actual movement
      const timer2 = setTimeout(() => {
        setIsPreparing(false);
        setIsCurrentlyScrolling(true);
      }, startMovingTime);
      
      // PHASE 3: Approaching end position - prepare fade out
      const timer3 = setTimeout(() => {
        setIsScrolled(true); // Set scrolled state early
        setIsPreparing(true); // Start fade preparation
      }, approachingEndTime);
      
      // PHASE 4: Pause at end - maintain scrolled state
      const timer4 = setTimeout(() => {
        setIsCurrentlyScrolling(false);
        setIsPreparing(false);
        setIsScrolled(true); // Keep scrolled state active
      }, endingMovementTime);
      
      // PHASE 5: Prepare for return journey - maintain scrolled state
      const timer5 = setTimeout(() => {
        setIsPreparing(true);
        setIsScrolled(true); // Keep scrolled state active
      }, startReturnTime);
      
      // PHASE 6: Start return movement
      const timer6 = setTimeout(() => {
        setIsPreparing(false);
        setIsCurrentlyScrolling(true);
        setIsScrolled(true); // Keep scrolled state during return
      }, returningMovementTime);
      
      // PHASE 7: Approaching home - prepare fade out
      const timer7 = setTimeout(() => {
        setIsScrolled(false); // No longer at end position
        setIsPreparing(true);
      }, approachingHomeTime);
      
      // PHASE 8: End animation cycle
      const timer8 = setTimeout(() => {
        setIsCurrentlyScrolling(false);
        setIsPreparing(false);
        setIsScrolled(false);
      }, endingAnimation);
      
      // Store timers for cleanup
      timerRefs.current = [timer1, timer2, timer3, timer4, timer5, timer6, timer7, timer8];
    };

    oscillatingRef.current.addEventListener('animationstart', handleAnimationStart);
    oscillatingRef.current.addEventListener('animationiteration', handleAnimationStart);

    return () => {
      clearAllTimers();
      if (oscillatingRef.current) {
        oscillatingRef.current.removeEventListener('animationstart', handleAnimationStart);
        oscillatingRef.current.removeEventListener('animationiteration', handleAnimationStart);
      }
    };
  }, [shouldScroll, oscillatingRef.current, speed]);

  // Use speed class based on the prop
  const speedClass = speed === 'artist' ? 'artist-speed' : 'title-speed';

  // CSS variable for the scroll end position
  const cssVars = {
    '--scroll-end': `${scrollEnd}px`
  };

  // Build class names based on current state
  const containerClass = `scrollable-text-container ${className} 
    ${isCurrentlyScrolling ? 'is-scrolling' : ''} 
    ${isPreparing ? 'is-preparing' : ''} 
    ${isScrolled ? 'is-scrolled' : ''}`.replace(/\s+/g, ' ').trim();
  
  const oscillatingClass = `oscillating-text ${speedClass} ${isPreparing ? 'preparing-to-scroll' : ''}`;

  return (
    <div 
      className={containerClass}
      ref={containerRef} 
      style={style}
    >
      {shouldScroll ? (
        // Apply back-and-forth animation when text is too long
        <div className="scrolling-wrapper">
          <div className="scrolling-content">
            <div 
              className={oscillatingClass} 
              key={`oscillating-${text}-${scrollEnd}`}
              ref={oscillatingRef}
              style={cssVars}
            >
              {text}
            </div>
          </div>
        </div>
      ) : (
        // Just display the text normally when it fits
        <div className="scrolling-content" ref={textRef}>
          {text}
        </div>
      )}
    </div>
  );
};

export default ScrollableText; 