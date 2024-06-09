import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import NavigationBar from './components/NavigationBar'; // Import the NavigationBar
import Library from './components/Library'; // Import the Library screen
import Settings from './components/Settings';
import Harmony from './components/Harmony';

function App() {
  return (
    <Router>
      <div>
        <NavigationBar /> {/* This will show on all pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/Harmony" element={<Harmony />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
