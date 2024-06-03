import axios from 'axios';

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';

const getAuthToken = async () => {
  // Implement OAuth2 token retrieval
};

export const fetchUserPlaylists = async () => {
  const token = await getAuthToken();
  const response = await axios.get(`${SPOTIFY_BASE_URL}/me/playlists`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
