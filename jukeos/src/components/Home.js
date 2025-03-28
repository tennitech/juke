import React, { useContext, useState, useEffect, useRef } from 'react';
import { SpotifyAuthContext, performFetch, performPut } from '../contexts/spotify';
import { PlayerContext } from './Player';
import defaultAlbumArt from '../assets/default-art-placeholder.svg';
import '../App.css';
import AnimatedBlob from './AnimatedBlob';
import cloudsSvg from '../assets/clouds.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import ColorThief from "color-thief-browser";
import nextIcon from "../assets/skip-forward-icon.svg"
import prevIcon from "../assets/skip-backward-icon.svg"

//Move location possibly in the future
export function useColorThief(imageSrc) {
  const [colors, setColors] = useState(["rgb(0, 0, 0)"]);

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, 2);
      const rgbColors = palette.map(
          (color) => `rgb(${color[0]}, ${color[1]}, ${color[2]})`
      );
      setColors(rgbColors);
    };
  }, [imageSrc]);

  return colors;
}

//Unused Component
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

  return (
    <div 
      className="scroll-wheel-container"
      ref={wheelRef}
      style={{ 
        width: '100%',
        maxWidth: '800px',
        height: '100px',  // Reduced from 120px
        overflow: 'hidden',
        marginTop: '-10px'  // Added negative margin
      }}
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


const Home = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);
  const {
    track,
    paused,
    playUri,
    togglePlay,
    nextTrack,
    prevTrack,
    recentlyPlayed,
    recentlyPlayedError,
    isLoadingRecent
  } = useContext(PlayerContext);
  const [currentTrack, setCurrentTrack] = useState({
    progress: 0,
    duration: 1
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
      await performPut(
        'https://api.spotify.com/v1/me/player/seek',
        { position_ms: position * 1000 },
        null,
        accessToken,
        invalidateAccess
      );

      setCurrentTrack((prev) => ({
        ...prev,
        progress: position,
      }));
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      try {
        const data = await performFetch('https://api.spotify.com/v1/me/player', {}, accessToken, invalidateAccess);
        
        if (data) {
          setCurrentTrack(prev => ({
            ...prev,
            progress: data.progress_ms / 1000,
            duration: data.item.duration_ms / 1000
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
              {track?.name || "Unknown"}
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
                }}/>
              </div>
            </div>


            <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  marginTop: '10px',
                  marginBottom: '10px'
                }}
            >
              {/* Prev Button*/}
              <button
                  onClick={() => prevTrack()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '10px',
                    width: '60px',
                    height: '60px'
                  }}
              >
                <img
                    src={prevIcon}
                    alt="Next"
                    style={{
                      width: '100%',
                      height: '100%',
                      opacity: 0.8,
                      transition: 'opacity 0.2s ease'
                    }}
                />
              </button>


              {/* Play/Pause Button */}
                <button
                    onClick={() => togglePlay()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '10px',
                      width: '80px',
                      height: '80px'
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

                {/* Next Button */}
                <button
                    onClick={() => nextTrack()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '10px',
                      width: '60px',
                      height: '60px'
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

          <div style={{
            position: 'relative',
            width: '600px',
            height: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AnimatedBlob
                colors={useColorThief(track?.album?.images?.[0]?.url || defaultAlbumArt)}
                style={{
                  width: '30vw',
                  maxWidth: '525px',
                  maxHeight: '525px',
                  height: '30vw',
                }}
                static={false}
            />
            <img
                src={track?.album?.images?.[0]?.url || defaultAlbumArt}
                alt="Album Art"
                className={"album-art"}
            />
          </div>
        </div>
        <div style={{
          width: '500px',
          marginTop: '-240px',
          alignSelf: 'flex-start',
          paddingLeft: '0'
        }}>
          <h3 style={{
            fontFamily: 'Loubag, sans-serif',
            fontSize: '1.5rem',
            color: '#FFC764',
            letterSpacing: '3px',
            marginBottom: '5px',
            marginTop: '140px',
            textAlign: 'left'
          }}>
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
