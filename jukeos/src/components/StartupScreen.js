import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jukeIcon from '../assets/juke-icon.svg';
import jukeLogo from '../assets/juke-logo.svg';

const StartupScreen = ({ isLoading }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const logoVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <motion.img
              src={jukeIcon}
              alt="Juke Icon"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ width: '100px', height: '100px' }}
            />
            <motion.img
              src={jukeLogo}
              alt="Juke Logo"
              variants={logoVariants}
              animate="pulse"
              style={{ width: '150px' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartupScreen;