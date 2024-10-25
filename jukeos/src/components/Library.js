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
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      <div style={{ marginTop: '100px', position: 'relative', width: '800px', height: '800px' }}>
        <svg width="800" height="800" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <path id="circlePath" d="M 400,400 m 0,300 a 300,300 0 1,1 0,-600 a 300,300 0 1,1 0,600" />
          </defs>
          <text fill="#ECE0C4" fontFamily="Loubag" fontSize="50">
            <textPath href="#circlePath" startOffset="50%" textAnchor="middle">
              <tspan dy="10" dx="0" transform="rotate(90 400 400)">PLAYLISTS</tspan>
            </textPath>
          </text>
        </svg>
      </div>
      <div>
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
