import React, { useContext, useEffect, useState, useRef } from 'react';
import backgroundPng from '../assets/background.png';
import { useLocation } from 'react-router-dom';
import '../App.css';

import axios from 'axios';

import { performFetch, SpotifyAuthContext } from '../contexts/spotify';

function requestUserAuthorization() {  
  const redirectParams = new URLSearchParams({
    scope: [
      "user-read-email",
      "playlist-read-private",
      "playlist-read-collaborative"
    ].join(" ")
  });
  const redirectUrl = new URL("http://localhost:3001/login/spotify");
  redirectUrl.search = redirectParams.toString();
  
  window.location.href = redirectUrl;
}

async function fetchPlaylists(accessToken, invalidateAccess) {
  return await performFetch(
    "https://api.spotify.com/v1/me/playlists", {},
    accessToken, invalidateAccess
  );
}

function PlaylistList() {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);

  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists(accessToken, invalidateAccess)
        .then((playlists) => {
          setPlaylists(playlists?.items || []);
        })
        .catch((error) => {
          console.log("Error", error);

          setPlaylists([]);
        });
    }
  }, [accessToken]);

  return <>
    <h1>Your Playlists</h1>
    <button onClick={() => invalidateAccess()}>Invalidate</button>
    <ul>
      {
        playlists.map((playlist) =>
          <li key={playlist.id}>{playlist.name}</li>
        )
      }
    </ul>
  </>;
}

const Home = () => {
  const { accessToken } = useContext(SpotifyAuthContext);
  const navbarContentRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (navbarContentRef.current) {
      const activeLink = navbarContentRef.current.querySelector('.active');
      if (activeLink) {
        const navbarWidth = navbarContentRef.current.offsetWidth;
        const activeLinkCenter = activeLink.offsetLeft + activeLink.offsetWidth / 2;
        const offset = navbarWidth / 2 - activeLinkCenter;
        navbarContentRef.current.style.transform = `translateX(${offset}px)`;
      }
    }
  }, [location]);

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {
        !accessToken
          ? <button onClick={() => requestUserAuthorization()}>Login to Spotify</button>
          : <PlaylistList></PlaylistList>
      }
    </div>
  );
};

export default Home;