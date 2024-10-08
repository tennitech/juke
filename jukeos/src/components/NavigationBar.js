import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import spotlightPng from '../assets/spotlight.png';

const NavigationBar = () => {
  const navbarContentRef = useRef(null);
  const location = useLocation();
  const [animationInProgress, setAnimationInProgress] = useState(false);

  useEffect(() => {
    if (navbarContentRef.current && !animationInProgress) {
      const activeLink = navbarContentRef.current.querySelector('.active');
      if (activeLink) {
        setAnimationInProgress(true);
        const navbarWidth = navbarContentRef.current.offsetWidth;
        const activeLinkCenter = activeLink.offsetLeft + activeLink.offsetWidth / 2;
        const offset = navbarWidth / 2 - activeLinkCenter;
        
        navbarContentRef.current.style.transform = `translateX(${offset * 1.2}px)`;
        setTimeout(() => {
          navbarContentRef.current.style.transform = `translateX(${offset}px)`;
          setAnimationInProgress(false);
        }, 500);

        // Apply blur effect
        const links = navbarContentRef.current.querySelectorAll('a');
        links.forEach((link) => {
          const linkCenter = link.offsetLeft + link.offsetWidth / 2;
          const distance = Math.abs(activeLinkCenter - linkCenter);
          if (distance > navbarWidth / 4) {
            link.classList.add('blur');
          } else {
            link.classList.remove('blur');
          }
        });
      }
    }
  }, [location]);

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
        className="spotlight"
      />
    </>
  );
};

export default NavigationBar;