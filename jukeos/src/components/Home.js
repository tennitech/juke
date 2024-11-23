import React, { useContext, useState } from 'react';
import { PlayerContext } from './Player';
import backgroundPng from '../assets/background.png';
import '../App.css';

const Home = () => {
  const { track, paused, togglePlay } = useContext(PlayerContext);

  const [currentTrack, setCurrentTrack] = useState({
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
          {track?.name|| "Unknown"}
        </h1>

        {/* Artist Name */}
        <h2 style={{ 
          fontFamily: 'Notable, sans-serif',
          fontSize: '2rem',
          margin: '0',
          opacity: 0.9,
          letterSpacing: '3px'
        }}>
          {track?.artists?.map(artist => artist.name)?.join(", ") || "Unknown"}
        </h2>

        {/* Playback Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '40px',
          margin: '20px 0'
        }}>
          <button className="control-button" style={controlButtonStyle}>⏮️</button>
          <button
            className="control-button"
            style={{
              ...controlButtonStyle,
              fontSize: '4rem',
              width: '80px',
              height: '80px'
            }}
            onClick={() => togglePlay()}
          >{
            paused ? "▶️" : "⏸️"
          }</button>
          <button className="control-button" style={controlButtonStyle}>⏭️</button>
        </div>

        {/* Album Art */}
        <img 
          src={track?.album?.images?.[0]?.url || '../assets/default-album-art.png'} 
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
