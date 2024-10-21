import React, { useEffect, useState } from 'react';

import axios from 'axios';

function requestUserAuthorization() {  
  const redirectParams = new URLSearchParams({
    scope: "user-read-email playlist-read-private playlist-read-collaborative"
  });
  const redirectUrl = new URL("http://localhost:3001/login/spotify");
  redirectUrl.search = redirectParams.toString();
  
  window.location.href = redirectUrl;
}

function loadSpotifyTokens(setAccessToken, setRefreshToken) {
  const accessToken = localStorage.getItem("spotify_access_token");
  const refreshToken = localStorage.getItem("spotify_refresh_token");

  if (accessToken && refreshToken) {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  }
}

function saveSpotifyTokens(accessToken, refreshToken) {
  localStorage.setItem("spotify_access_token", accessToken);
  localStorage.setItem("spotify_refresh_token", refreshToken);
}

function fetchPlaylists(accessToken, onError) {
  return new Promise((resolve, reject) => {
    axios.get("https://api.spotify.com/v1/me/playlists", {
      headers: {
        "Authorization": "Bearer " + accessToken
      }
    }).then((response) => {
      resolve(response.data);
    }).catch((error) => {
      onError(error);
    });
  });
}

function App() {
  const [accessToken, setAccessToken] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const [playlists, setPlaylists] = useState([]);

  if (!accessToken && !refreshToken) {
    loadSpotifyTokens(setAccessToken, setRefreshToken);
  }

  console.log("Rerender", accessToken, refreshToken);

  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);

    if (params.get("access_token")) {
      const accessToken = params.get("access_token");
      const scope = params.get("scope");
      const expiresIn = params.get("expires_in");
      const refreshToken = params.get("refresh_token");

      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      saveSpotifyTokens(accessToken, refreshToken);

      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);
      console.log("Scope:", scope);

      window.history.pushState("Search Params", "", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]);
    }
  }

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists(
        accessToken,
        () => {
          // TODO: Attempt to refresh
          setAccessToken(null);
        }
      ).then((response) => {
        setPlaylists(response.items);
      })
    }
  }, [accessToken]);

  return (
    <div>
      {
        !!accessToken
          ? <ul>{
              playlists.map(
                (playlist, i) => <li key={i}>
                  <img height="64px" width="64px" src={playlist.images[0].url}></img>
                  {playlist.name}
                </li>
              )
            }</ul>
          : <button onClick={() => requestUserAuthorization()}>Login Spotify</button>
      }
    </div>
  );
}

export default App;
