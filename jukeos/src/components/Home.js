import React, { useContext, useState, useEffect } from 'react';
import { SpotifyAuthContext } from '../contexts/spotify';
import backgroundPng from '../assets/background.png';
import cloudsSvg from '../assets/clouds.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import AnimatedBlob from './AnimatedBlob';
import '../App.css';
import axios from 'axios';

const Home = () => {
  const { accessToken } = useContext(SpotifyAuthContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    title: 'NEW LIGHT',
    artist: 'JOHN MAYER',
    albumArt: '../assets/default-album-art.png',
    progress: 35,
    duration: 100
  });

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = async (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const position = Math.floor(percentage * currentTrack.duration);
    
    try {
      await axios.put(
        'https://api.spotify.com/v1/me/player/seek',
        null,
        {
          params: { position_ms: position * 1000 },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      setCurrentTrack(prev => ({
        ...prev,
        progress: position
      }));
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/player', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.data) {
          setCurrentTrack(prev => ({
            ...prev,
            progress: response.data.progress_ms / 1000,
            duration: response.data.item.duration_ms / 1000
          }));
        }
      } catch (error) {
        console.error('Failed to fetch playback state:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken]);

  return (
    <>
      <img src={cloudsSvg} alt="" className="clouds-main" />
      <img src={cloudsSvg} alt="" className="clouds-small" />
      <div className="player-container" style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        margin: '0 auto',
        marginTop: '50px',
        padding: '40px',
        paddingLeft: '120px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: '40px',
          padding: '0'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '500px'
          }}>
            <h1 style={{ 
              fontFamily: 'Loubag, sans-serif',
              fontSize: '5rem',
              margin: '0',
              textAlign: 'left',
              color: '#ECE0C4',
              textShadow: `
                2px 2px 0 rgba(255,0,0,0.2),
                -2px -2px 0 rgba(0,0,255,0.2),
                1px -1px 0 rgba(255,0,255,0.2)
              `,
              animation: 'textGlitch 3s infinite'
            }}>
              {currentTrack.title}
            </h1>

            <h2 style={{ 
              fontFamily: 'Notable, sans-serif',
              fontSize: '2rem',
              margin: '0',
              opacity: 0.9,
              letterSpacing: '1px',
              color: 'white'
            }}>
              {currentTrack.artist}
            </h2>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '0.8rem',
              color: '#ECE0C4',
              opacity: 0.8,
              marginTop: '5px'
            }}>
              <span>{formatTime(currentTrack.progress)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>

            <div style={{
              width: '100%',
              marginTop: '10px'
            }}>
              <div 
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(236, 224, 196, 0.2)',
                  borderRadius: '2px',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={handleProgressClick}
              >
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

            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '10px',
                width: '80px',
                height: '80px',
                margin: '10px auto'
              }}
            >
              <img 
                src={isPlaying ? pauseIcon : playIcon} 
                alt={isPlaying ? "Pause" : "Play"}
                style={{
                  width: '100%',
                  height: '100%',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease'
                }}
              />
            </button>
          </div>

          <div style={{ 
            position: 'relative', 
            width: '600px',
            height: '600px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AnimatedBlob 
              colors={['#ECE0C4', 'rgba(236, 224, 196, 0.5)']} 
              style={{
                width: '600px',
                height: '600px',
                top: '-20px',
                left: '0'
              }}
              static={true}
            />
            <img 
              src={currentTrack.albumArt} 
              alt="Album Art" 
              style={{
                width: '500px',
                height: '500px',
                borderRadius: '15px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 1
              }} 
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
