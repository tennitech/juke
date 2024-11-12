import React, { useContext, useEffect, useState } from 'react';
import backgroundPng from '../assets/background.png';
import '../App.css';

import { SpotifyAuthContext, performFetch } from '../contexts/spotify';

function requestUserAuthorization() {  
  const redirectParams = new URLSearchParams({
    scope: [
      "user-read-private",
      "user-read-email",
      "playlist-read-private",
      "playlist-read-collaborative"
    ].join(" ")
  });
  const redirectUrl = new URL("http://localhost:3001/login/spotify");
  redirectUrl.search = redirectParams.toString();
  
  window.location.href = redirectUrl;
}

function PlaylistList() {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (accessToken) {
      performFetch(
        "https://api.spotify.com/v1/me/playlists", {},
        accessToken, invalidateAccess
      )
        .then((playlists) => {
          setPlaylists(playlists?.items || []);
        })
        .catch((error) => {
          console.log("Error", error);

          setPlaylists([]);
        });
    }
  }, [accessToken]);

  return <>
    <h1>Your Playlists</h1>
    <button onClick={() => invalidateAccess()}>Invalidate</button>
    <ul>
      {
        playlists.map((playlist) =>
          <li key={playlist.id}>{playlist.name}</li>
        )
      }
    </ul>
  </>;
}

const Home = () => {
  const { accessToken } = useContext(SpotifyAuthContext);
  const [currentTrack, setCurrentTrack] = useState({
    title: 'NEW LIGHT',
    artist: 'JOHN MAYER',
    albumArt: 'path/to/album-art.png', // Replace with actual path
  });

  useEffect(() => {
    // Fetch current track and recently played tracks from Spotify API
    // setCurrentTrack with actual data
  }, [accessToken]);

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px',
      color: '#ECE0C4',
      textAlign: 'center',
    }}>
      <div style={{ marginTop: '100px' }}>
        <h1 style={{ fontSize: '4rem', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
          {currentTrack.title}
        </h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>
          {currentTrack.artist}
        </h2>
        <div>
          <button style={{ margin: '0 10px' }}>⏮️</button>
          <button style={{ margin: '0 10px' }}>⏯️</button>
          <button style={{ margin: '0 10px' }}>⏭️</button>
        </div>
        <img src={currentTrack.albumArt} alt="Album Art" style={{
          width: '200px',
          height: '200px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          marginTop: '20px'
        }} />
      </div>
      <div style={{ marginTop: '50px' }}>
        <h3 style={{ fontSize: '2rem', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
          RECENTLY PLAYED
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          {/* Map over recently played tracks */}
          <img src="path/to/recent1.png" alt="Recent 1" style={{ width: '100px', height: '100px' }} />
          <img src="path/to/recent2.png" alt="Recent 2" style={{ width: '100px', height: '100px' }} />
          <img src="path/to/recent3.png" alt="Recent 3" style={{ width: '100px', height: '100px' }} />
          <img src="path/to/recent4.png" alt="Recent 4" style={{ width: '100px', height: '100px' }} />
        </div>
      </div>
    </div>
  );
};

export default Home;
