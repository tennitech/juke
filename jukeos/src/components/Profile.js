import React, { useContext, useEffect, useState } from 'react';
import { SpotifyAuthContext, performFetch } from '../contexts/spotify';
import spotifyWhiteLogo from "../assets/spotify-white-icon.svg";


// TODO: Probably a better spot
// But I want to get this working
export function requestUserAuthorization() {
  const redirectParams = new URLSearchParams({
    scope: [
      "user-read-private",
      "user-read-email",
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-library-read",
      "user-follow-read",
      "user-top-read",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "user-read-recently-played",
      "streaming"
    ].join(" ")
  });
  const redirectUrl = new URL("http://localhost:3001/login/spotify");
  redirectUrl.search = redirectParams.toString();
  
  window.location.href = redirectUrl;
}


const Profile = () => {
  const { accessToken, invalidateAccess } = useContext(SpotifyAuthContext);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    followers: 0,
    profileImage: '',
    spotifyUrl: '',
    country: ''
  });

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

    performFetch(
      "https://api.spotify.com/v1/me", {}, accessToken, invalidateAccess
    ).then((data) => {
      setProfileData({
        displayName: data.display_name || 'Spotify User',
        email: data.email || 'Unknown Email',
        followers: data.followers?.total || '?',
        profileImage: data.images?.[0]?.url || require("../assets/default-user-profile-image.svg").default,
        spotifyUrl: data.external_urls?.spotify || 'Unknown URL',
        country: data.country || 'Unknown Country',
        subscription: data.product || "Unknown Subscription Status"
      });
    }).catch((err) => {
      console.log("Error loading profile data:", err)
    });
  };

  return (
    <div style={{
      padding: '20px',
      color: '#ECE0C4',
      textAlign: 'center',
    }}>
      <div style={{
        overflow: "hidden"
      }}>
          <img
            src={profileData.profileImage}
            alt="Profile"
            style={{
              width: '13vw',
              borderRadius: '50%',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          />

        <h1 style={{ 
          fontSize: '3rem',
          marginTop: '0px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {profileData.displayName}
        </h1>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '20px',
          width: "min-content",
          minWidth: "40vw",
          margin: '30px auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{marginBottom: '10px'}}>
            <h3 style={{margin: '0 0 5px 0'}}>Email</h3>
            <p style={{margin: 0, opacity: 0.8}}>{profileData.email}</p>
          </div>

          <div style={{marginBottom: '10px'}}>
            <h3 style={{margin: '0 0 5px 0'}}>Followers</h3>
            <p style={{margin: 0, opacity: 0.8}}>{profileData.followers}</p>
          </div>

          <div style={{marginBottom: '10px'}}>
            <h3 style={{margin: '0 0 5px 0'}}>Country</h3>
            <p style={{margin: 0, opacity: 0.8}}>{profileData.country}</p>
          </div>

          <button
              style={{
                backgroundColor: "#1DB954", // Same as Profile login
                color: "white",
                marginTop: "10px",
                padding: "8px 26px",
                fontFamily: 'Loubag, sans-serif',
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(255,255,255,0.2)",
                transition: "transform 0.2s ease",

              }}
              onClick={() => {requestUserAuthorization();}}
              onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            <img
                src={spotifyWhiteLogo}
                alt="Spotify Logo"
                style={{width: "20px", height: "20px", translate: "-10px 2px"}}
            />
            Sign in with Spotify
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
