import React, { useContext, useEffect, useState } from 'react';
import { SpotifyAuthContext } from '../contexts/spotify';
import axios from 'axios';
import AnimatedBlob from './AnimatedBlob';
import backgroundPng from '../assets/background.png';

// TODO: Probably a better spot
// But I want to get this working
function requestUserAuthorization() {  
  const redirectParams = new URLSearchParams({
    scope: [
      "user-read-private",
      "user-read-email",
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-library-read",
      "user-follow-read",
      "user-top-read"
    ].join(" ")
  });
  const redirectUrl = new URL("http://localhost:3001/login/spotify");
  redirectUrl.search = redirectParams.toString();
  
  window.location.href = redirectUrl;
}

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

  /*
    This pulls the information of the current user. The information incldue: display name, email, number of 
    followers, profile image, Spotify URL, and country. The obtained information is stored in `setProfileData`.

    Relevant Documentation: https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
  */
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
        email: data.email || '(No email provided)',
        followers: data.followers?.total || '?',
        profileImage: data.images?.[0]?.url || require("../assets/default-user-profile-image.svg").default,
        spotifyUrl: data.external_urls?.spotify || 'N/A',
        country: data.country || 'Unknown Country'
      });
    }).catch((err) => {
      console.log("Error loading profile data:", err)
    });
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

          <button
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
            onClick={() => requestUserAuthorization()}
            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            Login in Spotify
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
