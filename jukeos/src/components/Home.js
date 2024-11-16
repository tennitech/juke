import React, { useContext, useEffect, useState } from 'react';
import { SpotifyAuthContext } from '../contexts/spotify';
import backgroundPng from '../assets/background.png';
import '../App.css';
import { SpotifyAuthContext } from '../contexts/spotify';

function requestUserAuthorization() {  
  const redirectParams = new URLSearchParams({
    scope: [
      "user-read-private",
      "user-read-email",
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-library-read",
      "user-follow-read",
      "user-top-read"
    ].join(" ")
  });
  const redirectUrl = new URL("http://localhost:3001/login/spotify");
  redirectUrl.search = redirectParams.toString();
  
  window.location.href = redirectUrl;
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

      <button onClick={() => requestUserAuthorization()}>Login</button>

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