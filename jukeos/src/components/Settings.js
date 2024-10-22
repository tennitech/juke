import React, { useState } from 'react';
import backgroundPng from '../assets/background.png';
import '../App.css';

const Settings = () => {
  const [user, setUser] = useState(null);

  // TODO: Fetch user profile

  const handleLogout = () => {
    // TODO
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
        <h1>Settings</h1>
        {user ? (
          <div>
            <p>Logged in as: {user.display_name}</p>
            <p>Email: {user.email}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <p>Loading user information...</p>
        )}
      </div>
    </div>
  );
};

export default Settings;