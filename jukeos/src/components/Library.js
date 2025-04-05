import React, { useState, useRef, useContext, useMemo, useEffect } from 'react';
import { performFetch, SpotifyAuthContext } from '../contexts/spotify';
import { PlayerContext } from './Player';
import '../App.css';
import backgroundPng from '../assets/background.png';
import defaultAlbumArt from '../assets/default-art-placeholder.svg';
import AnimatedBlob from './AnimatedBlob';
import { useColorThief } from './Home';

// Constants for album layout
const ITEM_WIDTH = 150; // Width of album art
const ITEM_HEIGHT = 150; // Height of album art
const VIEW_HEIGHT = 350; // Height of the viewing area
const HORIZONTAL_SPREAD = 0.85; // How much horizontal space to use (0-1)

const ScrollWheel = ({ items, playUri }) => {
  const [position, setPosition] = useState(0); // Position in the album list (0-1)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startPosition, setStartPosition] = useState(0);
  const containerRef = useRef(null);
  
  // Handle mouse down
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartPosition(position);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
    
    // Snap to nearest item
    if (items.length > 1) {
      const itemFraction = 1 / (items.length - 1);
      const nearestItemPosition = Math.round(position / itemFraction) * itemFraction;
      setPosition(Math.max(0, Math.min(1, nearestItemPosition)));
    }
  };
  
  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const containerWidth = containerRef.current?.clientWidth || 1000;
    const deltaX = (startX - e.clientX) / containerWidth;
    const newPosition = startPosition + deltaX * 1.5; // Adjust sensitivity
    
    // Clamp position between 0 and 1
    setPosition(Math.max(0, Math.min(1, newPosition)));
  };
  
  // Get visible items (filtering to just what we need to render)
  const getVisibleItems = () => {
    if (!items || items.length === 0) return [];
    
    // For simplicity, we'll render all items but adjust their visibility/position based on scroll position
    return items.map((item, index) => {
      // Calculate where this item should be in the scroll position (0-1)
      const itemPosition = items.length > 1 ? index / (items.length - 1) : 0.5;
      
      // Calculate how far this item is from the current view position
      const distanceFromCenter = Math.abs(itemPosition - position);
      
      // Calculate visibility threshold - items too far from view position aren't rendered
      const isVisible = distanceFromCenter < 0.4; // Only show items within 40% of the view position
      
      // Calculate a factor (0-1) for how centered this item is (used for scaling, opacity)
      const centeredness = Math.max(0, 1 - distanceFromCenter * 2.5);
      
      return {
        item,
        index,
        itemPosition,
        distanceFromCenter,
        centeredness,
        isVisible
      };
    }).filter(item => item.isVisible);
  };
  
  // Calculate an item's position and style based on its place in the scroll
  const getItemStyle = (visibleItem) => {
    const { itemPosition, centeredness } = visibleItem;
    const containerWidth = containerRef.current?.clientWidth || 1000;
    
    // Basic screen positioning - horizontal spread based on item position
    // Note we spread items across up to HORIZONTAL_SPREAD (85%) of the container width
    const relativePosition = itemPosition - position; // -1 to 1, with 0 being centered
    
    // Distribute albums horizontally
    const horizontalSpread = containerWidth * HORIZONTAL_SPREAD;
    const x = relativePosition * horizontalSpread;
    
    // Calculate rotation - albums should be tilted based on position
    // Negative relativePosition = left side = negative rotation (tilting right)
    // Positive relativePosition = right side = positive rotation (tilting left)
    // Center position = no rotation
    const rotationDegrees = relativePosition * 25; // Maximum ±25° rotation
    
    // Calculate scale - center items are bigger
    const scale = 0.75 + centeredness * 0.45; // Scale from 0.75 to 1.2
    
    // Calculate opacity - center items are more opaque
    const opacity = 0.3 + centeredness * 0.7; // Opacity from 0.3 to 1.0
    
    // Calculate z-index - center items are on top
    const zIndex = Math.round(50 + centeredness * 50); // z-index from 50 to 100
    
    // Calculate vertical position - creating slight vertical arc
    // Items further from center drop down slightly
    const distanceFromCenterAbs = Math.abs(relativePosition);
    const y = distanceFromCenterAbs * distanceFromCenterAbs * 120; // Parabolic drop
    
    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotationDegrees}deg) scale(${scale})`,
      opacity,
      zIndex
    };
  };
  
  // Get the central item for potentially highlighting
  const getCenterIndex = () => {
    if (items.length === 0) return -1;
    return Math.round(position * (items.length - 1));
  };
  
  const visibleItems = getVisibleItems();
  const centerIndex = getCenterIndex();
  
  return (
    <div
      ref={containerRef}
      className="albums-container"
      style={{
        position: 'relative',
        width: '100%',
        height: `${VIEW_HEIGHT}px`,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => handleMouseDown({clientX: e.touches[0].clientX})}
      onTouchEnd={handleMouseUp}
      onTouchMove={(e) => handleMouseMove({clientX: e.touches[0].clientX, preventDefault: () => e.preventDefault()})}
    >
      {visibleItems.map(visibleItem => {
        const { item, index } = visibleItem;
        const style = getItemStyle(visibleItem);
        const isCentered = index === centerIndex;
        
        return (
          <div
            key={item.uri || index}
            className="album-item"
            style={{
              position: 'absolute',
              width: `${ITEM_WIDTH}px`,
              height: `${ITEM_HEIGHT}px`,
              top: '50%',
              left: '50%',
              marginLeft: `-${ITEM_WIDTH/2}px`,
              marginTop: `-${ITEM_HEIGHT/2}px`,
              transform: style.transform,
              opacity: style.opacity,
              zIndex: style.zIndex,
              transition: isDragging ? 'none' : 'all 0.3s ease-out',
            }}
            onClick={() => {
              if (isCentered) {
                // Play if centered
                playUri(item.uri);
              } else {
                // Otherwise scroll to this item
                const targetPosition = items.length > 1 ? index / (items.length - 1) : 0;
                setPosition(targetPosition);
              }
            }}
          >
            <img
              src={item.imageUrl || defaultAlbumArt}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: `0 ${4 + style.zIndex/25}px ${15}px rgba(0,0,0,${0.3 + (100-style.zIndex)/300})`,
                userSelect: 'none',
              }}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        );
      })}
    </div>
  );
};

export function selectBestImage(images) {
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

const LibrarySection = ({ title, items, playUri }) => {
  // Ensure items is always an array
  const validItems = Array.isArray(items) ? items : [];

  return (
    <div className="library-section" 
      style={{ 
        marginBottom: '120px', 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Radial glow effect */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, rgba(255,199,100,0.15) 0%, rgba(255,140,0,0.05) 40%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      
      <div className="section-title" 
        style={{ 
          marginBottom: '40px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <h2 style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontFamily: 'Loubag, sans-serif',
          color: '#FFC764',
          textShadow: '0 0 20px rgba(255, 199, 100, 0.7)',
          letterSpacing: '8px',
          textAlign: 'center',
          margin: 0,
          textTransform: 'uppercase',
        }}>
          {title}
        </h2>
      </div>
      
      <ScrollWheel items={validItems} playUri={playUri} />
    </div>
  );
};


const LibraryTesting = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);
  const { track, playUri } = useContext(PlayerContext);

  const [ madeForYou, setMadeForYou ] = useState([]);
  const [ playlists, setPlaylists ] = useState([]);
  const [ podcasts, setPodcasts ] = useState([]);
  const [ albums, setAlbums ] = useState([]);
  const [ artists, setArtists ] = useState([]);

  // Determine album art URL and get colors using the hook
  const albumArtUrl = track?.album?.images?.[0]?.url || defaultAlbumArt;
  const colors = useColorThief(albumArtUrl);

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
    <>
      {/* Fixed-position gradient that stays at bottom of viewport */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '180px',
        zIndex: 999,
        pointerEvents: 'none',
        margin: 0,
        padding: 0,
      }}>
        <AnimatedBlob
          colors={colors}
          style={{
            width: '100%', // Back to 100%
            height: '100%',
            filter: 'blur(70px)', // Back to original blur amount
            opacity: 0.75,
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: 0,
          }}
          static={false}
        />
      </div>

      {/* Your existing content */}
      <div style={{ position: 'relative' }}>
        <div style={{
          backgroundImage: `url(${backgroundPng})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          padding: '0',
          perspective: '1000px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Content container */}
          <div style={{
            paddingTop: '120px',
            paddingBottom: '40px',
            paddingLeft: '20px',
            paddingRight: '20px',
            overflowY: 'auto',
            height: '100vh',
            position: 'relative',
            zIndex: 3,
            overscrollBehavior: 'none',
            boxSizing: 'border-box'
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
    </>
  );
};


export default LibraryTesting;
