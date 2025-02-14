import React, { useContext, useState, useEffect, useRef } from 'react';
import { SpotifyAuthContext, performFetch } from '../contexts/spotify';
import { PlayerContext } from './Player';
import axios from 'axios';
import defaultAlbumArt from '../assets/default-art-placeholder.svg';
import '../App.css';
import AnimatedBlob from './AnimatedBlob';
import cloudsSvg from '../assets/clouds.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import previousIcon from '../assets/skip-backward-icon.svg';
import nextIcon from '../assets/skip-forward-icon.svg';

const ScrollWheel = ({ items, isMobile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [centerIndex, setCenterIndex] = useState(0);
  const wheelRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - wheelRef.current.offsetLeft);
    setScrollLeft(wheelRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Snap to nearest item
    if (wheelRef.current) {
      const itemWidth = isMobile ? 60 : 120; // Width + gap
      const scrollPosition = wheelRef.current.scrollLeft;
      const newIndex = Math.round(scrollPosition / itemWidth);
      setCenterIndex(newIndex);
      wheelRef.current.scrollTo({
        left: newIndex * itemWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - wheelRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    wheelRef.current.scrollLeft = scrollLeft - walk;
    
    // Update center index while dragging
    const itemWidth = isMobile ? 60 : 120;
    const currentIndex = Math.round(wheelRef.current.scrollLeft / itemWidth);
    setCenterIndex(currentIndex);
  };

  return (
    <div 
      className="scroll-wheel-container"
      ref={wheelRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="scroll-wheel-track">
        {items.map((item, index) => {
          const distance = Math.abs(index - centerIndex);
          const scale = Math.max(0.6, 1 - (distance * 0.2));
          const opacity = Math.max(0.3, 1 - (distance * 0.3));
          
          return (
            <div 
              key={index} 
              className="scroll-wheel-item"
              style={{
                transform: `scale(${scale})`,
                opacity: opacity,
                transition: 'all 0.3s ease'
              }}
            >
              <img 
                src={item.imageUrl || defaultAlbumArt}
                alt={item.title}
                style={{
                  width: isMobile ? '60px' : '100px',
                  height: isMobile ? '60px' : '100px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const Home = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);
  const { track, paused, playUri, togglePlay, previousTrack, nextTrack } = useContext(PlayerContext);
  const [currentTrack, setCurrentTrack] = useState({
    progress: 0,
    duration: 1
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [recentlyPlayedError, setRecentlyPlayedError] = useState(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  /**
   * Backend Requirements for Recently Played Tracks:
   * 
   * This frontend code calls Spotify's /me/player/recently-played endpoint which requires:
   * 1. A valid Spotify access token in the Authorization header
   * 2. Returns up to 20 most recently played tracks
   * 
   * Backend Team Needs to:
   * - Implement token refresh mechanism to ensure valid access tokens
   * - Consider caching recently played tracks to reduce API calls
   * - Handle rate limiting (Spotify allows 1 request/sec)
   * - Implement error handling for expired/invalid tokens
   * - Consider implementing a proxy endpoint to hide Spotify credentials
   *   Example: /api/recently-played instead of calling Spotify directly
   * 
   * Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-recently-played
   */
  const fetchRecentlyPlayed = () => {
    if (accessToken) {
      setIsLoadingRecent(true);

      performFetch("https://api.spotify.com/v1/me/player/recently-played", { limit: 10 }, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched recently played:", response);

          if (response && response.items) {
            // Transform the data to match our UI needs
            const transformedTracks = response.items
              .filter((item) => item && item.track && item.track.album)
              .map((item) => ({
                id: item.track.id,
                title: item.track.name,
                artist: item.track.artists[0].name,
                imageUrl: item.track.album.images[0]?.url || defaultAlbumArt,
                playedAt: new Date(item.played_at),
                // Add any additional track data you need
                albumName: item.track.album.name,
                duration: item.track.duration_ms,
                uri: item.track.uri
              }))
              .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())

            setRecentlyPlayed(transformedTracks);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch recently played:", error);
          setRecentlyPlayedError(error);
        })
        .finally(() => {
          setIsLoadingRecent(false);
        });
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchRecentlyPlayed();

      // Optional: Set up polling to keep recently played list updated
      const pollInterval = setInterval(fetchRecentlyPlayed, 30000); // 30 seconds

      return () => clearInterval(pollInterval);
    }
  }, [accessToken]);

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

  useEffect(() => {
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth <= 768);
    }, 250); // 250ms debounce

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="home-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '120px 5vw 40px 5vw'
    }}>
      <img src={cloudsSvg} alt="" className="clouds-main" />
      <img src={cloudsSvg} alt="" className="clouds-small" />
      <div className="player-container" style={{
        width: '100%',
        maxWidth: '1400px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        padding: isMobile ? '1vh 4vw' : '2vh 6vw',
        position: 'relative',
        gap: '4vw'
      }}>
        {/* Left side - Track Info and Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: isMobile ? '100%' : '65%',
          order: 1,
          alignItems: 'center',
          gap: '1vh'
        }}>
          {/* Track Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5vh',
            width: '100%',
            alignItems: 'center'
          }}>
            <h1 style={{ 
              fontFamily: 'Loubag, sans-serif',
              fontSize: 'clamp(3rem, 6vw, 7rem)',
              margin: '0',
              textAlign: 'center',
              color: '#ECE0C4',
              lineHeight: 1
            }}>
              {track?.name || "Unknown"}
            </h1>

            <h2 style={{ 
              fontFamily: 'Notable, sans-serif',
              fontSize: 'clamp(1.2rem, 3vw, 2.5rem)',
              margin: '0',
              marginTop: '0.2vh',
              opacity: 0.9,
              letterSpacing: '1px',
              color: 'white',
              textAlign: 'center'
            }}>
              {track?.artists?.map(artist => artist.name)?.join(", ") || "Unknown"}
            </h2>

            {/* Progress bar */}
            <div style={{
              width: '80%',
              margin: '0.5vh auto',
              padding: '5px 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                fontSize: '1rem',
                color: '#ECE0C4',
                opacity: 0.8,
                marginTop: '5px'
              }}>
                <span>{formatTime(currentTrack.progress)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>

              <div 
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(236, 224, 196, 0.2)',
                  borderRadius: '3px',
                  position: 'relative',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
                onClick={handleProgressClick}
              >
                <div style={{
                  width: `${(currentTrack.progress / currentTrack.duration) * 100}%`,
                  height: '100%',
                  backgroundColor: '#ECE0C4',
                  borderRadius: '3px',
                  position: 'absolute',
                  transition: 'width 0.1s linear'
                }} />
              </div>
            </div>

            {/* Playback Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '20px' : '30px',
              marginTop: '0.5vh'
            }}>
              <button 
                onClick={previousTrack}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '15px',
                  width: '80px',
                  height: '80px'
                }}
              >
                <img 
                  src={previousIcon} 
                  alt="Previous"
                  style={{
                    width: '100%',
                    height: '100%',
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease'
                  }}
                />
              </button>

              <button 
                onClick={togglePlay}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '15px',
                  width: '100px',
                  height: '100px'
                }}
              >
                <img 
                  src={paused ? playIcon : pauseIcon} 
                  alt={paused ? "Play" : "Pause"}
                  style={{
                    width: '100%',
                    height: '100%',
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease'
                  }}
                />
              </button>

              <button 
                onClick={nextTrack}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '15px',
                  width: '80px',
                  height: '80px'
                }}
              >
                <img 
                  src={nextIcon} 
                  alt="Next"
                  style={{
                    width: '100%',
                    height: '100%',
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Recently Played Section */}
          <div style={{
            width: '100%',
            marginTop: '1vh',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{
              fontFamily: 'Loubag, sans-serif',
              fontSize: 'clamp(2.5rem, 4vw, 4.5rem)',
              color: '#FFC764',
              letterSpacing: '3px',
              marginBottom: '0.5vh',
              textAlign: 'center'
            }}>
              RECENTLY PLAYED
            </h3>
            <ScrollWheel items={recentlyPlayed} isMobile={isMobile} />
          </div>
        </div>

        {/* Right side - Album Art */}
        <div style={{ 
          position: 'relative',
          width: isMobile ? '60%' : '35%',
          maxWidth: isMobile ? '300px' : '400px',
          height: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          order: isMobile ? 0 : 2,
          marginBottom: isMobile ? '2vh' : 0,
          alignSelf: 'flex-start',
          marginTop: isMobile ? '0' : 'calc(0.6em)'
        }}>
          <AnimatedBlob 
            colors={['#ECE0C4', 'rgba(236, 224, 196, 0.5)']} 
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: '-2%',
              left: '0'
            }} 
            static={true}
          />
          <img 
            src={track?.album?.images?.[0]?.url || defaultAlbumArt} 
            alt="Album Art" 
            style={{
              width: '100%',
              aspectRatio: '1/1',
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              position: 'relative',
              zIndex: 1,
              objectFit: 'cover'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
