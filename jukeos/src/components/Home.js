import React, { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

const Home = () => {
  const [playlists, setPlaylists] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      setToken(accessToken);
      spotifyApi.setAccessToken(accessToken);
      fetchPlaylists();
      // Clear the hash from the URL
      window.location.hash = '';
    } else if (token) {
      spotifyApi.setAccessToken(token);
      fetchPlaylists();
    }
  }, [token]);

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
  );
};

export default Home;
