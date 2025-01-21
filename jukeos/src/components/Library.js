import React, { useState, useRef, useContext, useMemo, useEffect } from 'react';
import backgroundPng from '../assets/background.png';
import mainGradient from '../assets/main-gradient.svg';
import defaultAlbumArt from '../assets/default-album-art.png';
import { performFetch, SpotifyAuthContext } from '../contexts/spotify';
import { PlayerContext } from './Player';
import '../App.css';

const ScrollWheel = ({ items, playUri }) => {
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
                onClick={() => playUri(item.uri)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LibrarySection = ({ title, items, playUri }) => {
  return (
    <div className="library-section">
      <div className="section-title glow">
        <h2>{title}</h2>
      </div>
      <div className="carousel-container">
        <ScrollWheel items={items} playUri={playUri} />
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
  const { playUri } = useContext(PlayerContext);

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

  /*
    This pulls the list of current user's top items. It gets the names and images of the albums from the response and put 
    them into `setMadeForYou`. 

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  */
  const fetchTopItems = (type) => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/top/" + type, {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched top items:", response);

          if (response && response.items) {
            setMadeForYou(
              response.items
                .filter((item) => item && item.uri && item.album && item.album.name && item.album.images)
                .map((item) => ({
                  title: item.album.name,
                  uri: item.uri,
                  imageUrl: selectBestImage(item.album.images).url
                }))
            );
          }
        }).catch((error) => {
          console.log("Failed to fetch top items:", error);
        });
    }
  };

  /*
    This pulls the list of the playlists that are owned or followed by the current user. It gets the names and the images of 
    the playlists from the response and put them into `setPlayLists`.

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
  */
  const fetchPlaylists = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/playlists", {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched playlists:", response);

          if (response && response.items) {
            setPlaylists(
              response.items
                .filter((playlist) => playlist && playlist.uri && playlist.name && playlist.images)
                .map((playlist) => ({
                  title: playlist.name,
                  uri: playlist.uri,
                  imageUrl: selectBestImage(playlist.images).url
                }))
            );
          }
        }).catch((error) => {
          console.log("Failed to fetch playlists:", error);
      });
    }
  };

  /*
    This pulls the list of the podcasts that are saved by the current user. It gets the names and the images 
    of the podcasts from the response and put them into `setPodcasts`. 
    
    PLEASE NOTE: it is correct that this requests to pull the shows, but this is the actual way to obtain 
    information of the current user's saved podcasts from Spotify.

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-users-saved-shows
  */
  const fetchPodcasts = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/shows", {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched podcasts:", response);

          if (response && response.items) {
            setPodcasts(
              response.items
                .filter((podcast) => podcast && podcast.show && podcast.show.name && podcast.show.uri && podcast.show.images)
                .map((podcast) => ({
                  title: podcast.show.name,
                  uri: podcast.show.uri,
                  imageUrl: selectBestImage(podcast.show.images).url
                }))
            );
          }
        }).catch((error) => {
          console.log("Failed to fetch podcasts:", error);
      });
    }
  };

  /*
    This pulls the list of the albums that were saved by the current user. It gets the names and the images of 
    the albums from the response and put them into `setAlbums`.

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-users-saved-albums
  */
  const fetchAlbums = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/albums", {}, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched albums:", response);

          if (response && response.items) {
            setAlbums(
              response.items
                .filter((album) => album && album.album && album.album.name && album.album.uri && album.album.images)
                .map((album) => ({
                  title: album.album.name,
                  uri: album.album.uri,
                  imageUrl: selectBestImage(album.album.images).url
                }))
            );
          }
        }).catch((error) => {
          console.log("Failed to fetch albums:", error);
      });
    }
  };

  /*
    This pulls the list of the artists that are followed by the current user. It gets the names and 
    the images of the artiss from the response and put them into `setArtists`.

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-followed
  */
  const fetchArtists = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/following?limit=20", { type: "artist" }, accessToken, invalidateAccess)
        .then((response) => {
          console.log("Successfully fetched artists:", response);

          if (response && response.artists && response.artists.items) {
            setArtists(
              response.artists.items
                .filter((artist) => artist && artist.name && artist.uri && artist.images)
                .map((artist, index) => ({
                  title: artist.name,
                  uri: artist.uri,
                  imageUrl: selectBestImage(artist.images).url
                }))
            );
          }
        }).catch((error) => {
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
              playUri={playUri}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LibraryTesting;
