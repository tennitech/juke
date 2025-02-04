import React, { useState } from 'react';
import backgroundPng from '../assets/background.png';
import jukeIcon from '../assets/juke-icon.svg';
import '../App.css';

const Settings = () => {
  const [networkStatus] = useState('Connected'); // This would be dynamic in a real implementation

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px',
      color: '#ECE0C4'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px'
      }}>
        {/* Network Section */}
        <div className="glow" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>NETWORK</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '1.5rem' }}>STATUS:</span>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              boxShadow: '0 0 10px #4CAF50'
            }}></div>
          </div>
        </div>

        {/* Updates Section */}
        <div className="glow" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>UPDATES</h2>
          <button style={{
            backgroundColor: 'transparent',
            border: '2px solid #ECE0C4',
            color: '#ECE0C4',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}>
            CHECK FOR UPDATES
          </button>
          <p style={{ marginTop: '10px' }}>v0.0.0 ALPHA</p>
        </div>

        {/* About Section */}
        <div className="glow" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>ABOUT</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <p style={{ marginRight: '10px' }}>POWERED BY</p>
            <img src={jukeIcon} alt="Juke Icon" style={{ width: '50px', height: '50px' }} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ color: '#ECE0C4' }}>J</span>
              <span style={{ color: '#ECE0C4' }}>U</span>
              <span style={{ color: '#ECE0C4' }}>K</span>
              <span style={{ color: '#ECE0C4' }}>E</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;