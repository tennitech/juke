import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import backgroundPng from '../assets/background.png';
import '../App.css';
import 'slick-carousel/slick/slick.css'; 
import 'slick-carousel/slick/slick-theme.css';

const Library = () => {
  const [savedArtists, setArtists] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [savedPodcasts, setSavedPodcasts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));

  useEffect(() => {
    if (token) {
      fetchSavedTracks();
      fetchSavedPodcasts();
    }
  }, [token]);

  const fetchArtists = async() => {
    axios.get(
      "https://api.spotify.com/v1/me/albums", {
        headers: {
          "Authorization": "Bearer " + token
        }
      }
    ).then((response) => {
      setArtists(response.items);
    }).catch((error) => console.log("Error in fetchArtists in Library.js", error));
  }

  const fetchSavedTracks = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/tracks', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Fetched saved tracks:', data);
      setSavedTracks(data.items);
    } catch (error) {
      console.error('Error fetching saved tracks:', error);
    }
  };

  const fetchSavedPodcasts = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/shows', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Fetched saved podcasts:', data);
      setSavedPodcasts(data.items);
    } catch (error) {
      console.error('Error fetching saved podcasts:', error);
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
  };

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      <div style={{ marginTop: '20px', position: 'relative', width: '800px', height: '800px' }}>
        <svg width="800" height="800" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <path id="circlePath" d="M 400,400 m 0,300 a 300,300 0 1,1 0,-600 a 300,300 0 1,1 0,600" />
          </defs>
          <text fill="#ECE0C4" fontFamily="Loubag" fontSize="50">
            <textPath href="#circlePath" startOffset="50%" textAnchor="middle">
              <tspan dy="10" dx="0" transform="rotate(90 400 400)">PLAYLISTS</tspan>
            </textPath>
          </text>
        </svg>
      </div>
      <div style={{ marginTop: '10px', width: '800px' }}>
        <Slider {...settings}>
          {savedTracks.length > 0 ? (
            savedTracks.map((item, index) => (
              <div key={index}>
                <img src={item.track.album.images[0].url} alt={`Album Art ${index}`} style={{ width: '100%', height: 'auto' }} />
              </div>
            ))
          ) : (
            <div>No album art available</div>
          )}
        </Slider>
      </div>
      <div>
        {savedTracks.length ? (
          <ul>
            {savedTracks.map((item) => (
              <li key={item.track.id}>{item.track.name} - {item.track.artists[0].name}</li>
            ))}
          </ul>
        ) : (
          <p>Loading your saved tracks...</p>
        )}
      </div>
      <div style={{ marginTop: '50px', position: 'relative', width: '800px', height: '800px' }}>
        <svg width="800" height="800" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <path id="podcastPath" d="M 400,400 m 0,300 a 300,300 0 1,1 0,-600 a 300,300 0 1,1 0,600" />
          </defs>
          <text fill="#ECE0C4" fontFamily="Loubag" fontSize="50">
            <textPath href="#podcastPath" startOffset="50%" textAnchor="middle">
              <tspan dy="10" dx="0" transform="rotate(90 400 400)">PODCASTS</tspan>
            </textPath>
          </text>
        </svg>
      </div>
      <div>
        {savedPodcasts.length ? (
          <ul>
            {savedPodcasts.map((item) => (
              <li key={item.show.id}>{item.show.name}</li>
            ))}
          </ul>
        ) : (
          <p>Loading your saved podcasts...</p>
        )}
      </div>
    </div>
  );
};

export default Library;
