import React, { useState } from 'react';
import backgroundPng from '../assets/background.png';
import '../App.css';

const Harmony = () => {
  const [recommendations, setRecommendations] = useState([]);

  // TODO: Load recommendations from Spotify API

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