import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SpotifyAuthContext, performFetch } from '../contexts/spotify';
import ColorThief from 'color-thief-browser';
import {PlayerContext} from "./Player";
import defaultAlbumArt from "../assets/default-art-placeholder.svg";

const NavigationBar = () => {
  const navbarContentRef = useRef(null);
  const location = useLocation();
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const [dominantRGBA,setDominantRGBA] = useState("");
  const {accessToken, invalidateAccess} = useContext(SpotifyAuthContext);
  const [profilePicture, setProfilePicture] = useState(require("../assets/default-user-profile-image.svg").default);
  const navigate = useNavigate();
  const { track} = useContext(PlayerContext);

  //Same function as useColorThief
  //TODO useColorThief instead of logic in component
  const extractDominantColors = (imageSrc) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, 2);
      //Set two different RGB formats.
      setDominantRGBA(palette.map(color => `rgba(${color[0]}, ${color[1]}, ${color[2]},0.9)`));
      //TODO Further investigate color scaling so it matches the background better
    };
  };
  useEffect(() => {
    extractDominantColors(track?.album?.images[0]?.url || defaultAlbumArt)
  }, [track]);


  useEffect(() => {
    if (navbarContentRef.current && !animationInProgress) {
      const activeLink = navbarContentRef.current.querySelector('.active');
      if (activeLink) {
        setAnimationInProgress(true);
        const navbarWidth = navbarContentRef.current.offsetWidth;
        const activeLinkCenter = activeLink.offsetLeft + activeLink.offsetWidth / 2;
        const offset = navbarWidth / 2 - activeLinkCenter;

        navbarContentRef.current.style.transition = 'transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        navbarContentRef.current.style.transform = `translateX(${offset}px)`;

        setTimeout(() => {
          setAnimationInProgress(false);
        }, 800);

        // Update profile container position
        const profileContainer = document.querySelector('.user-profile-container');
        if (profileContainer) {
          if (location.pathname === '/profile') {
            profileContainer.classList.add('profile-active');
          } else {
            profileContainer.classList.remove('profile-active');
          }
        }

        // Get all links and find the leftmost and rightmost positions
        const links = Array.from(navbarContentRef.current.querySelectorAll('a'));
        const leftmostLink = links[0];
        const rightmostLink = links[links.length - 1];
        const leftEdge = leftmostLink.offsetLeft;
        const rightEdge = rightmostLink.offsetLeft + rightmostLink.offsetWidth;
        const totalWidth = rightEdge - leftEdge;

        // Apply progressive blur effect
        links.forEach((link) => {
          const linkCenter = link.offsetLeft + link.offsetWidth / 2;
          const distance = Math.abs(activeLinkCenter - linkCenter);
          const normalizedDistance = distance / (totalWidth / 2); // Value between 0 and 1
          link.style.transition = 'filter 800ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 800ms cubic-bezier(0.34, 1.56, 0.64, 1)';
          // More subtle blur calculation
          const blurAmount = Math.pow(normalizedDistance, 2) * 2; // Reduced max blur and made more gradual
          const opacity = Math.max(0.4, 1 - Math.pow(normalizedDistance, 1.5)); // Minimum opacity of 0.4
          link.style.filter = `blur(${blurAmount}px)`;
          link.style.opacity = opacity;
        });
      }
    }
  }, [location, animationInProgress]);

  useEffect(() => {
    if (accessToken) {
      loadProfilePicture(accessToken, invalidateAccess);
    }
  }, [accessToken]);

  /* 
    This pulls the current user's profile picture from Spotify. If it cannot pull any profile 
    pictures, it will use the default profile picture asset, that is saved in `../assets`.

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
  */
  const loadProfilePicture = (accessToken, invalidateAccess) => {
    if (!accessToken) {
      console.log("Access Token not defined!");
      return;
    }

    performFetch("https://api.spotify.com/v1/me", {}, accessToken, invalidateAccess).then((response) => {
      if (response?.images?.length > 0) {
        setProfilePicture(response.images[0].url);
        console.log(profilePicture);
      }
    }).catch((error) => {
      console.log("Error in fetchProfilePicture in NavigationBar.js", error)
    });
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-blur-container">
          <div className="navbar-content" ref={navbarContentRef}>
            {['/harmony', '/', '/library', '/settings'].map((path, index) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    style={({ isActive }) =>
                        isActive
                            ? {
                              color: '#ECE0C4',
                              textShadow: `0 0 20px ${dominantRGBA[0]}, 0 0 25px ${dominantRGBA[1]}, 0 0 35px ${dominantRGBA[2]}`
                            }
                            : {}
                    }
                >
                  {path.replace('/', '') || 'Home'}
                </NavLink>
            ))}
            <NavLink to="/profile" className="profile-link">Profile</NavLink>
          </div>
        </div>
      </nav>
      {/*<img*/}
      {/*  src={spotlightPng}*/}
      {/*  alt="Spotlight"*/}
      {/*  className={`spotlight ${isFlickering ? 'flicker' : ''}`}*/}
      {/*/>*/}
      <div className="user-profile-container">
          <img
            src={profilePicture}
            alt="User Profile"
            className="user-profile-image"
            onClick={() => navigate('/profile')}
          />
      </div>
    </>
  );
};


export default NavigationBar;
