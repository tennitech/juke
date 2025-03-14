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
import previousIcon from '../assets/skip-backward-icon.svg';
import nextIcon from '../assets/skip-forward-icon.svg';

// New component to handle marquee scrolling when the text is too long.
const MarqueeText = ({ text, maxChars = 20, scrollDuration = 10, scrollDelay = 2 }) => {
  if (!text || text.length <= maxChars) {
    return <span>{text}</span>;
  }
  return (
    <div className="marquee-container">
      <div
        className="marquee-content"
        style={{
          animationDuration: `${scrollDuration}s`,
          animationDelay: `${scrollDelay}s`
        }}
      >
        {text}&nbsp;&nbsp;&nbsp;{text}
      </div>
    </div>
  );
};

// Hook to get dominant colors from an image using Color Thief.
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

const ScrollWheel = ({ items, isMobile, isCarThing, playUri }) => {
  const wheelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Triple the items array for infinite scrolling effect
  const tripleItems = [...items, ...items, ...items];
  
  // Determine item width based on car display
  const itemWidth = isCarThing ? 40 : (isMobile ? 60 : 100);
  
  useEffect(() => {
    // Set initial scroll position to the middle set of items
    if (wheelRef.current) {
      const middlePosition = items.length * itemWidth;
      wheelRef.current.scrollLeft = middlePosition;
    }
  }, [items.length, itemWidth]);

  const handleScroll = () => {
    if (wheelRef.current) {
      const { scrollLeft, scrollWidth } = wheelRef.current;
      const itemsWidth = items.length * itemWidth;
      
      // If we've scrolled to the end of the middle set
      if (scrollLeft >= itemsWidth * 2) {
        wheelRef.current.scrollLeft = scrollLeft - itemsWidth;
      }
      // If we've scrolled to the start of the middle set
      else if (scrollLeft <= 0) {
        wheelRef.current.scrollLeft = scrollLeft + itemsWidth;
      }
    }
  };

  useEffect(() => {
    const wheel = wheelRef.current;
    if (wheel) {
      wheel.addEventListener('scroll', handleScroll);
      return () => wheel.removeEventListener('scroll', handleScroll);
    }
  }, [items.length]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - wheelRef.current.offsetLeft);
    setScrollLeft(wheelRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - wheelRef.current.offsetLeft;
    const walk = (x - startX);
    wheelRef.current.scrollLeft = scrollLeft - walk;
  };

  const centerNearestItem = () => {
    const container = wheelRef.current;
    const containerCenter = container.offsetWidth / 2;
    const currentScroll = container.scrollLeft;
    // Determine the index whose center is nearest the container center
    const index = Math.round((currentScroll + containerCenter - (itemWidth / 2)) / itemWidth);
    const newScrollLeft = index * itemWidth + (itemWidth / 2) - containerCenter;
    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    return index;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const index = centerNearestItem();
    if (typeof playUri === 'function' && items[index]) {
      try {
        const result = playUri(items[index].uri);
        if (result && typeof result.catch === 'function') {
          result.catch((e) => {
            if (!(e && e.response && e.response.status === 404)) {
              console.error(e);
            }
          });
        }
      } catch (e) {
        if (!(e && e.response && e.response.status === 404)) {
          console.error(e);
        }
      }
    }
  };

  const handleItemClick = (index, item) => {
    const container = wheelRef.current;
    const containerCenter = container.offsetWidth / 2;
    const newScrollLeft = index * itemWidth + (itemWidth / 2) - containerCenter;
    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    if (typeof playUri === 'function') {
      try {
        const result = playUri(item.uri);
        if (result && typeof result.catch === 'function') {
          result.catch((e) => {
            if (!(e && e.response && e.response.status === 404)) {
              console.error(e);
            }
          });
        }
      } catch (e) {
        if (!(e && e.response && e.response.status === 404)) {
          console.error(e);
        }
      }
    } else {
      console.error('playUri is not defined');
    }
  };

  return (
    <div
      className="scroll-wheel-container"
      ref={wheelRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if(isDragging) handleMouseUp(); }}
      style={{ 
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        width: '100%',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: isCarThing ? '10px 0' : '20px 0'
      }}
    >
      <div className="scroll-wheel-track" 
        style={{ 
          display: 'inline-flex',
          paddingLeft: 'calc(50% - 20px)',  // Center the items
          paddingRight: 'calc(50% - 20px)',
          gap: '10px'
        }}
      >
        {tripleItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="scroll-wheel-item"
            onClick={() => { handleItemClick(index % items.length, item); }}
            style={{ 
              display: 'inline-block',
              margin: '0 5px'
            }}
          >
            <img
              src={item.imageUrl || defaultAlbumArt}
              alt={item.title}
              style={{
                width: isCarThing ? '40px' : (isMobile ? '60px' : '100px'),
                height: isCarThing ? '40px' : (isMobile ? '60px' : '100px'),
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                transition: 'transform 0.3s ease',
                transform: isDragging ? 'scale(1)' : 'scale(1.05)',
                cursor: 'pointer'
              }}
            />
          </div>
        ))}
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
  const [isCarThing, setIsCarThing] = useState(window.innerWidth <= 800 && window.innerHeight <= 480);

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
      if (error.response && error.response.status === 404) {
        console.warn('Player inactive; seek request ignored');
      } else {
        console.error('Failed to seek:', error);
      }
    }
  };

  // Fetch recently played tracks
  const fetchRecentlyPlayed = () => {
    if (accessToken) {
      setIsLoadingRecent(true);

      performFetch("https://api.spotify.com/v1/me/player/recently-played", { limit: 10 }, accessToken, invalidateAccess)
        .then((response) => {
          if (response && response.items) {
            const transformedTracks = response.items
              .filter((item) => item && item.track && item.track.album)
              .map((item) => ({
                id: item.track.id,
                title: item.track.name,
                artist: item.track.artists[0].name,
                imageUrl: item.track.album.images[0]?.url || defaultAlbumArt,
                playedAt: new Date(item.played_at),
                albumName: item.track.album.name,
                duration: item.track.duration_ms,
                uri: item.track.uri
              }))
              .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());

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
      const pollInterval = setInterval(fetchRecentlyPlayed, 30000);
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

  useEffect(() => {
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth <= 768);
      const car = window.innerWidth <= 800 && window.innerHeight <= 480;
      setIsCarThing(car);
      const albumArtWidth = window.innerWidth <= 768 ? '60%' : '35%';
      document.documentElement.style.setProperty('--album-art-width', albumArtWidth);
    }, 250);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleSpacebar = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (typeof togglePlay === 'function') {
          try {
            togglePlay();
          } catch (e) {
            console.error(e);
          }
        } else {
          console.error('togglePlay is not defined');
        }
      }
    };

    window.addEventListener('keydown', handleSpacebar);
    return () => window.removeEventListener('keydown', handleSpacebar);
  }, [togglePlay]);

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
      padding: isCarThing ? '60px 2vw 20px' : (isMobile ? '120px 5vw 40px 5vw' : '120px 5vw 40px 5vw'),
    }}>
      <img src={cloudsSvg} alt="" className="clouds-main" />
      <img src={cloudsSvg} alt="" className="clouds-small" />
      <div className="player-container" style={{
        width: '100%',
        maxWidth: '1400px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'flex-start',
        padding: isMobile ? '1vh 4vw' : '2vh 6vw',
        position: 'relative',
        gap: isMobile ? '2vw' : '4vw',
        minHeight: isCarThing ? '400px' : 'auto'
      }}>
        {/* Left Side - Track Info, Controls, and Recently Played */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: isMobile ? '100%' : '65%',
          order: 1,
          alignItems: 'center',
          gap: isCarThing ? '0.2vh' : '0.5vh',
          paddingBottom: isCarThing ? '60px' : '80px'
        }}>
          {/* Track Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isCarThing ? '0.2vh' : '0.5vh',
            width: '100%',
            alignItems: 'center'
          }}>
            <h1 style={{
              fontFamily: 'Loubag, sans-serif',
              fontSize: isCarThing ? '1.5rem' : 'clamp(3rem, 6vw, 7rem)',
              margin: '0',
              textAlign: 'center',
              color: '#ECE0C4',
              lineHeight: 1,
              maxWidth: '90%',
              overflow: 'hidden'
            }}>
              {!isMobile ? (
                <MarqueeText text={track?.name || "Unknown"} maxChars={20} />
              ) : (
                track?.name || "Unknown"
              )}
            </h1>
            <h2 style={{
              fontFamily: 'Notable, sans-serif',
              fontSize: isCarThing ? '0.9rem' : 'clamp(1.2rem, 3vw, 2.5rem)',
              margin: '0',
              marginTop: isCarThing ? '0.1vh' : '0.2vh',
              opacity: 0.9,
              letterSpacing: '1px',
              color: 'white',
              textAlign: 'center',
              maxWidth: '90%',
              overflow: 'hidden'
            }}>
              {!isMobile ? (
                <MarqueeText
                  text={
                    track?.artists?.map(artist => artist.name)?.join(", ") ||
                    "Unknown"
                  }
                  maxChars={25}
                />
              ) : (
                track?.artists?.map(artist => artist.name)?.join(", ") || "Unknown"
              )}
            </h2>
          </div>
          {/* Progress Bar */}
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
              onClick={() => { 
                if (typeof previousTrack === 'function') { previousTrack(); } 
                else { console.error('previousTrack is not defined'); } 
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: isCarThing ? '8px' : '15px',
                width: isCarThing ? '50px' : '80px',
                height: isCarThing ? '50px' : '80px'
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
              onClick={() => { 
                if (typeof togglePlay === 'function') { togglePlay(); } 
                else { console.error('togglePlay is not defined'); } 
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: isCarThing ? '8px' : '15px',
                width: isCarThing ? '60px' : '100px',
                height: isCarThing ? '60px' : '100px'
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
              onClick={() => { 
                if (typeof nextTrack === 'function') { nextTrack(); } 
                else { console.error('nextTrack is not defined'); } 
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: isCarThing ? '8px' : '15px',
                width: isCarThing ? '50px' : '80px',
                height: isCarThing ? '50px' : '80px'
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
          {/* Recently Played Section */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: isCarThing ? '20px' : '40px',
            position: 'relative',
            zIndex: 1
          }}>
            <h3 style={{
              fontFamily: 'Loubag, sans-serif',
              fontSize: isCarThing ? '0.9rem' : 'clamp(1.8rem, 3vw, 3rem)',
              color: '#FFC764',
              letterSpacing: '3px',
              marginBottom: isCarThing ? '10px' : '15px',
              textAlign: 'center'
            }}>
              RECENTLY PLAYED
            </h3>
            <ScrollWheel 
              items={recentlyPlayed} 
              isMobile={isMobile} 
              isCarThing={isCarThing} 
              playUri={playUri} 
            />
          </div>
        </div>
        {/* Right Side - Album Art with Animated Blob using Color Thief */}
        <div style={{ 
          position: 'relative',
          width: isMobile ? '80%' : '35%',
          maxWidth: isMobile ? '300px' : '400px',
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          order: isMobile ? 0 : 2,
          marginBottom: isMobile ? '2vh' : 0,
          marginTop: isMobile ? '0' : 'calc(0.6em)',
          zIndex: 2
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
            className="album-art"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;