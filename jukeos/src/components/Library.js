import React, { useState, useRef, useContext, useMemo, useEffect } from 'react';
import { performFetch, SpotifyAuthContext } from '../contexts/spotify';
import { PlayerContext } from './Player';
import '../App.css';
import backgroundPng from '../assets/background.png';
import defaultAlbumArt from '../assets/default-art-placeholder.svg';
import AnimatedBlob from './AnimatedBlob';
import { useColorThief } from './Home';
import { AnimatePresence, motion } from 'framer-motion';

// --- Responsive Constants using clamp() ---
// Sizes based on viewport width (vw) and height (vh)
const RESPONSIVE_ITEM_SIZE = 'clamp(100px, 10vw, 150px)'; // Item size between 100px and 150px
const RESPONSIVE_VIEW_HEIGHT = 'clamp(280px, 30vh, 400px)'; // View height between 280px and 400px
const RESPONSIVE_SPACING = 'clamp(130px, 12vw, 180px)'; // Spacing between 130px and 180px
const RESPONSIVE_ARC_HEIGHT = 'clamp(30px, 5vh, 60px)'; // Arc height between 30px and 60px
const RESPONSIVE_TITLE_SIZE = 'clamp(1.6rem, 3vw, 2.5rem)';
const RESPONSIVE_TITLE_SPACING = 'clamp(2px, 0.5vw, 4px)';
const TITLE_CURVE = 10; // Keep title curve subtle

// Visibility based on width - more items on wider screens
const MIN_VISIBLE_ITEMS = 7;
const MAX_VISIBLE_ITEMS = 11;

const ScrollWheel = ({ items, playUri }) => {
  const [centerIndex, setCenterIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startCenterIndex, setStartCenterIndex] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const velocityRef = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const lastScrollValue = useRef(0);
  const animationFrameRef = useRef(null);

  const SNAP_THRESHOLD = 0.3;
  const SCROLL_SENSITIVITY = 0.0015;
  const MIN_VELOCITY_TO_KEEP_SCROLLING = 0.05;
  const VELOCITY_DECAY = 0.85;

  // Add playing state tracking
  const [playingUri, setPlayingUri] = useState(null);
  const [pulsing, setPulsing] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Smooth scrolling animation
  const animateScroll = () => {
    if (Math.abs(velocityRef.current) < MIN_VELOCITY_TO_KEEP_SCROLLING) {
      velocityRef.current = 0;
      snapToNearest(centerIndex);
      return;
    }

    const newIndex = centerIndex + velocityRef.current;
    
    // If we hit the bounds, stop scrolling
    if (newIndex <= 0 || newIndex >= items.length - 1) {
      velocityRef.current = 0;
      snapToNearest(centerIndex);
      return;
    }

    setCenterIndex(newIndex);
    velocityRef.current *= VELOCITY_DECAY;
    animationFrameRef.current = requestAnimationFrame(animateScroll);
  };

  // Handle wheel/trackpad events
  const handleWheel = (e) => {
    e.preventDefault();

    // Calculate time since last scroll
    const now = Date.now();
    const timeDelta = now - lastScrollTime.current;
    lastScrollTime.current = now;

    // Use the larger of deltaX or deltaY, prioritizing horizontal
    const scrollValue = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    
    // Calculate velocity based on scroll value and time delta
    if (timeDelta > 0) {
      const instantVelocity = (scrollValue - lastScrollValue.current) / timeDelta;
      velocityRef.current = instantVelocity * SCROLL_SENSITIVITY;
    }
    
    lastScrollValue.current = scrollValue;

    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Start new animation
    animationFrameRef.current = requestAnimationFrame(animateScroll);
  };

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Snap to nearest index function
  const snapToNearest = (currentIndex) => {
    const nearestIndex = Math.round(currentIndex);
    const distanceFromNearest = Math.abs(currentIndex - nearestIndex);
    
    if (distanceFromNearest < SNAP_THRESHOLD) {
      setIsSnapping(true);
      setCenterIndex(nearestIndex);
      velocityRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setTimeout(() => setIsSnapping(false), 300);
    }
  };

  // Handle click on item with single pulse effect
  const handleItemClick = (index) => {
    setIsSnapping(true);
    setCenterIndex(index);
    velocityRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Set playing URI and trigger single pulse
    const uri = items[index].uri;
    setPlayingUri(uri);
    setPulsing(uri);
    setTimeout(() => {
      setPulsing(null);
      setIsSnapping(false);
      playUri(uri);
    }, 300);
  };

  // Add navigation functions
  const navigatePrev = () => {
    if (centerIndex > 0) {
      setIsSnapping(true);
      velocityRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setCenterIndex(prevIndex => Math.max(0, Math.floor(prevIndex) - 1));
      setTimeout(() => setIsSnapping(false), 300);
    }
  };

  const navigateNext = () => {
    if (centerIndex < items.length - 1) {
      setIsSnapping(true);
      velocityRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setCenterIndex(prevIndex => Math.min(items.length - 1, Math.floor(prevIndex) + 1));
      setTimeout(() => setIsSnapping(false), 300);
    }
  };

  // --- Responsive Calculations based on containerWidth ---
  const responsiveValues = useMemo(() => {
    const width = containerWidth;
    const baseWidth = 1000; // Reference width for scaling calculations
    // Calculate a ratio based on current width compared to base, clamped for stability
    const widthRatio = Math.max(0.8, Math.min(1.3, width / baseWidth)); 

    // Calculate how many items should be visible
    const visibleItemsCount = Math.round(
      MIN_VISIBLE_ITEMS + (MAX_VISIBLE_ITEMS - MIN_VISIBLE_ITEMS) * (widthRatio - 0.8) / 0.5 // Scale between min/max based on ratio
    );

    // Parse clamped values (removing units like 'px', 'rem') for calculations
    // This is a simplified way, assumes 'px' or 'rem' units primarily.
    // A more robust solution might use CSS variables or a dedicated parsing library.
    const parseClamp = (clampStr) => {
        // Basic parsing - assumes format "clamp(min, preferred, max)"
        const values = clampStr.match(/\((.*?), (.*?), (.*?)\)/);
        if (!values) return 100; // Default fallback
        // We'll use the preferred value (vw/vh based) for dynamic calculation reference
        // A more complex logic could interpolate between min/max based on widthRatio
        const preferredValue = parseFloat(values[2]); 
        const unit = values[2].replace(/[\d.-]/g, '');
        // Approximate conversion for calculations (highly simplified)
        if (unit === 'vw') return preferredValue * width / 100;
        if (unit === 'vh') return preferredValue * window.innerHeight / 100;
        if (unit === 'rem') return preferredValue * 16; // Assuming 1rem = 16px
        return preferredValue; // Assume px
    };

    const calculatedSpacing = parseClamp(RESPONSIVE_SPACING) * Math.max(0.9, widthRatio); // Slightly increase spacing on wider screens
    const calculatedArcHeight = parseClamp(RESPONSIVE_ARC_HEIGHT) * Math.max(0.8, 1.2 - (widthRatio * 0.2)); // Decrease arc height slightly on wider
    const calculatedItemSize = parseClamp(RESPONSIVE_ITEM_SIZE);

    return {
        count: Math.max(MIN_VISIBLE_ITEMS, visibleItemsCount), // Ensure at least min are shown
        arcHeight: calculatedArcHeight,
        spacing: calculatedSpacing,
        itemSize: calculatedItemSize
    };
  }, [containerWidth]);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      } else {
        // Fallback if ref not ready
        setContainerWidth(window.innerWidth);
      }
    };
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e) => {
    if (isSnapping) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setStartCenterIndex(centerIndex);
    velocityRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isSnapping) return;
    
    const deltaX = e.clientX - startX;
    const itemsPerScreen = responsiveValues.count;
    const totalItems = items.length;
    const dragSensitivity = 0.5;
    
    const newCenterIndex = startCenterIndex - (deltaX / (containerWidth / itemsPerScreen)) * dragSensitivity;
    const boundedIndex = Math.max(0, Math.min(totalItems - 1, newCenterIndex));
    setCenterIndex(boundedIndex);

    // Check for snap while dragging
    snapToNearest(boundedIndex);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      snapToNearest(centerIndex);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startX, startCenterIndex]);

  // --- Visibility and Styling Logic ---
  const getVisibleItems = () => {
    if (!items || items.length === 0) return [];
    const boundedCenterIndex = Math.max(0, Math.min(items.length - 1, centerIndex));
    const halfVisible = Math.floor(responsiveValues.count / 2);
    const minIndex = Math.max(0, Math.floor(boundedCenterIndex - halfVisible));
    const maxIndex = Math.min(items.length - 1, Math.ceil(boundedCenterIndex + halfVisible));
    const results = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      const distanceFromCenter = i - boundedCenterIndex;
      const centeredness = Math.max(0, 1 - (Math.abs(distanceFromCenter) / halfVisible));
      results.push({
        item: items[i],
        index: i,
        distanceFromCenter: distanceFromCenter,
        centeredness: centeredness,
        isVisible: true
      });
    }
    return results;
  };

  const getItemStyle = (itemData) => {
    const { distanceFromCenter, centeredness } = itemData;
    const x = distanceFromCenter * responsiveValues.spacing;
    const arcDivisor = Math.max(1.5, 2.5 - (containerWidth / 1000));
    const y = Math.pow(distanceFromCenter / arcDivisor, 2) * responsiveValues.arcHeight;
    const rotationMultiplier = Math.max(4, 10 - (containerWidth / 200));
    const rotationDegrees = distanceFromCenter * rotationMultiplier;
    const opacity = 0.4 + centeredness * 0.6;
    const zIndex = Math.round(100 - Math.abs(distanceFromCenter) * 10);
    
    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotationDegrees}deg)`,
      opacity,
      zIndex,
      transition: isSnapping ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 
                 isDragging ? 'none' : 
                 'all 0.25s ease-out'
    };
  };

  const displayedItems = useMemo(() => getVisibleItems(), [centerIndex, items, responsiveValues.count]);
  const isCenterExact = Math.abs(centerIndex - Math.round(centerIndex)) < 0.01;

  // --- Render Logic ---
  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          @keyframes singlePulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
            }
          }

          .album-item {
            transition: all 0.2s ease !important;
          }

          .album-item.pulsing {
            animation: singlePulse 0.3s ease-out forwards;
          }

          .album-item.playing::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background: linear-gradient(
              90deg, 
              transparent, 
              rgba(255, 255, 255, 0.2), 
              transparent
            );
            background-size: 200% 100%;
            border-radius: clamp(4px, 0.8vw, 8px);
            animation: shimmer 2s infinite;
            pointer-events: none;
          }

          .button-underglow {
            position: relative;
          }

          .button-underglow::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: inherit;
            filter: blur(8px);
            opacity: 0;
            z-index: -1;
            transition: opacity 0.2s ease;
            border-radius: inherit;
          }

          .button-underglow:hover::after {
            opacity: 0.6;
          }

          .nav-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            width: clamp(35px, 4vw, 50px);
            height: clamp(35px, 4vw, 50px);
            z-index: 1000;
            opacity: 0.8;
            transition: opacity 0.2s ease;
            pointer-events: auto;
          }

          .nav-arrow:hover {
            opacity: 1;
          }

          .nav-arrow.prev {
            left: calc(50% - clamp(95px, 10vw, 120px));
          }

          .nav-arrow.next {
            right: calc(50% - clamp(95px, 10vw, 120px));
          }

          .nav-arrow svg {
            width: 100%;
            height: 100%;
            fill: #ECE0C4;
          }
        `}
      </style>

      <div
        ref={containerRef}
        className="curved-albums-container"
        style={{
          position: 'relative',
          width: '100%',
          height: 'auto',
          overflow: 'visible',
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <button 
          className="nav-arrow prev" 
          onClick={navigatePrev}
          style={{
            display: centerIndex > 0 ? 'block' : 'none'
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        <button 
          className="nav-arrow next" 
          onClick={navigateNext}
          style={{
            display: centerIndex < (items?.length - 1) ? 'block' : 'none'
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>

        {displayedItems.map((itemData) => {
          const { item, index } = itemData;
          const style = getItemStyle(itemData);
          const isCentered = Math.abs(index - centerIndex) < 0.1;
          const isPlaying = item.uri === playingUri;
          const isPulsing = item.uri === pulsing;
          const isHovered = index === hoveredIndex;
          
          const itemSizeValue = `calc(${RESPONSIVE_ITEM_SIZE})`;
          const halfItemSizeValue = `calc(${RESPONSIVE_ITEM_SIZE} / -2)`;

          // Combine all transforms into one
          const baseTransform = style.transform;
          const scaleTransform = (isCentered || isHovered) ? ' scale(1.1)' : '';
          const combinedTransform = baseTransform + scaleTransform;

          return (
            <div
              key={item.uri || index}
              className={`album-item button-underglow ${isPlaying ? 'playing' : ''} ${isPulsing ? 'pulsing' : ''}`}
              style={{
                position: 'absolute',
                width: itemSizeValue,
                height: itemSizeValue,
                top: '50%',
                left: '50%',
                marginLeft: halfItemSizeValue,
                marginTop: halfItemSizeValue,
                transform: combinedTransform,
                opacity: style.opacity,
                zIndex: isHovered ? 1000 : style.zIndex,
                transition: style.transition,
                cursor: 'pointer',
                boxShadow: isPlaying ? 
                  '0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.1)' : 
                  '0 clamp(4px, 1vh, 8px) clamp(10px, 2vh, 20px) rgba(0,0,0,0.3)',
              }}
              onClick={() => handleItemClick(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={item.imageUrl || defaultAlbumArt}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 'clamp(4px, 0.8vw, 8px)',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transition: style.transition,
                }}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

// --- LibrarySection Component ---
const LibrarySection = ({ title, items, playUri }) => {
  const { playingUri } = useContext(PlayerContext);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [pulsing, setPulsing] = useState(false);

  // Calculate SVG dimensions based on title length
  const svgWidth = 1000;  // Fixed width for consistent arc
  const svgHeight = 100;  // Height for subtle arc
  const radius = 1500;    // Large radius for subtle curve
  
  // Create the arc path
  const startX = 0;
  const startY = svgHeight;
  const endX = svgWidth;
  const endY = svgHeight;
  const arcPath = `M ${startX},${startY} A ${radius},${radius} 0 0,1 ${endX},${endY}`;

  const handleItemClick = (index, item) => {
    setSelectedIndex(index);
    setPulsing(true);
    playUri(item.uri);
  };

  const getItemStyle = (index, item) => {
    const isSelected = selectedIndex === index;
    const isPlaying = item.uri === playingUri;
    const distanceFromCenter = Math.abs(index - selectedIndex);
    const scale = isSelected ? 1.1 : 1;
    const zIndex = isSelected ? 2 : 1;
    const transform = `scale(${scale}) translateY(${Math.pow(Math.abs(distanceFromCenter), 1.5) * 0.03}em) rotate(${distanceFromCenter * 0.8}deg)`;
    
    return {
      transform,
      zIndex,
      animation: isPlaying ? 'pulse 2s infinite' : isSelected && pulsing ? 'pulse 2s' : 'none',
      transition: 'transform 0.3s ease, z-index 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      '&:hover': {
        transform: `scale(1.05) translateY(${Math.pow(Math.abs(distanceFromCenter), 1.5) * 0.03}em) rotate(${distanceFromCenter * 0.8}deg)`,
        zIndex: 2
      }
    };
  };

  // Reset pulsing state when selection changes
  useEffect(() => {
    if (selectedIndex !== null) {
      const timer = setTimeout(() => {
        setPulsing(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedIndex]);

  // Check if any item is currently playing when component mounts
  useEffect(() => {
    if (playingUri) {
      const playingIndex = items.findIndex(item => item.uri === playingUri);
      if (playingIndex !== -1) {
        setSelectedIndex(playingIndex);
      }
    }
  }, [playingUri, items]);

  return (
    <div className="library-section"
      style={{
        position: 'relative',
        width: '100%',
        marginBottom: '25vh',
        overflow: 'visible',
      }}
    >
      {/* Title positioned above the scroll wheel */}
      <div className="section-title" 
        style={{ 
          position: 'relative',
          zIndex: 15, 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '8vh',
        }}
      >
        <svg
          width="100%"
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            overflow: 'visible',
          }}
        >
          <defs>
            <path
              id={`titlePath-${title}`}
              d={arcPath}
              fill="none"
            />
          </defs>
          <text
            style={{
              fontSize: RESPONSIVE_TITLE_SIZE,
              fontFamily: 'Loubag, sans-serif',
              fill: '#fcdba0',
              filter: 'drop-shadow(0 0 1px rgba(255, 199, 100, 0.25)) drop-shadow(0 0 20px rgba(255, 203, 100, 0.2))',
              letterSpacing: RESPONSIVE_TITLE_SPACING,
            }}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            <textPath
              href={`#titlePath-${title}`}
              startOffset="50%"
              textAnchor="middle"
            >
              {title}
            </textPath>
          </text>
        </svg>
      </div>

      <ScrollWheel items={items} playUri={playUri} />
    </div>
  );
};

// --- selectBestImage Function (Keep existing) ---
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

// --- LibraryTesting Component ---
const LibraryTesting = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);
  const { track, playUri } = useContext(PlayerContext);

  // State for library sections (Keep existing)
  const [ madeForYou, setMadeForYou ] = useState([]);
  const [ playlists, setPlaylists ] = useState([]);
  const [ podcasts, setPodcasts ] = useState([]);
  const [ albums, setAlbums ] = useState([]);
  const [ artists, setArtists ] = useState([]);

  const albumArtUrl = track?.album?.images?.[0]?.url || defaultAlbumArt;
  const colors = useColorThief(albumArtUrl);

  // sections definition (Keep existing)
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

  // Fetch functions (Keep existing)
  const fetchTopItems = (type) => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/top/" + type, {}, accessToken, invalidateAccess)
        .then((response) => {
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
  const fetchPlaylists = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/playlists", {}, accessToken, invalidateAccess)
        .then((response) => {
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
  const fetchPodcasts = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/shows", {}, accessToken, invalidateAccess)
        .then((response) => {
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
  const fetchAlbums = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/albums", {}, accessToken, invalidateAccess)
        .then((response) => {
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
  const fetchArtists = () => {
    if (accessToken) {
      performFetch("https://api.spotify.com/v1/me/following?limit=20", { type: "artist" }, accessToken, invalidateAccess)
        .then((response) => {
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

  // --- Render Logic ---
  return (
    <>
      {/* Fixed-position gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={track?.album?.images?.[0]?.url || "default"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '180px',
            zIndex: 5,
            pointerEvents: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          <AnimatedBlob
            colors={colors}
            style={{
              width: '100%',
              height: '100%',
              filter: 'blur(70px)',
              opacity: 0.75,
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: 0,
            }}
            static={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Main container */}
      <div style={{ 
        position: 'relative',
        minHeight: '100vh',
        overflow: 'visible',
      }}>
        <div style={{
          backgroundImage: `url(${backgroundPng})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          padding: '0',
          perspective: '1000px',
          overflow: 'visible',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Content container with continuous flow */}
          <div style={{
            position: 'relative',
            paddingTop: '5vh', // Reduced from 10vh
            overflow: 'visible',
            zIndex: 900,
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
