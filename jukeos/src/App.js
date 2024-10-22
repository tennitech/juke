import React, { useContext, useEffect, useState } from 'react';

import axios from 'axios';
import { ProvideSpotifyAuthContext, SpotifyAuthContext } from './contexts/spotify';

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

function fetchPlaylists(accessToken) {
  return new Promise((resolve, reject) => {
    axios.get("https://api.spotify.com/v1/me/playlists", {
      headers: {
        "Authorization": "Bearer " + accessToken
      }
    }).then((response) => {
      resolve(response.data);
    }).catch((error) => {
      reject(error);
    });
  });
}

function PlaylistList() {
  const { accessToken } = useContext(SpotifyAuthContext);

  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists(accessToken).then(
        (response) => setPlaylists(response.items)
      ).catch((error) => {
        // TODO: Handle this

        console.log(error);
      });
    }
  }, [accessToken]);

  return (
    <ul>{
      playlists.map(
        (playlist, i) => <li key={i}>
          <img
            height="64px" width="64px"
            src={playlist.images[0].url}
            alt={playlist.name}
          ></img>
          {playlist.name}
        </li>
      )
    }</ul>
  );
}

function SpotifyView() {
  const { accessToken } = useContext(SpotifyAuthContext);

  return (
    accessToken
      ? <PlaylistList></PlaylistList>
      : <button onClick={() => requestUserAuthorization()}>Login to Spotify</button>
  );
}

function App() {
  return (
    <ProvideSpotifyAuthContext>
      <SpotifyView></SpotifyView>
    </ProvideSpotifyAuthContext>
  );
}

export default App;
