import React, { useEffect, useState, useRef } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import backgroundPng from '../assets/background.png';
import { NavLink, useLocation } from 'react-router-dom';
import '../App.css';

const spotifyApi = new SpotifyWebApi();

const Home = () => {
  const [playlists, setPlaylists] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));
  const navbarContentRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      setToken(accessToken);
      spotifyApi.setAccessToken(accessToken);
      fetchPlaylists();
      window.location.hash = '';
    } else if (token) {
      spotifyApi.setAccessToken(token);
      fetchPlaylists();
    }
  }, [token]);

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

  const fetchPlaylists = async () => {
    try {
      const data = await spotifyApi.getUserPlaylists();
      console.log('Fetched playlists:', data);
      setPlaylists(data.items);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/login';
  };

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <nav className="navbar">
        <div className="navbar-content" ref={navbarContentRef}>
          <NavLink to="/harmony" activeClassName="active">Harmony</NavLink>
          <NavLink to="/" exact activeClassName="active">Home</NavLink>
          <NavLink to="/library" activeClassName="active">Library</NavLink>
          <NavLink to="/settings" activeClassName="active">Settings</NavLink>
        </div>
      </nav>
      <div>
        <h1>Your Playlists</h1>
        {playlists.length ? (
          <ul>
            {playlists.map((playlist) => (
              <li key={playlist.id}>{playlist.name}</li>
            ))}
          </ul>
        ) : (
          <button onClick={handleLogin}>Login with Spotify</button>
        )}
      </div>
    </div>
  );
};

export default Home;