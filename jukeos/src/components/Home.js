import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../services/spotify';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

const Home = () => {
  const [playlists, setPlaylists] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          const token = await getAuthToken(code); // Get the access token using the code
          console.log('Fetched token:', token);
          spotifyApi.setAccessToken(token);
          const data = await spotifyApi.getUserPlaylists();
          console.log('Fetched playlists:', data);
          setPlaylists(data);
        } catch (error) {
          console.error('Error fetching playlists:', error);
          setError(new Error(`An error occurred: ${JSON.stringify(error, null, 2)}`));
        }
      }
    };

    fetchData();
  }, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/login';
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!playlists) {
    return <button onClick={handleLogin}>Login with Spotify</button>;
  } else {
    return (
      <div>
        <h1>Your Playlists</h1>
        <ul>
          {playlists.items.map((playlist) => (
            <li key={playlist.id}>{playlist.name}</li>
          ))}
        </ul>
      </div>
    );
  }
};

export default Home;
