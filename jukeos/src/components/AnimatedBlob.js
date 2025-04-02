import React, {useEffect, useRef, useState} from 'react';

// Helper to parse color and extract RGB values safely
const parseColor = (color) => {
  if (!color) return { r: 150, g: 150, b: 150 }; // Default gray
  
  // If it's a hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      // #RGB format
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    } else if (hex.length === 6) {
      // #RRGGBB format
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    }
  }
  
  // If it's rgb/rgba format
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return {
      r: parseInt(rgbMatch[0]),
      g: parseInt(rgbMatch[1]),
      b: parseInt(rgbMatch[2])
    };
  }
  
  // Fallback to default
  return { r: 150, g: 150, b: 150 };
};

// Check if colors are primarily white/gray (for post-speech pulsing)
const isPredominantlyWhite = (colors) => {
  if (!Array.isArray(colors) || colors.length === 0) return false;
  
  // Check if the first color is whitish
  const firstColor = parseColor(colors[0]);
  const isWhitish = firstColor.r > 220 && firstColor.g > 220 && firstColor.b > 220;
  
  return isWhitish;
};

// Check if colors are primarily red (for speech visualization)
const isPredominantlyRed = (colors) => {
  if (!Array.isArray(colors) || colors.length === 0) return false;
  
  // Check if the first color is reddish
  const firstColor = parseColor(colors[0]);
  return firstColor.r > 180 && firstColor.g < 150 && firstColor.b < 150;
};

const AnimatedBlob = ({ colors, style = {}, static: isStatic = false, speed = 1, voiceLevel = 0 }) => {
  const blobRef = useRef(null);
  const [animatedColors, setAnimatedColors] = useState(
    Array.isArray(colors) && colors.length > 0 ? colors : ['rgb(150,150,150)', 'rgb(200,200,200)', 'rgb(170,170,170)']
  );

  useEffect(() => {
    // Ensure colors is always a valid array
    const safeColors = Array.isArray(colors) && colors.length > 0 ? 
      colors : ['rgb(150,150,150)', 'rgb(200,200,200)', 'rgb(170,170,170)'];
    
    if (isStatic) {
      setAnimatedColors(safeColors);
      return;
    }
    
    const blob = blobRef.current;
    let time = 0;
    
    // Determine animation mode based on colors
    const isWhiteMode = isPredominantlyWhite(safeColors);
    const isRedMode = isPredominantlyRed(safeColors);

    const animate = () => {
      // Adjust animation speed and intensity based on mode
      const speedMultiplier = isWhiteMode ? 1.5 : 1;
      
      time += 0.02 * speed * speedMultiplier;
      
      // More pronounced animation for white/pulsing mode
      let x, y, scale;
      
      if (isWhiteMode) {
        // Faster, more energetic animation for white/post-speech state
        x = Math.sin(time * 1.2) * 8;
        y = Math.cos(time * 1.2) * 8;
        scale = 1 + Math.sin(time * 0.8) * 0.1; // More pronounced scale change
      } else if (isRedMode) {
        // Voice-reactive animation for red/recording state
        // Use voiceLevel if available, otherwise use gentle animation
        const intensityFactor = Math.min(1, Math.max(0.2, voiceLevel || 0.3));
        x = Math.sin(time * 0.7) * 5 * intensityFactor;
        y = Math.cos(time * 0.7) * 5 * intensityFactor;
        scale = 1 + (Math.sin(time * 0.3) * 0.05) + (intensityFactor * 0.05);
      } else {
        // Default gentle animation
        x = Math.sin(time * 0.7) * 5;
        y = Math.cos(time * 0.7) * 5;
        scale = 1 + Math.sin(time * 0.3) * 0.05;
      }

      if (blob) {
        blob.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      }

      requestAnimationFrame(animate);
    };

    const animateColors = () => {
      // Adjust color animation speed based on mode
      const colorSpeedMultiplier = isWhiteMode ? 2.5 : (isRedMode ? 1.8 : 1);
      time += 0.0005 * speed * colorSpeedMultiplier;

      try {
        // Generate slight shifts in colors to create a dynamic effect with safety
        const newColors = safeColors.map((color, index) => {
          const colorObj = parseColor(color);
          
          let shift;
          if (isWhiteMode) {
            // More dramatic pulsing for white mode
            shift = Math.sin(time * 2 + index) * 35;
          } else if (isRedMode) {
            // Voice-reactive shifts for red mode
            // Create two different red variants
            const baseShift = Math.sin(time * 1.5 + index) * 40;
            const intensityFactor = voiceLevel || 0.5;
            shift = baseShift * (1 + intensityFactor);
            
            // For red mode, we adjust different components differently to create variety
            // First color gets more red variation
            if (index === 0) {
              return `rgb(${Math.min(255, Math.max(180, colorObj.r + Math.floor(shift * 0.3)))},
                          ${Math.min(120, Math.max(30, colorObj.g + Math.floor(shift * 0.1)))},
                          ${Math.min(100, Math.max(30, colorObj.b + Math.floor(shift * 0.1)))})`;
            } 
            // Second color gets deeper, more crimson variation
            else if (index === 1) {
              return `rgb(${Math.min(220, Math.max(150, colorObj.r + Math.floor(shift * 0.2)))},
                          ${Math.min(80, Math.max(20, colorObj.g + Math.floor(shift * 0.15)))},
                          ${Math.min(90, Math.max(20, colorObj.b + Math.floor(shift * 0.1)))})`;
            }
          } else {
            // Normal subtle shifts for default mode
            shift = Math.sin(time + index) * 30;
          }
          
          return `rgb(${Math.min(255, Math.max(0, colorObj.r + Math.floor(shift)))},
                     ${Math.min(255, Math.max(0, colorObj.g + Math.floor(shift)))},
                     ${Math.min(255, Math.max(0, colorObj.b + Math.floor(shift)))})`;
        });

        setAnimatedColors(newColors);
      } catch (error) {
        console.error("Error animating colors:", error);
        // Use fallback colors if there's an error
        setAnimatedColors(['rgb(150,150,150)', 'rgb(200,200,200)', 'rgb(170,170,170)']);
      }

      requestAnimationFrame(animateColors);
    };

    animateColors();
    animate();
    
    return () => {
      // Cleanup
      if (blob) {
        blob.style.transform = '';
      }
    };
  }, [isStatic, colors, speed, voiceLevel]);

  // Ensure we have at least 3 colors for the gradient
  const safeAnimatedColors = animatedColors.length >= 3 ? 
    animatedColors : 
    [...animatedColors, ...['rgb(150,150,150)', 'rgb(200,200,200)', 'rgb(170,170,170)']].slice(0, 3);

  // Determine if we're in white/pulsing mode for enhanced glow
  const isWhiteMode = isPredominantlyWhite(colors);
  const isRedMode = isPredominantlyRed(colors);
  
  // Create extra glow effect for white mode
  const extraGlow = isWhiteMode ? '0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 255, 255, 0.4)' : 
                   (isRedMode ? '0 0 30px rgba(255, 50, 50, 0.6)' : '');

  const gradientStyle = {
    borderRadius: style.width <= '80px' ? '25px' : '25%',
    background: `
      radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0) 0%, ${safeAnimatedColors[0]} 30%, ${safeAnimatedColors[1]} 60%, ${safeAnimatedColors[2]} 90%)
    `,
    filter: 'blur(30px)',
    position: 'absolute',
    zIndex: -1,
    transition: "background 0.5s ease-in-out, box-shadow 0.5s ease-in-out",
    boxShadow: extraGlow,
    ...style
  };

  return <div ref={blobRef} style={gradientStyle} />;
};

export default AnimatedBlob;