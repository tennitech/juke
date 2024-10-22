import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import spotlightPng from '../assets/spotlight.png';
import AnimatedBlob from './AnimatedBlob';
import ColorThief from 'color-thief-browser';

const NavigationBar = () => {
  const navbarContentRef = useRef(null);
  const location = useLocation();
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const [isFlickering, setIsFlickering] = useState(false);
  const [dominantColors, setDominantColors] = useState(['#4CAF50', '#2196F3']);

  const extractDominantColors = (imageSrc) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, 2);
      setDominantColors(palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`));
    };
  };

  useEffect(() => {
    extractDominantColors(require('../assets/default-user-profile-image.svg').default);
  }, []);

  useEffect(() => {
    if (navbarContentRef.current && !animationInProgress) {
      const activeLink = navbarContentRef.current.querySelector('.active');
      if (activeLink) {
        setAnimationInProgress(true);
        setIsFlickering(true);
        const navbarWidth = navbarContentRef.current.offsetWidth;
        const activeLinkCenter = activeLink.offsetLeft + activeLink.offsetWidth / 2;
        const offset = navbarWidth / 2 - activeLinkCenter;
        
        navbarContentRef.current.style.transition = 'transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        navbarContentRef.current.style.transform = `translateX(${offset}px)`;
        
        setTimeout(() => {
          setAnimationInProgress(false);
          setIsFlickering(false);
        }, 800);

        // Apply blur effect with transition
        const links = navbarContentRef.current.querySelectorAll('a');
        links.forEach((link) => {
          const linkCenter = link.offsetLeft + link.offsetWidth / 2;
          const distance = Math.abs(activeLinkCenter - linkCenter);
          link.style.transition = 'filter 800ms cubic-bezier(0.34, 1.56, 0.64, 1)';
          if (distance > navbarWidth / 4) {
            link.style.filter = 'blur(2px)';
          } else {
            link.style.filter = 'blur(0px)';
          }
        });
      }
    }
  }, [location, animationInProgress]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-blur-container">
          <div className="navbar-content" ref={navbarContentRef}>
            <NavLink to="/harmony">Harmony</NavLink>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/library">Library</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </div>
        </div>
      </nav>
      <img
        src={spotlightPng}
        alt="Spotlight"
        className={`spotlight ${isFlickering ? 'flicker' : ''}`}
      />
      <div className="user-profile-container">
        <div style={{ position: 'relative' }}>
          <AnimatedBlob colors={dominantColors} />
          <img
            src={require('../assets/default-user-profile-image.svg').default}
            alt="User Profile"
            className="user-profile-image"
            onLoad={(e) => extractDominantColors(e.target.src)}
          />
        </div>
      </div>
    </>
  );
};

export default NavigationBar;
