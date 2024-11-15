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
  const wheelRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - wheelRef.current.offsetLeft);
    setScrollLeft(wheelRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - wheelRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    wheelRef.current.scrollLeft = scrollLeft - walk;
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
        {items.map((item, index) => (
          <div key={index} className="scroll-wheel-item">
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
        ))}
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

const LibraryTesting = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [ madeForYou, setMadeForYou ] = useState(Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Made For You' }));
  const [ playlists, setPlaylists ] = useState(Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Playlist' }));
  const [ podcasts, setPodcasts ] = useState(Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Podcast' }));
  const [ albums, setAlbums ] = useState(Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Album' }));
  const [ artists, setArtists ] = useState(Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Artist' }));

  // TODO: Backend - Replace this mock data with actual Spotify API integration
  // Required Spotify API endpoints:
  // - GET /v1/me/shows (for podcasts)
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
  ], [playlists, podcasts, albums, artists]);

  const fetchTopItems = (type) => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/top/" + type, {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched top items:", response);

          setMadeForYou(
            (response && response.items || [])
              .map((item, index) => (item && item.album && item.album.name && item.album.images && {
                title: item.album.name,
                imageUrl: item.album.images[0].url
              }) || {
                title: `Made For You ${index}`,
                imageUrl: defaultAlbumArt
              })
          );
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

          setPlaylists(
            (response && response.items || [])
              .map((playlist, index) => (playlist && playlist.name && playlist.images && {
                title: playlist.name,
                imageUrl: playlist.images[0].url
              }) || {
                title: `Playlist ${index}`,
                imageUrl: defaultAlbumArt
              })
          );
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

          setPodcasts(
            (response && response.items || [])
              .map((podcast, index) => (podcast && podcast.show && podcast.show.name && podcast.show.images && {
                title: podcast.show.name,
                imageUrl: podcast.show.images[podcast.show.images.length - 1].url
              }) || {
                title: `Podcast ${index}`,
                imageUrl: defaultAlbumArt
              })
          );
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

          setAlbums(
            (response && response.items || [])
              .map((album, index) => (album && album.album && album.album.name && album.album.images && {
                title: album.album.name,
                imageUrl: album.album.images[0].url
              }) || {
                title: `Album ${index}`,
                imageUrl: defaultAlbumArt
              })
          );
        })
        .catch((error) => {
          console.log("Failed to fetch albums:", error);
        });
    }
  };

  const fetchArtists = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/following", { type: "artist" }, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched artists:", response);

          setArtists(
            (response && response.artists && response.artists.items || [])
              .map((artist, index) => (artist && artist.name && artist.images && {
                title: artist.name,
                imageUrl: artist.images[0].url
              }) || {
                title: `Artist ${index}`,
                imageUrl: defaultAlbumArt
              })
          );
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
