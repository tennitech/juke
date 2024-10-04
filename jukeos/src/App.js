import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Library from './components/Library';
import Settings from './components/Settings';
import Harmony from './components/Harmony';

function App() {
  return (
    <Router>
      <div>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/harmony" element={<Harmony />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;