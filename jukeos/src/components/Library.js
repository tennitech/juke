import React, { useState, useRef, useContext, useMemo, useEffect } from 'react';
import backgroundPng from '../assets/background.png';
import mainGradient from '../assets/main-gradient.svg';
import defaultAlbumArt from '../assets/default-album-art.png';
import '../App.css';
import { performFetch, SpotifyAuthContext } from '../contexts/spotify';

const ScrollWheel = ({ items }) => {
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
      const itemWidth = 190; // Width + gap
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
    const itemWidth = 190;
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
                  width: '150px',
                  height: '150px',
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

const LibrarySection = ({ title, items }) => {
  return (
    <div className="library-section">
      <div className="section-title glow">
        <h2>{title}</h2>
      </div>
      <div className="carousel-container">
        <ScrollWheel items={items} />
      </div>
    </div>
  );
};

function selectBestImage(images) {
  const minWidth = 150, minHeight = 150;

  return images.reduce((previous, current) => {
    const validImage
      = current.width >= minWidth && current.height >= minHeight;
    const betterThanPrevious
      = !previous || (current.width < previous.width && current.height < previous.height);

    return (validImage && betterThanPrevious)
      ? current : previous;
  }, null) || images[0];
}

const LibraryTesting = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [ madeForYou, setMadeForYou ] = useState([]);
  const [ playlists, setPlaylists ] = useState([]);
  const [ podcasts, setPodcasts ] = useState([]);
  const [ albums, setAlbums ] = useState([]);
  const [ artists, setArtists ] = useState([]);

  // Consider implementing pagination if needed
  const sections = useMemo(() => [
    {
      title: "MADE FOR YOU",
      items: madeForYou,
    },
    {
      title: 'PLAYLISTS',
      items: playlists
    },
    {
      title: 'PODCASTS',
      items: podcasts
    },
    {
      title: 'ALBUMS',
      items: albums
    },
    {
      title: 'ARTISTS',
      items: artists
    }
  ], [madeForYou, playlists, podcasts, albums, artists]);

  const fetchTopItems = (type) => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/top/" + type, {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched top items:", response);

          if (response && response.items) {
            setMadeForYou(
              response.items
                .filter((item) => item && item.album && item.album.name && item.album.images)
                .map((item) => ({
                  title: item.album.name,
                  imageUrl: selectBestImage(item.album.images).url
                }))
            );
          }
        })
        .catch((error) => {
          console.log("Failed to fetch top items:", error);
        });
    }
  };

  const fetchPlaylists = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/playlists", {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched playlists:", response);

          if (response && response.items) {
            setPlaylists(
              response.items
                .filter((playlist) => playlist && playlist.name && playlist.images)
                .map((playlist) => ({
                  title: playlist.name,
                  imageUrl: selectBestImage(playlist.images).url
                }))
            );
          }
        })
        .catch((error) => {
          console.log("Failed to fetch playlists:", error);
        });
    }
  };

  const fetchPodcasts = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/shows", {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched podcasts:", response);

          if (response && response.items) {
            setPodcasts(
              response.items
                .filter((podcast) => podcast && podcast.show && podcast.show.name && podcast.show.images)
                .map((podcast) => ({
                  title: podcast.show.name,
                  imageUrl: selectBestImage(podcast.show.images).url
                }))
            );
          }
        })
        .catch((error) => {
          console.log("Failed to fetch podcasts:", error);
        });
    }
  };

  const fetchAlbums = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/albums", {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched albums:", response);

          if (response && response.items) {
            setAlbums(
              response.items
                .filter((album) => album && album.album && album.album.name && album.album.images)
                .map((album) => ({
                  title: album.album.name,
                  imageUrl: selectBestImage(album.album.images).url
                }))
            );
          }
        })
        .catch((error) => {
          console.log("Failed to fetch albums:", error);
        });
    }
  };

  const fetchArtists = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/following?limit=20", { type: "artist" }, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched artists:", response);

          if (response && response.artists && response.artists.items) {
            setArtists(
              response.artists.items
                .filter((artist) => artist && artist.name && artist.images)
                .map((artist, index) => ({
                  title: artist.name,
                  imageUrl: selectBestImage(artist.images).url
                }))
            );
          }
        })
        .catch((error) => {
          console.log("Failed to fetch artists:", error);
        });
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchTopItems("tracks");
      fetchPlaylists();
      fetchPodcasts();
      fetchAlbums();
      fetchArtists();
    }
  }, [accessToken]);

  // TODO: Backend - Add these states and effects for API integration:
  // const [loading, setLoading] = useState(true);
  // const { accessToken } = useContext(SpotifyAuthContext);
  // useEffect(() => { fetch Spotify data here }, [accessToken]);

  return (
    <div style={{ position: 'relative' }}>
      {/* TODO: Backend - Consider adding loading spinner/state here */}
      <div style={{
        backgroundImage: `url(${backgroundPng})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        padding: '20px',
        perspective: '1000px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200vw',
          height: 'auto',
          zIndex: 2,
          pointerEvents: 'none'
        }}>
          <img 
            src={mainGradient} 
            alt="gradient" 
            style={{
              width: '62%',
              height: 'auto',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
        <div style={{
          paddingTop: '120px',
          paddingBottom: '40px',
          overflowY: 'auto',
          height: '100vh',
          position: 'relative',
          zIndex: 3
        }}>
          {sections.map((section, index) => (
            <LibrarySection 
              key={section.title}
              title={section.title} 
              items={section.items}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LibraryTesting;
