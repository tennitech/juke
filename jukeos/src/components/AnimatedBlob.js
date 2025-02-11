import React, { useEffect, useRef } from 'react';

const AnimatedBlob = ({ colors, style = {}, static: isStatic = false }) => {
  const blobRef = useRef(null);

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

    animate();
  }, [isStatic]);

  // This is the old
  // radial-gradient(circle at 30% 30%, ${colors[0]} 0%, rgba(255, 255, 255, 0) 70%),
  // radial-gradient(circle at 70% 70%, ${colors[1]} 0%,  rgba(255, 255, 255, 0) 70%)

  const gradientStyle = {
    borderRadius: style.width === '600px' ? '25px' : '50%',
    background: `
      radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0) 0%, ${colors[0]} 30%,${colors[1]} 60%,${colors[2]} 90%)
`,
    filter: 'blur(30px)',
    position: 'absolute',
    zIndex: -1,
    ...style
  };

  return <div ref={blobRef} style={gradientStyle} />;
};

export default AnimatedBlob;