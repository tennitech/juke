import React, { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import backgroundPng from '../assets/background.png';
import '../App.css';

const spotifyApi = new SpotifyWebApi();

const Library = () => {
  const [savedTracks, setSavedTracks] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));

  useEffect(() => {
    if (token) {
      spotifyApi.setAccessToken(token);
      fetchSavedTracks();
    }
  }, [token]);

  const fetchSavedTracks = async () => {
    try {
      const data = await spotifyApi.getMySavedTracks();
      console.log('Fetched saved tracks:', data);
      setSavedTracks(data.items);
    } catch (error) {
      console.error('Error fetching saved tracks:', error);
    }
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
        <h1>Your Library</h1>
        {savedTracks.length ? (
          <ul>
            {savedTracks.map((item) => (
              <li key={item.track.id}>{item.track.name} - {item.track.artists[0].name}</li>
            ))}
          </ul>
        ) : (
          <p>Loading your saved tracks...</p>
        )}
      </div>
    </div>
  );
};

export default Library;