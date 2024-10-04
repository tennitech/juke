import React, { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import backgroundPng from '../assets/background.png';
import '../App.css';

const spotifyApi = new SpotifyWebApi();

const Harmony = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));

  useEffect(() => {
    if (token) {
      spotifyApi.setAccessToken(token);
      fetchRecommendations();
    }
  }, [token]);

  const fetchRecommendations = async () => {
    try {
      const data = await spotifyApi.getRecommendations({ seed_genres: ['pop', 'rock'] });
      console.log('Fetched recommendations:', data);
      setRecommendations(data.tracks);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div>
        <h1>Harmony Recommendations</h1>
        {recommendations.length ? (
          <ul>
            {recommendations.map((track) => (
              <li key={track.id}>{track.name} - {track.artists[0].name}</li>
            ))}
          </ul>
        ) : (
          <p>Loading recommendations...</p>
        )}
      </div>
    </div>
  );
};

export default Harmony;