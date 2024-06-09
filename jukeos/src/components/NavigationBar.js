import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NavigationBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="navigation-bar"
    >
      <Link to="/home">Home</Link>
      <Link to="/library">Library</Link>
      <Link to="/settings">Settings</Link>
      <Link to="/harmony">Harmony</Link>
    </motion.div>
  );
};

export default NavigationBar;
