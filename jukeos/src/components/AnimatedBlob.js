import React, {useEffect, useRef, useState} from 'react';

const AnimatedBlob = ({ colors, style = {}, static: isStatic = false }) => {
  const blobRef = useRef(null);
  const [animatedColors, setAnimatedColors] = useState(colors);

  useEffect(() => {
    if (isStatic) return;
    
    const blob = blobRef.current;
    let time = 0;

    const animate = () => {
      time += 0.02;
      const x = Math.sin(time * 0.7) * 5;
      const y = Math.cos(time * 0.7) * 5;
      const scale = 1 + Math.sin(time * 0.3) * 0.05;

      blob.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

      requestAnimationFrame(animate);
    };

    const animateColors = () => {
      time += 0.001;

      // Generate slight shifts in colors to create a dynamic effect
      const newColors = colors.map((color, index) => {
        const shift = Math.sin(time + index) * 30; // Oscillate color
        return `rgb(${Math.min(255, Math.max(0,  parseInt(color.match(/\d+/g)[0]) + shift))},
                    ${Math.min(255, Math.max(0,  parseInt(color.match(/\d+/g)[1]) + shift))},
                    ${Math.min(255, Math.max(0,  parseInt(color.match(/\d+/g)[2]) + shift))})`;
      });

      setAnimatedColors(newColors);

      requestAnimationFrame(animateColors);
    };

    animateColors();
    animate();
  }, [isStatic,colors]);

  // This is the old
  // radial-gradient(circle at 30% 30%, ${colors[0]} 0%, rgba(255, 255, 255, 0) 70%),
  // radial-gradient(circle at 70% 70%, ${colors[1]} 0%,  rgba(255, 255, 255, 0) 70%)

  const gradientStyle = {
    borderRadius: style.width <= '80px' ? '25px' : '50%',
    background: `
      radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0) 0%, ${animatedColors[0]} 30%, ${animatedColors[1]} 60%, ${animatedColors[2]} 90%)
`,
    filter: 'blur(30px)',
    position: 'absolute',
    zIndex: -1,
    transition: "background 0.5s ease-in-out",
    ...style
  };

  return <div ref={blobRef} style={gradientStyle} />;
};

export default AnimatedBlob;