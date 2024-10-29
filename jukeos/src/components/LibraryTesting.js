import React, { useState } from 'react';
import Slider from 'react-slick';
import backgroundPng from '../assets/background.png';
import mainGradient from '../assets/main-gradient.svg';
import defaultAlbumArt from '../assets/default-album-art.png';
import '../App.css';
import 'slick-carousel/slick/slick.css'; 
import 'slick-carousel/slick/slick-theme.css';

const LibrarySection = ({ title, items, index }) => {
  // TODO: Backend - These settings should adapt based on the number of items returned from Spotify API
  // Consider adding loading states and error handling for API responses
  const settings = {
    dots: false,
    infinite: items.length > 7,
    speed: 500,
    slidesToShow: Math.min(7, items.length),
    slidesToScroll: 1,
    centerMode: items.length > 7,
    centerPadding: '0px',
    cssEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
    swipeToSlide: true,
    draggable: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(5, items.length),
          infinite: items.length > 5
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: Math.min(3, items.length),
          infinite: items.length > 3
        }
      }
    ]
  };

  const sectionStyle = {
    transform: `perspective(1000px) rotateX(20deg) translateY(${index * 50}px)`,
    marginBottom: '150px',
    overflow: 'hidden'
  };

  // TODO: Backend - When integrating with Spotify:
  // - Handle cases where items array is empty or undefined
  // - Add loading states while fetching data
  // - Handle API errors gracefully
  if (!items || items.length === 0) {
    return (
      <div className="library-section" style={sectionStyle}>
        <div className="section-title glow">
          <h2>{title}</h2>
        </div>
        <div className="carousel-container">
          <div style={{ textAlign: 'center', color: '#ECE0C4' }}>
            No items available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="library-section" style={sectionStyle}>
      <div className="section-title glow">
        <h2>{title}</h2>
      </div>
      <div className="carousel-container">
        <Slider {...settings}>
          {/* TODO: Backend - Map over actual Spotify data here
              Expected item structure from Spotify API:
              - item.imageUrl: URL to album/playlist/podcast artwork
              - item.title: Name of the album/playlist/podcast
              - Consider adding onClick handlers for each item to play/view details
          */}
          {items.map((item, index) => (
            <div key={index} className="carousel-item">
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
        </Slider>
      </div>
    </div>
  );
};

const LibraryTesting = () => {
  // TODO: Backend - Replace this mock data with actual Spotify API integration
  // Required Spotify API endpoints:
  // - GET /v1/me/playlists (for playlists)
  // - GET /v1/me/shows (for podcasts)
  // - GET /v1/me/albums (for albums)
  // Consider implementing pagination if needed
  const [sections] = useState([
    {
      title: 'PLAYLISTS',
      items: Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Playlist' })
    },
    {
      title: 'PODCASTS',
      items: Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Podcast' })
    },
    {
      title: 'ALBUMS',
      items: Array(10).fill({ imageUrl: defaultAlbumArt, title: 'Album' })
    }
  ]);

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
              key={index}
              title={section.title}
              items={section.items}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LibraryTesting;
