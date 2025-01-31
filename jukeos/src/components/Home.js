import React, { useContext, useState, useEffect, useRef } from 'react';
import { SpotifyAuthContext, performFetch } from '../contexts/spotify';
import { PlayerContext } from './Player';
import cloudsSvg from '../assets/clouds.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import AnimatedBlob from './AnimatedBlob';
import '../App.css';
import axios from 'axios';
import defaultAlbumArt from '../assets/default-album-art.png';

const ScrollWheel = ({ items }) => {
  const [centerIndex, setCenterIndex] = useState(Math.floor(items.length / 2));
  const wheelRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - wheelRef.current.offsetLeft;
    scrollLeft.current = wheelRef.current.scrollLeft;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - wheelRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    wheelRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const scrollWheelStyles = {
    container: {
      width: '100%',
      maxWidth: 'min(800px, 90vw)',
      height: 'clamp(80px, 10vh, 100px)',
      overflow: 'hidden',
      marginTop: '-10px'
    },
    
    item: {
      width: 'clamp(80px, 10vw, 100px)',
      height: 'clamp(80px, 10vw, 100px)',
      borderRadius: '8px'
    }
  };

  return (
    <div 
      className="scroll-wheel-container"
      ref={wheelRef}
      style={scrollWheelStyles.container}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="scroll-wheel-track" style={{
        display: 'flex',
        gap: '20px',
        padding: '0 20px'
      }}>
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
                  width: '100px',  // Reduced size
                  height: '100px',  // Reduced size
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

const responsiveStyles = {
  playerContainer: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(15px, 3vw, 30px)',
    margin: '0 auto',
    padding: 'clamp(20px, 4vw, 40px)',
    position: 'relative',
    height: '100vh',
    justifyContent: 'center'
  },
  
  mainContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 'clamp(20px, 4vw, 40px)',
    flexWrap: 'wrap',
    padding: '0 clamp(10px, 3vw, 20px)',
    marginTop: '80px' // Add space below navbar
  },
  
  trackInfo: {
    flex: '1 1 300px',
    minWidth: '280px',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '15px'
  },
  
  albumArtContainer: {
    flex: '1 1 300px',
    width: '100%',
    maxWidth: '500px',
    aspectRatio: '1',
    position: 'relative'
  },
  
  albumArt: {
    width: '100%',
    height: '100%',
    maxWidth: '500px',
    maxHeight: '500px',
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    position: 'relative',
    zIndex: 1,
    objectFit: 'cover'
  },
  
  title: {
    fontFamily: 'Loubag, sans-serif',
    fontSize: 'clamp(1.5rem, 5vw, 3.5rem)',
    margin: '0',
    textAlign: 'left',
    color: '#ECE0C4',
    textShadow: `
      2px 2px 0 rgba(255,0,0,0.2),
      -2px -2px 0 rgba(0,0,255,0.2),
      1px -1px 0 rgba(255,0,255,0.2)
    `,
    animation: 'textGlitch 3s infinite',
    lineHeight: '1.1',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  
  artist: {
    fontFamily: 'Notable, sans-serif',
    fontSize: 'clamp(0.8rem, 3vw, 1.5rem)',
    margin: '0',
    opacity: 0.9,
    letterSpacing: '1px',
    color: '#ECE0C4',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(15px, 3vw, 30px)',
    margin: '20px 0',
    width: '100%'
  },
  
  recentlyPlayedSection: {
    width: '100%',
    maxWidth: '500px',
    marginTop: '40px',
    alignSelf: 'flex-start',
    paddingLeft: 'clamp(10px, 3vw, 20px)'
  },
  
  recentlyPlayedTitle: {
    fontFamily: 'Loubag, sans-serif',
    fontSize: 'clamp(1rem, 3vw, 1.5rem)',
    color: '#FFC764',
    letterSpacing: '3px',
    marginBottom: '20px',
    textAlign: 'left'
  }
};

// Add media query styles
const mediaStyles = `
  @media (max-width: 768px) {
    .mainContent {
      flex-direction: column-reverse;
    }
    
    .albumArtContainer {
      margin-bottom: 20px;
    }
    
    .trackInfo {
      align-items: center;
      text-align: center;
    }
  }
`;

const Home = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);
  const { track, paused, playUri, togglePlay } = useContext(PlayerContext);
  const [currentTrack, setCurrentTrack] = useState({
    title: 'Loading song...',
    artist: 'Loading artist...',
    albumArt: '../assets/default-album-art.png',
    progress: 0,
    duration: 1
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [recentlyPlayedError, setRecentlyPlayedError] = useState(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

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

  const buttonStyles = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '10px',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    className: 'control-button',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    touchAction: 'manipulation'
  };

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
              {track?.name|| "Unknown"}
            </h1>

            <h2 style={{ 
              fontFamily: 'Notable, sans-serif',
              fontSize: '2rem',
              margin: '0',
              opacity: 0.9,
              letterSpacing: '1px',
              color: 'white'
            }}>
              {track?.artists?.map(artist => artist.name)?.join(", ") || "Unknown"}
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
              onClick={() => togglePlay()}
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
                src={paused ? playIcon : pauseIcon} 
                alt={paused ? "Play" : "Pause"}
                style={{
                  ...buttonStyles,
                  width: '60px',
                  height: '60px'
                }}
              >
                <img 
                  src={require('../assets/skip-backward-icon.svg').default}
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
                className="control-button"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  ...buttonStyles,
                  width: '100px',
                  height: '100px',
                  margin: '0 10px'
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

              <button 
                className="control-button"
                style={{
                  ...buttonStyles,
                  width: '60px',
                  height: '60px'
                }}
              >
                <img 
                  src={require('../assets/skip-forward-icon.svg').default}
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

          <div style={responsiveStyles.albumArtContainer}>
            <AnimatedBlob 
              colors={['#ECE0C4', 'rgba(236, 224, 196, 0.5)']} 
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '600px',
                maxHeight: '600px',
                position: 'absolute',
                top: '-5%',
                left: '-5%',
                transform: 'scale(1.1)'
              }}
              static={true}
            />
            <img 
              src={track?.album?.images?.[0]?.url || '../assets/default-album-art.png'} 
              alt="Album Art" 
              style={responsiveStyles.albumArt} 
            />
          </div>
        </div>
        <div style={responsiveStyles.recentlyPlayedSection}>
          <h3 style={responsiveStyles.recentlyPlayedTitle}>
            RECENTLY PLAYED
          </h3>
          <div style={{
            width: '100%',
            height: '200px',
            overflow: 'hidden',
            marginTop: '-40px'
          }}>
            <div className="scroll-wheel-container">
              <div className="scroll-wheel-track" style={{
                minHeight: '180px',
                paddingLeft: '0',  // Remove default padding to start from left
                paddingRight: '40px'
              }}>
                {isLoadingRecent ? (
                  // TODO: Add loading spinner/skeleton
                  <div>Loading recently played...</div>
                ) : recentlyPlayedError ? (
                  // TODO: Add error state UI
                  <div>Error loading recently played tracks</div>
                ) : (
                  recentlyPlayed.map((track, index) => (
                    <div 
                      key={index} 
                      className="scroll-wheel-item"
                      style={{
                        transform: index === 0 ? 'scale(1)' : `scale(${0.8 - index * 0.1})`,
                        opacity: index === 0 ? 1 : 1 - index * 0.2
                      }}
                      onClick={() => playUri(track.uri)}
                    >
                      <img 
                        src={track.imageUrl}
                        alt={`${track.title} by ${track.artist}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
