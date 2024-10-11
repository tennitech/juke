import React, { useEffect, useRef } from 'react';

const AnimatedBlob = ({ colors }) => {
  const blobRef = useRef(null);

  useEffect(() => {
    const blob = blobRef.current;
    let time = 0;

    const animate = () => {
      time += 0.02; // Increase this value to speed up the animation
      const x = Math.sin(time * 0.7) * 5; // Reduced from 10 to 5
      const y = Math.cos(time * 0.7) * 5; // Reduced from 10 to 5
      const scale = 1 + Math.sin(time * 0.3) * 0.05; // Reduced from 0.1 to 0.05

      blob.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const gradientStyle = {
    width: '80px', // Reduced from 100px to 80px
    height: '80px', // Reduced from 100px to 80px
    borderRadius: '50%',
    background: `
      radial-gradient(circle at 30% 30%, ${colors[0]} 0%, rgba(255, 255, 255, 0) 70%),
      radial-gradient(circle at 70% 70%, ${colors[1]} 0%, rgba(255, 255, 255, 0) 70%)
    `,
    filter: 'blur(15px)',
    position: 'absolute',
    top: '-15px', // Adjusted from -25px to -15px
    left: '-15px', // Adjusted from -25px to -15px
    zIndex: -1,
  };

  return <div ref={blobRef} style={gradientStyle} />;
};

export default AnimatedBlob;
