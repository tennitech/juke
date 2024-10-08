import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NavigationBar = () => {
  const navbarContentRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (navbarContentRef.current) {
      const activeLink = navbarContentRef.current.querySelector('.active');
      if (activeLink) {
        const navbarWidth = navbarContentRef.current.offsetWidth;
        const activeLinkCenter = activeLink.offsetLeft + activeLink.offsetWidth / 2;
        const offset = navbarWidth / 2 - activeLinkCenter;
        navbarContentRef.current.style.transform = `translateX(${offset}px)`;
      }
    }
  }, [location]);

  return (
    <nav className="navbar">
      <div className="navbar-content" ref={navbarContentRef}>
        <NavLink to="/harmony">Harmony</NavLink>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/library">Library</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </div>
    </nav>
  );
};

export default NavigationBar;