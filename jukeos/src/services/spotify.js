import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

export const getAuthToken = async () => {
  // Extract the access token from the URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('access_token');

  if (token) {
    window.localStorage.setItem('token', token);
    return token;
  }

  const storedToken = window.localStorage.getItem('token');

  if (!storedToken) {
    window.location.href = 'http://localhost:3001/login';
    return null;
  }

  return storedToken;
};

export const fetchUserPlaylists = async () => {
  try {
    const token = await getAuthToken();
    console.log(token);
    spotifyApi.setAccessToken(token);
    const data = await spotifyApi.getUserPlaylists();
    return data;
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    throw error;
  }
};
