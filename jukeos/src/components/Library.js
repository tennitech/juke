import React, { useState } from 'react';
import backgroundPng from '../assets/background.png';
import '../App.css';

const Library = () => {
  const [savedTracks, setSavedTracks] = useState([]);

  // TODO: Load saved tracks

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div>
        <h1>Your Library</h1>
        {savedTracks.length ? (
          <ul>
            {savedTracks.map((item) => (
              <li key={item.track.id}>{item.track.name} - {item.track.artists[0].name}</li>
            ))}
          </ul>
        ) : (
          <p>Loading your saved tracks...</p>
        )}
      </div>
    </div>
  );
};

export default Library;