import React, { useContext, useEffect, useState } from 'react';
import { SpotifyAuthContext } from '../contexts/spotify';
import axios from 'axios';
import AnimatedBlob from './AnimatedBlob';
import backgroundPng from '../assets/background.png';

const Profile = () => {
  const { accessToken } = useContext(SpotifyAuthContext);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    followers: 0,
    profileImage: '',
    spotifyUrl: '',
    country: ''
  });
  const [dominantColors, setDominantColors] = useState(['#4CAF50', '#2196F3']);

  useEffect(() => {
    if (accessToken) {
      loadProfileData(accessToken);
    }
  }, [accessToken]);

  const loadProfileData = (accessToken) => {
    if (!accessToken) return;

    axios.get("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": "Bearer " + accessToken
      }
    }).then((response) => {
      const data = response.data;
      setProfileData({
        displayName: data.display_name || 'Spotify User',
        email: data.email || 'No email provided',
        followers: data.followers?.total || 0,
        profileImage: data.images?.[0]?.url || require("../assets/default-user-profile-image.svg").default,
        spotifyUrl: data.external_urls?.spotify || '#',
        country: data.country || 'Unknown'
      });
    }).catch((err) => console.log("Error loading profile data:", err));
  };

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px',
      color: '#ECE0C4',
      textAlign: 'center',
    }}>
      <div style={{ marginTop: '100px' }}>
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
          <AnimatedBlob colors={dominantColors} />
          <img
            src={profileData.profileImage}
            alt="Profile"
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          />
        </div>

        <h1 style={{ 
          fontSize: '4rem', 
          marginTop: '20px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          {profileData.displayName}
        </h1>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '20px',
          maxWidth: '600px',
          margin: '30px auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Email</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>{profileData.email}</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Followers</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>{profileData.followers}</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Country</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>{profileData.country}</p>
          </div>

          <a 
            href={profileData.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              background: '#1DB954',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '20px',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            Open in Spotify
          </a>
        </div>
      </div>
    </div>
  );
};

export default Profile;
