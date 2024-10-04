import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import backgroundPng from '../assets/background.png';
import '../App.css';

const spotifyApi = new SpotifyWebApi();

const Settings = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));

  useEffect(() => {
    if (token) {
      spotifyApi.setAccessToken(token);
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const data = await spotifyApi.getMe();
      console.log('Fetched user profile:', data);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div>
        <h1>Settings</h1>
        {user ? (
          <div>
            <p>Logged in as: {user.display_name}</p>
            <p>Email: {user.email}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <p>Loading user information...</p>
        )}
      </div>
    </div>
  );
};

export default Settings;