import React, { useContext, useEffect, useState } from 'react';
import { SpotifyAuthContext } from '../contexts/spotify';
import backgroundPng from '../assets/background.png';
import '../App.css';
import axios from 'axios';
import { SpotifyAuthContext } from '../contexts/spotify';


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

async function fetchPlaylists(accessToken) {
  const response = await axios.get(
    "https://api.spotify.com/v1/me/playlists",
    {
      headers: {
        "Authorization": "Bearer " + accessToken
      }
    }
  );

  return response?.data?.items;
}

function PlaylistList() {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists(accessToken)
        .then((playlists) => {
          setPlaylists(playlists);
        })
        .catch((error) => {
          console.log("Error", error);

          invalidateAccess();
        });
    }
  }, [accessToken]);

  return <>
    <h1>Your Playlists</h1>
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
    albumArt: '../assets/default-album-art.png',
    progress: 35,
    duration: 100
  });

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px',
      color: '#ECE0C4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="player-container" style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px'
      }}>
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          padding: '0 20px'
        }}>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(236, 224, 196, 0.2)',
            borderRadius: '2px',
            position: 'relative',
            cursor: 'pointer'
          }}>
            <div style={{
              width: `${(currentTrack.progress / currentTrack.duration) * 100}%`,
              height: '100%',
              backgroundColor: '#ECE0C4',
              borderRadius: '2px',
              position: 'absolute',
              transition: 'width 0.1s linear'
            }} />
          </div>
        </div>

        {/* Song Title */}
        <h1 className="glow" style={{ 
          fontFamily: 'Loubag, sans-serif',
          fontSize: '5rem',
          margin: '10px 0 0 0',
          textAlign: 'center'
        }}>
          {currentTrack.title}
        </h1>

        {/* Artist Name */}
        <h2 style={{ 
          fontFamily: 'Notable, sans-serif',
          fontSize: '2rem',
          margin: '0',
          opacity: 0.9,
          letterSpacing: '3px'
        }}>
          {currentTrack.artist}
        </h2>

        {/* Playback Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '40px',
          margin: '20px 0'
        }}>
          <button className="control-button" style={controlButtonStyle}>⏮️</button>
          <button className="control-button" style={{
            ...controlButtonStyle,
            fontSize: '4rem',
            width: '80px',
            height: '80px'
          }}>⏯️</button>
          <button className="control-button" style={controlButtonStyle}>⏭️</button>
        </div>

        {/* Album Art */}
        <img 
          src={currentTrack.albumArt} 
          alt="Album Art" 
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }} 
        />
      </div>
    </div>
  );
};

const controlButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#ECE0C4',
  fontSize: '2.5rem',
  cursor: 'pointer',
  width: '60px',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.2s ease, opacity 0.2s ease',
  padding: 0,
  opacity: 0.8,
  ':hover': {
    transform: 'scale(1.1)',
    opacity: 1
  }
};

export default Home;