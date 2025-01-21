import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Library from './components/Library';
import Settings from './components/Settings';
import Harmony from './components/Harmony';
import StartupScreen from './components/StartupScreen';
import FadeTransition from './components/FadeTransition';
import Profile from './components/Profile';

import Player from './components/Player';

import { ProvideSpotifyAuthContext } from './contexts/spotify';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust this time as needed

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AppContent isLoading={isLoading} />
    </Router>
  );
}

function AppContent({ isLoading }) {
  const location = useLocation();

  return (
    <ProvideSpotifyAuthContext>
      <StartupScreen isLoading={isLoading} />
      <NavigationBar />
      <Player>
        <div className="page-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<FadeTransition><Home /></FadeTransition>} />
              <Route path="/library" element={<FadeTransition><Library /></FadeTransition>} />
              <Route path="/settings" element={<FadeTransition><Settings /></FadeTransition>} />
              <Route path="/harmony" element={<FadeTransition><Harmony /></FadeTransition>} />
              <Route path="/profile" element={<FadeTransition><Profile /></FadeTransition>} />
            </Routes>
          </AnimatePresence>
        </div>
      </Player>
    </ProvideSpotifyAuthContext>
  );
}

export default App;
