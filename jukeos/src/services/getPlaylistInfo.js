import React, { useState, useEffect } from 'react';
import axios from 'axios';


/* 
  This module pulls playlist information with given playlistID from 
  Spotify.

  The token variable exists for testing only. In the distribution 
  version, the token variable will be deleted, and we will use the  
  real authentication token obtained from Spotify after logging in.
*/
const token = "";
const playlistID = "";
const [playlists, setPlaylists] = useState([]);

const getPlaylistInfo = async () => {
  // This makes an Axios get request to obtain the information of the playlist with playListID.
  const { data } = await axios.get('https://api.spotify.com/v1/me/playlists/' + playlistID, {
    headers: {
      Authorization: 'Bearer ' + token
    }
  }).then((response) => {
    // This is for testing only. This should be removed in the distributing version.
    response.json().then((json) => {
      console.log(json);
    })
  });

  return;
};


export default getPlaylistInfo;