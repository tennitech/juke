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


const Home = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);
  const { track, paused, playUri, togglePlay, nextTrack, prevTrack } = useContext(PlayerContext);
  const [currentTrack, setCurrentTrack] = useState({
    progress: 0,
    duration: 1
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

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
        })
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
    <div
      className="home-viewport"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 'clamp(140px, 18vh, 180px)',
        paddingBottom: 'clamp(25px, 10vh, 50px)',
        zIndex: 999,
        isolation: 'isolate'
      }}
    >
      <img src={cloudsSvg} alt="" className="clouds-main" style={{
        position: 'absolute',
        width: 'min(45vw, 750px)',
        height: 'auto',
        top: 'clamp(10%, 5vh, 15%)',
        left: '0',
        opacity: 0.85,
        filter: 'blur(2px)',
        zIndex: -1,
        transform: 'translateX(-15%) translateY(clamp(0px, 5vh, 40px))'
      }} />

      <img src={cloudsSvg} alt="" className="clouds-small" style={{
        position: 'absolute',
        width: 'min(35vw, 450px)', // Slightly reduced size
        height: 'auto',
        bottom: '2%', // Better bottom positioning
        right: '5%', // Anchor to right side instead of left
        opacity: 0.7, // More transparent
        filter: 'blur(3px)', // Increased blur effect
        zIndex: -1,
        transform: 'rotateY(180deg) scale(0.9)' // Flip and scale down slightly
      }} />

      <div className="player-container" style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: 'clamp(10px, 2vh, 20px) clamp(20px, 4vw, 60px)',
        position: 'relative',
        minHeight: 'min-content',
        transform: 'scale(min(1, 0.9))',
        transformOrigin: 'top center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: 'min(45vh, 380px)',
          maxHeight: 'min(60vh, 450px)',
          flexWrap: 'wrap',
          padding: '0',
          marginBottom: '0'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1vh, 1.5vh, 2vh)',
            width: 'clamp(280px, 40%, 500px)',
            height: 'auto',
            padding: 'clamp(10px, 2vw, 30px)',
            paddingLeft: 'clamp(20px, 4vw, 60px)',
            flex: '1 1 auto'
          }}>
            <h1 style={{
              fontFamily: 'Loubag, sans-serif',
              fontSize: 'clamp(2.2rem, 4vw, 4rem)',
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
              fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
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
              fontSize: 'clamp(0.7rem, 1vw, 0.9rem)',
              color: '#ECE0C4',
              opacity: 0.8,
              marginTop: '0.5vh'
            }}>
              <span>{formatTime(currentTrack.progress)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>

            <div style={{
              width: '100%',
              marginTop: '1vh'
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
                gap: '2vw',
                marginTop: 'clamp(2vh, 3vh, 4vh)',
                marginBottom: 'clamp(4vh, 6vh, 10vh)',
                maxHeight: '80px'
              }}
            >
              <button
                onClick={() => prevTrack()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  width: 'clamp(35px, 4vw, 50px)',
                  height: 'clamp(35px, 4vw, 50px)'
                }}
              >
                <img
                  src={prevIcon}
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
                onClick={() => togglePlay()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  width: 'clamp(45px, 5vw, 70px)',
                  height: 'clamp(45px, 5vw, 70px)'
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
                onClick={() => nextTrack()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  width: 'clamp(35px, 4vw, 50px)',
                  height: 'clamp(35px, 4vw, 50px)'
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
            width: 'clamp(180px, 38%, 420px)',
            aspectRatio: '1/1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            flex: '0 1 auto',
            zIndex: '1'
          }}>
            <AnimatedBlob
              colors={useColorThief(track?.album?.images?.[0]?.url || defaultAlbumArt)}
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                zIndex: '-1'
              }}
              static={false}
            />
            <img
              src={track?.album?.images?.[0]?.url || defaultAlbumArt}
              alt="Album Art"
              style={{
                position: 'absolute',
                width: '90%',
                height: '90%',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}
            />
          </div>
        </div>

        <div style={{
          width: 'clamp(280px, 40%, 500px)',
          marginTop: '-15px',
          paddingLeft: 'clamp(20px, 4vw, 60px)',
          position: 'relative',
          minHeight: '100px',
          maxHeight: 'calc(35vh - 20px)',
          height: 'auto',
          overflow: 'visible'
        }}>
          <h3 style={{
            fontFamily: 'Loubag, sans-serif',
            fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
            color: '#FFC764',
            letterSpacing: '3px',
            marginBottom: 'clamp(3px, 0.3vh, 6px)',
            marginTop: '0',
            textAlign: 'left'
          }}>
            RECENTLY PLAYED
          </h3>
          <div style={{
            width: '100%',
            minHeight: '70px',
            maxHeight: 'calc(30vh - 20px)',
            height: 'auto',
            overflow: 'visible',
            marginTop: 'clamp(0px, 0.3vh, 5px)'
          }}>
            <div className="scroll-wheel-container" style={{
              height: '100%',
              width: '150%',
              marginTop: '-5px'
            }}>
              <div className="scroll-wheel-track" style={{
                minHeight: '100%',
                paddingLeft: '0',
                paddingRight: '4vw',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(5px, 1vw, 12px)'
              }}>
                { (
                  recentlyPlayed.map((track, index) => (
                    <div
                      key={index}
                      className="scroll-wheel-item"
                      style={{
                        transform: index === 0 ? 'scale(1)' : `scale(${0.9 - index * 0.05})`,
                        opacity: index === 0 ? 1 : 1 - index * 0.15,
                        marginRight: index === recentlyPlayed.length - 1 ? 0 : 'clamp(5px, 1vw, 15px)'
                      }}
                      onClick={() => playUri(track.uri)}
                    >
                      <img
                        src={track.imageUrl}
                        alt={`${track.title} by ${track.artist}`}
                        style={{
                          width: 'clamp(55px, 8vw, 80px)',
                          height: 'clamp(55px, 8vw, 80px)',
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
    </div>
  );
};

export default Home;
