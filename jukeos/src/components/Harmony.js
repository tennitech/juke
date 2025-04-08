import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import backgroundPng from '../assets/background.png';
import cloudsSvg from '../assets/clouds.svg';
import harmonyGoldStar from '../assets/harmony-gold-star.svg';
import harmonyBlueStar from '../assets/harmony-blue-star.svg';
import AnimatedBlob from './AnimatedBlob';
// Import these or use your own cloud/star assets
// import largeStarVariants from '../assets/harmony-large.svg';
// import smallStarVariants from '../assets/star-small.svg';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Memoized cloud component for better performance
const Cloud = memo(({ src, animate, style }) => (
  <motion.img
    src={src}
    alt=""
    animate={animate}
    style={style}
  />
));

// Memoized star component for better performance
const Star = memo(({ src, animate, style, onClick }) => (
  <motion.img
    src={src}
    alt=""
    animate={animate}
    onClick={onClick}
    style={style}
  />
));

// Memoized message component
const ChatMessage = memo(({ role, content }) => (
  <div style={{
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    backgroundColor: role === 'user' ? 'rgba(236, 224, 196, 0.2)' : 'rgba(100, 100, 255, 0.2)',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    wordBreak: 'break-word'
  }}>
    {content}
  </div>
));

// Default blob colors for initial stage and stars stage
const defaultBlobColors = [
  'rgba(166, 104, 255, 1.0)',
  'rgba(151, 225, 251, 1.0)',
  'rgba(155, 198, 252, 1.0)'
];

// Red blob colors for active listening
const listeningBlobColors = ['rgb(255, 107, 107)', 'rgb(255, 71, 71)', 'rgb(209, 45, 45)'];

// Pulsing blob colors after listening (white/gray)
const pulsingBlobColors = ['rgb(255, 255, 255)', 'rgb(224, 224, 224)', 'rgb(204, 204, 204)'];

// Loading messages to display after speech ends
const loadingMessages = [
  "SPINNING UP SOME TUNES",
  "COMING RIGHT UP",
  "CURATING THE VIBE",
  "FINDING THE PERFECT BEAT",
  "MATCHING YOUR MOOD",
  "HARMONIZING FREQUENCIES",
  "TUNING THE COSMIC RADIO",
  "DECODING MUSICAL PATTERNS",
  "EXPLORING THE SOUNDSCAPE",
  "CRAFTING YOUR SONIC JOURNEY"
];

const Harmony = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const [uiStage, setUiStage] = useState('initial'); // 'initial', 'stars', 'chat'
  const [isListening, setIsListening] = useState(false);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  const recognitionRef = useRef(null);
  
  // Reference to scroll messages container to bottom
  const messagesEndRef = useRef(null);

  // Add inside your Harmony component to compute a vertical scale based on viewport height
  const [starScale, setStarScale] = useState(1);

  // New state variables
  const [blobColors, setBlobColors] = useState(defaultBlobColors);
  const [displayText, setDisplayText] = useState("TAP TO ASK HARMONY");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  
  // New state for cycling loading messages and managing voice state
  const [isProcessing, setIsProcessing] = useState(false);
  const [ellipsisCount, setEllipsisCount] = useState(0);
  const loadingMessageTimerRef = useRef(null);
  const ellipsisTimerRef = useRef(null);

  useEffect(() => {
    const updateScale = () => {
      const baselineHeight = 800; // Baseline height for scaling calculation
      const minScale = 0.4; // Minimum scale allowed
      const currentHeight = window.innerHeight;
      
      // More aggressive scaling formula
      const scale = Math.max(minScale, Math.min(1, currentHeight / baselineHeight));
      setStarScale(scale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Initialize Gemini API using environment variable
  useEffect(() => {
    try {
      // Check if we have the API key
      console.log('API key available:', !!GEMINI_API_KEY);
      
      if (!GEMINI_API_KEY) {
        setError('Gemini API key not found. Please add it to your .env file as REACT_APP_GEMINI_API_KEY.');
        return;
      }
      
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      setModel(genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }));

      // Start animation sequence
      const timer = setTimeout(() => {
        setUiStage('stars');
      }, 500);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Error initializing Gemini API:", error);
      setError('Failed to initialize Gemini API. Check console for details.');
    }
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to start a rotating series of loading messages with animated ellipsis
  const startLoadingMessageCycle = () => {
    // Clear any existing timers
    if (loadingMessageTimerRef.current) {
      clearInterval(loadingMessageTimerRef.current);
      loadingMessageTimerRef.current = null;
    }
    
    if (ellipsisTimerRef.current) {
      clearInterval(ellipsisTimerRef.current);
      ellipsisTimerRef.current = null;
    }
    
    // Get a random loading message to start
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    setDisplayText(randomMessage);
    setEllipsisCount(0);
    
    // Create a timer for ellipsis animation (every 400ms)
    ellipsisTimerRef.current = setInterval(() => {
      setEllipsisCount(prev => (prev + 1) % 4); // Cycle 0-3 (none, ., .., ...)
    }, 400);
    
    // Create a timer for message cycling (every 5 seconds)
    loadingMessageTimerRef.current = setInterval(() => {
      // Get a new message that's different from the current one
      let newMessage;
      let currentMessageWithoutEllipsis = displayText.replace(/\.+$/, '');
      
      do {
        newMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      } while (newMessage === currentMessageWithoutEllipsis && loadingMessages.length > 1);
      
      setDisplayText(newMessage);
      setEllipsisCount(0); // Reset ellipsis animation
    }, 5000);
  };
  
  // Function to stop the loading message cycle
  const stopLoadingMessageCycle = () => {
    if (loadingMessageTimerRef.current) {
      clearInterval(loadingMessageTimerRef.current);
      loadingMessageTimerRef.current = null;
    }
    
    if (ellipsisTimerRef.current) {
      clearInterval(ellipsisTimerRef.current);
      ellipsisTimerRef.current = null;
    }
  };
  
  // Effect to handle the full display text with ellipsis
  useEffect(() => {
    if (isProcessing && ellipsisCount > 0) {
      const baseText = displayText.replace(/\.+$/, '');
      const ellipsis = '.'.repeat(ellipsisCount);
      setDisplayText(baseText + ellipsis);
    }
  }, [ellipsisCount, isProcessing]);
  
  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      stopLoadingMessageCycle();
      cleanupAudioContext();
    };
  }, []);

  // Initialize Web Speech API and Audio API for voice level detection
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Update display text with interim or final results
        const transcript = finalTranscript || interimTranscript;
        const maxWords = 15; // Max words to display
        const words = transcript.trim().split(' ');
        const truncatedTranscript = words.length > maxWords
          ? '... ' + words.slice(-maxWords).join(' ')
          : transcript;

        // Only update if in voice mode and listening (not processing)
        if (uiStage === 'voice-listening' && !isProcessing) {
           setDisplayText(truncatedTranscript || 'LISTENING...'); // Show placeholder if empty
        }

        // If final transcript received, maybe process it?
        if (finalTranscript) {
          console.log("Final Transcript:", finalTranscript);
        }
      };
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        stopLoadingMessageCycle(); // Stop any ongoing message cycle
        
        if (uiStage === 'voice-listening') {
          setDisplayText('LISTENING...'); // Reset text on start
          setBlobColors(listeningBlobColors); // Ensure red colors on start
          
          // Try to setup audio analyzer for voice level detection
          setupVoiceLevelDetection();
        }
      };

      recognitionRef.current.onaudiostart = () => {
        if (uiStage === 'voice-listening') {
          setIsSpeaking(true); // User started speaking
        }
      };

      recognitionRef.current.onaudioend = () => {
        if (uiStage === 'voice-listening') {
          setIsSpeaking(false); // User stopped speaking
          startProcessingState();
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Check if we are still in voice mode. User might have clicked away.
        if (uiStage === 'voice-listening') {
          setIsSpeaking(false); // Ensure speaking state is false
          
          // If not already processing, start processing state
          if (!isProcessing) {
            startProcessingState();
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsSpeaking(false);
        
        // Handle error state if needed, maybe revert UI?
        if (uiStage === 'voice-listening') {
          setBlobColors(defaultBlobColors); // Revert colors on error
          setDisplayText("ERROR - TRY AGAIN");
          setIsProcessing(false);
          stopLoadingMessageCycle();
          
          // Clean up audio context
          cleanupAudioContext();
        }
      };

      setBrowserSupportsSpeechRecognition(true);
    } else {
      setBrowserSupportsSpeechRecognition(false);
      console.log('Browser does not support speech recognition');
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort(); // Stop any ongoing recognition
        } catch (err) {
          console.error("Error stopping speech recognition:", err);
        }
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onaudiostart = null;
        recognitionRef.current.onaudioend = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      }
      
      // Clean up audio context
      cleanupAudioContext();
      // Clean up message cycling
      stopLoadingMessageCycle();
    };
  }, [uiStage, isProcessing]);
  
  // Function to start the "processing" state (after voice input ends)
  const startProcessingState = () => {
    // Set state to processing
    setIsProcessing(true);
    
    // Apply visual changes
    setBlobColors(pulsingBlobColors);
    
    // Start the loading message cycle
    startLoadingMessageCycle();
    
    // Clean up audio context - no longer need mic access
    cleanupAudioContext();
  };
  
  // Function to restart listening
  const restartListening = () => {
    // Stop any ongoing message cycling
    stopLoadingMessageCycle();
    
    // Reset processing state
    setIsProcessing(false);
    
    // Clear any previous recognition that might be happening
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
    }
    
    // Change colors back to listening mode
    setBlobColors(listeningBlobColors);
    setDisplayText('LISTENING...');
    
    // Start the recognition again after a short delay
    setTimeout(() => {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Speech recognition restart error:', error);
        setDisplayText("ERROR - TRY AGAIN");
        setBlobColors(defaultBlobColors);
        setIsProcessing(false);
      }
    }, 100);
  };
  
  // Function to set up voice level detection using Web Audio API
  const setupVoiceLevelDetection = () => {
    try {
      // Only setup once and only if browser supports it
      if (!audioContextRef.current && window.AudioContext) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        // Request microphone access
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(stream => {
            microphoneStreamRef.current = stream;
            const microphone = audioContextRef.current.createMediaStreamSource(stream);
            microphone.connect(analyserRef.current);
            
            // Start analyzing audio levels
            analyzeAudioLevel();
          })
          .catch(err => {
            console.error("Error accessing microphone:", err);
          });
      } else if (audioContextRef.current && analyserRef.current) {
        // If already set up, just restart analysis
        analyzeAudioLevel();
      }
    } catch (err) {
      console.error("Error setting up audio analysis:", err);
    }
  };
  
  // Function to analyze audio levels
  const analyzeAudioLevel = () => {
    if (!analyserRef.current || uiStage !== 'voice-listening' || !isSpeaking) {
      return; // Stop if we're not in listening mode or the component unmounted
    }
    
    const dataArray = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    // Calculate audio level (0-1)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      // Convert from 0-255 to -128-127
      const amplitude = Math.abs((dataArray[i] - 128) / 128);
      sum += amplitude;
    }
    const avgAmplitude = sum / dataArray.length;
    
    // Smooth the level and apply some scaling to make it more reactive
    const scaledLevel = Math.min(1, avgAmplitude * 5); // Scale up for visibility
    setVoiceLevel(scaledLevel);
    
    // Continue analysis in animation frame
    requestAnimationFrame(analyzeAudioLevel);
  };
  
  // Clean up audio context resources - ensure thorough cleanup for cross-browser compatibility
  const cleanupAudioContext = () => {
    // Stop microphone stream if active
    if (microphoneStreamRef.current) {
      try {
        microphoneStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        microphoneStreamRef.current = null;
      } catch (err) {
        console.error("Error stopping microphone stream:", err);
      }
    }
    
    // Close audio context if open
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.suspend();
          // Don't actually close it as we might need it again
          // audioContextRef.current.close();
        }
      } catch (err) {
        console.error("Error suspending audio context:", err);
      }
    }
    
    // Reset voice level
    setVoiceLevel(0);
  };

  // Handle star click event to show mode selection
  useEffect(() => {
    const handleStarClick = () => {
      // Show mode selection screen
      setUiStage('mode-select');
    };
    
    document.addEventListener('harmony-stars-clicked', handleStarClick);
    
    return () => {
      document.removeEventListener('harmony-stars-clicked', handleStarClick);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !model) return;

    // Add user message to chat
    const promptSearch = "\n\nPlease make sure to find more than 3 items and include song name and artist name.";
    const promptFilter = "\n\nFrom this text above, make sure to filter 3 songs and their corressponding artists separated by newlines, without any other information and output in a format such that \"Song 1\nArtist 1\nSong 2\nArtist 2\nSong 3\nArtist 3\".";
    const newUserMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Gemini searching
      const contentSearch = [{ text: inputMessage + promptSearch }];
      const resultSearch = await model.generateContent({ contents: [{ role: 'user', parts: contentSearch }] });
      const responseSearch = resultSearch.response.text();
      
      // Gemini filtering
      const contentFilter = [{ text: responseSearch + promptFilter }];
      const resultFilter = await model.generateContent({ contents: [{ role: 'user', parts: contentFilter }] });
      const responseFilter = resultFilter.response.text();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'ai', content: responseFilter }]);
    } catch (error) {
      console.error("Error generating response:", error);
      
      // Extract more useful error information
      let errorMessage = "Sorry, I encountered an error processing your request.";
      
      if (error.message) {
        errorMessage += ` Error details: ${error.message}`;
      }
      
      if (error.status) {
        errorMessage += ` (Status code: ${error.status})`;
      }
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    }
  };

  // Simplified, more efficient animations
  const leftCloudVariants = {
    initial: { x: -300, opacity: 0 },
    stars: { x: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    'voice-listening': { x: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    chat: { x: -120, opacity: 0.5, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const rightCloudVariants = {
    initial: { x: 300, opacity: 0 },
    stars: { x: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    'voice-listening': { x: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    chat: { x: 120, opacity: 0.5, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const bottomCloudVariants = {
    initial: { y: 100, opacity: 0 },
    stars: { y: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    'voice-listening': { y: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    chat: { y: 50, opacity: 0.5, transition: { duration: 0.8, ease: "easeOut" } }
  };

  // Optimized, simplified animations
  const largeStarVariants = {
    initial: { opacity: 0, scale: 0.5 },
    stars: { opacity: 1, scale: 1, transition: { delay: 0.3, duration: 0.8, ease: "easeOut" } },
    'voice-listening': { opacity: 1, scale: 1, transition: { delay: 0.3, duration: 0.8, ease: "easeOut" } },
    chat: { opacity: 0, scale: 1.2, transition: { duration: 0.4 } }
  };

  const smallStarVariants = {
    initial: { opacity: 0, scale: 0.5 },
    stars: { opacity: 1, scale: 1, transition: { delay: 0.5, duration: 0.8, ease: "easeOut" } },
    'voice-listening': { opacity: 1, scale: 1, transition: { delay: 0.5, duration: 0.8, ease: "easeOut" } },
    chat: { opacity: 0, scale: 1.2, transition: { duration: 0.4 } }
  };

  const textVariants = {
    initial: { opacity: 0, y: 20 },
    stars: { opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.6, ease: "easeOut" } },
    'voice-listening': { opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.6, ease: "easeOut" } },
    chat: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  const chatContainerVariants = {
    initial: { opacity: 0 },
    chat: { opacity: 1, transition: { delay: 0.2, duration: 0.6 } },
    'mode-select': { opacity: 1, transition: { delay: 0.2, duration: 0.6 } }
  };

  // Define fadeInVariants for inner content animation
  const fadeInVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } }
  };

  // Lighter-weight idle animations
  const cloudIdleAnimation = {
    x: [0, 5, 0, -5, 0],
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.25, 0.5, 0.75, 1]
    }
  };

  // Gold star animation - clockwise rotation
  const goldStarIdleAnimation = {
    rotate: [0, 3, 0, -3, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.25, 0.5, 0.75, 1]
    }
  };

  // Blue star animation - counterclockwise rotation (opposite of gold star)
  const blueStarIdleAnimation = {
    rotate: [0, -3, 0, 3, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.25, 0.5, 0.75, 1]
    }
  };

  // Preload images for better performance
  useEffect(() => {
    const preloadImages = () => {
      new Image().src = backgroundPng;
      new Image().src = cloudsSvg;
      new Image().src = harmonyGoldStar;
      new Image().src = harmonyBlueStar;
    };
    preloadImages();
  }, []);

  // Function to handle Developer Mode button click
  const handleDeveloperModeClick = () => {
    setUiStage('chat');
  };

  // Function to handle Voice-Only Mode button click
  const handleVoiceOnlyModeClick = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      // Handle browsers without support if needed
      alert("Sorry, your browser doesn't support Speech Recognition.");
      return;
    }
    
    // Set initial state before transitioning to voice mode
    setBlobColors(listeningBlobColors); // Set red colors immediately
    setDisplayText('INITIALIZING...'); // Initial text
    setIsSpeaking(false); // Reset speaking state
    
    // Delay the UI stage change to ensure colors are set first
    setTimeout(() => {
      setUiStage('voice-listening');
      
      // Start listening with another small delay
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
          setDisplayText('LISTENING...');
        } catch (error) {
          console.error('Speech recognition start error:', error);
          setDisplayText("ERROR - CAN'T START");
          setBlobColors(defaultBlobColors);
          // Maybe revert stage?
          setTimeout(() => setUiStage('mode-select'), 1500);
        }
      }, 100);
    }, 50);
  }, [browserSupportsSpeechRecognition]);

  // Star container click handler with updated toggle behavior
  const handleStarContainerClick = useCallback(() => {
    if (uiStage === 'stars') {
      document.dispatchEvent(new CustomEvent('harmony-stars-clicked'));
    } else if (uiStage === 'voice-listening') {
      // Toggle behavior based on current state
      if (isProcessing) {
        // If currently processing, restart listening
        restartListening();
      } else {
        // If currently listening, stop and switch to processing
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            console.error("Error stopping speech recognition:", err);
          }
        }
        setIsListening(false);
        setIsSpeaking(false);
        startProcessingState();
      }
    }
  }, [uiStage, isProcessing]);

  // Define dynamic animation for stars based on blobColors and uiStage
  const useStarAnimation = (baseAnimation, isBlue = false) => {
    // Add safety check for blobColors
    if (!blobColors || !Array.isArray(blobColors) || blobColors.length === 0) {
      return baseAnimation;
    }

    // Determine if we should be in "pulsing mode" - after speech when colors are white/gray
    const isPulsingMode = uiStage === 'voice-listening' && 
                          blobColors[0] === pulsingBlobColors[0] &&
                          !isSpeaking;

    if (isPulsingMode) {
      // Return spinning animation when in pulsing mode (after speaking)
      return {
        rotate: 360,
        transition: {
          rotate: {
            type: 'spring',
            stiffness: 60,
            damping: 10,
            repeat: Infinity,
            repeatType: "loop",
            duration: 2
          }
        }
      };
    } else {
      // Return the original idle animation for all other cases
      return baseAnimation;
    }
  };

  // Calculate the dynamic animations based on current state
  const dynamicGoldStarAnimation = useStarAnimation(goldStarIdleAnimation);
  const dynamicBlueStarAnimation = useStarAnimation(blueStarIdleAnimation, true);

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      color: '#ECE0C4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: '#000000',
      willChange: 'transform' // Hint for browser hardware acceleration
    }}>
      {/* Left clouds */}
      <motion.div
        initial="initial"
        animate={uiStage}
        variants={leftCloudVariants}
        style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          width: '35%',
          pointerEvents: 'none',
          zIndex: 1,
          willChange: 'transform'
        }}
      >
        <Cloud 
          src={cloudsSvg}
          animate={(uiStage === 'stars' || uiStage === 'voice-listening') ? cloudIdleAnimation : undefined}
          style={{
            width: '100%',
            filter: 'brightness(0.7) contrast(1.1)',
            willChange: 'transform'
          }}
        />
      </motion.div>

      {/* Right clouds */}
      <motion.div
        initial="initial"
        animate={uiStage}
        variants={rightCloudVariants}
        style={{
          position: 'absolute',
          right: 0,
          top: '30%',
          width: '35%',
          pointerEvents: 'none',
          zIndex: 1,
          transform: 'scaleX(-1)',
          willChange: 'transform'
        }}
      >
        <Cloud 
          src={cloudsSvg}
          animate={(uiStage === 'stars' || uiStage === 'voice-listening') ? cloudIdleAnimation : undefined}
          style={{
            width: '100%',
            filter: 'brightness(0.7) contrast(1.1)',
            willChange: 'transform'
          }}
        />
      </motion.div>

      {/* Bottom clouds */}
      <motion.div
        initial="initial"
        animate={uiStage}
        variants={bottomCloudVariants}
        style={{
          position: 'absolute',
          left: '10%',
          bottom: '5%',
          width: '25%',
          pointerEvents: 'none',
          zIndex: 1,
          willChange: 'transform'
        }}
      >
        <Cloud 
          src={cloudsSvg}
          animate={(uiStage === 'stars' || uiStage === 'voice-listening') ? cloudIdleAnimation : undefined}
          style={{
            width: '100%',
            filter: 'brightness(0.7) contrast(1.1)',
            willChange: 'transform'
          }}
        />
      </motion.div>

      {/* Star content wrapper - this div contains both stars and text */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${starScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          height: 'auto',
          pointerEvents: (uiStage === 'stars' || uiStage === 'voice-listening') ? 'auto' : 'none',
          cursor: (uiStage === 'stars' || uiStage === 'voice-listening') ? 'pointer' : 'default',
          zIndex: 10
        }}
      >
        {/* Gold star container */}
        <motion.div
          initial="initial"
          animate={uiStage}
          variants={largeStarVariants}
          style={{
            position: 'relative',
            width: '300px',
            height: '300px',
            left: '0px',  // Shift left from center
            marginTop: '100px',
            marginBottom: '80px', // Space between stars and text
            pointerEvents: 'auto', // Allow pointer events on the container
            cursor: (uiStage === 'stars' || uiStage === 'voice-listening') ? 'pointer' : 'default', // Cursor only when interactive
            zIndex: 10
          }}
        >
          {/* Animated blob gradient behind stars */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}>
            <AnimatedBlob
              colors={blobColors}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '60% 40% 50% 50% / 50% 50% 60% 40%',
                filter: 'blur(40px)',
                boxShadow: '0 0 20px rgba(166, 104, 255, 0.8)',
                opacity: 0.9,
                pointerEvents: 'none',
                transition: 'all 1s ease-in-out'
              }}
              speed={0.4}
              voiceLevel={voiceLevel}
            />
          </div>
          
          {/* Gold star */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Star
              src={harmonyGoldStar}
              animate={(uiStage === 'stars' || uiStage === 'voice-listening') ? dynamicGoldStarAnimation : undefined}
              onClick={handleStarContainerClick}
              style={{
                width: '300px',
                height: 'auto',
                willChange: 'transform'
              }}
            />
          </div>
          
          {/* Blue star (positioned relative to gold star) */}
          <motion.div
            initial="initial"
            animate={uiStage}
            variants={smallStarVariants}
            style={{
              position: 'absolute',
              top: '-30px',
              left: 'calc(100% - 80px)',
              zIndex: 3
            }}
          >
            <Star
              src={harmonyBlueStar}
              animate={(uiStage === 'stars' || uiStage === 'voice-listening') ? dynamicBlueStarAnimation : undefined}
              style={{
                width: '120px',
                height: 'auto',
                willChange: 'transform'
              }}
            />
          </motion.div>
        </motion.div>

        {/* TAP TO ASK HARMONY text - positioned within the same scaled container */}
        <motion.div
          initial="initial"
          animate={uiStage}
          variants={textVariants}
          style={{
            textAlign: 'center',
            color: '#f5f5dc',
            fontFamily: 'Notable, sans-serif',
            fontSize: uiStage === 'voice-listening' ? '2.5rem' : '3.0rem',
            fontWeight: 'bold',
            letterSpacing: '0.3rem',
            textShadow: '0 0 8px rgba(255,255,255,0.4)',
            width: '100%',
            minHeight: '4rem',
            pointerEvents: 'none',
            transition: 'font-size 0.3s ease'
          }}
        >
          {displayText}
        </motion.div>
      </motion.div>

      {/* Mode Selection UI */}
      {uiStage === 'mode-select' && (
        <motion.div
          initial="initial"
          animate={uiStage}
          variants={chatContainerVariants}
          className="mode-select-container"
          style={{
            width: '90%',
            maxWidth: '600px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(236, 224, 196, 0.3)',
            borderRadius: '15px',
            backgroundColor: 'rgba(20, 20, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            zIndex: 20,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <motion.h2
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            style={{
              color: '#ECE0C4',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center',
              fontFamily: 'Notable, sans-serif',
              letterSpacing: '2px'
            }}
          >
            SELECT MODE
          </motion.h2>
          
          <motion.div 
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            style={{ 
              display: 'flex', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '30px',
              width: '100%'
            }}
          >
            {/* Developer Mode Button */}
            <button
              onClick={handleDeveloperModeClick}
              style={{
                backgroundColor: 'rgba(155, 198, 252, 0.2)',
                border: '2px solid rgba(155, 198, 252, 0.6)',
                borderRadius: '12px',
                padding: '20px 30px',
                width: '240px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ECE0C4'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(155, 198, 252, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(155, 198, 252, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                marginBottom: '10px',
                fontFamily: 'Notable, sans-serif'
              }}>
                Developer Mode
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                opacity: 0.8,
                textAlign: 'center',
                fontFamily: 'Loubag, sans-serif'
              }}>
                Text-based chat with code assistance
              </div>
            </button>
            
            {/* Voice-Only Mode Button */}
            <button 
              onClick={handleVoiceOnlyModeClick}
              style={{
                backgroundColor: 'rgba(166, 104, 255, 0.2)',
                border: '2px solid rgba(166, 104, 255, 0.6)',
                borderRadius: '12px',
                padding: '20px 30px',
                width: '240px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ECE0C4',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(166, 104, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(166, 104, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ 
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                backgroundColor: '#FFD700',
                color: '#000',
                fontSize: '0.7rem',
                padding: '3px 8px',
                borderRadius: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Experimental
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                marginBottom: '10px',
                fontFamily: 'Notable, sans-serif'
              }}>
                Voice-Only Mode
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                opacity: 0.8,
                textAlign: 'center',
                fontFamily: 'Loubag, sans-serif'
              }}>
                Hands-free conversation
              </div>
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Chat UI */}
      {(uiStage === 'chat' || error) && (
        <motion.div
          initial="initial"
          animate={uiStage}
          variants={chatContainerVariants}
          className="chat-container"
          style={{
          width: '90%',
          maxWidth: '800px',
          height: '70vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(236, 224, 196, 0.3)',
          borderRadius: '15px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(5px)', // Reduced blur for better performance
            zIndex: 20,
            willChange: 'opacity, transform'
          }}
        >
          {error ? (
            <div style={{
              width: '100%',
              height: '100%',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '15px' }}>Configuration Error</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {messages.length === 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                opacity: 0.7
              }}>
                <p>Start a conversation with Harmony...</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
                  <ChatMessage key={index} role={msg.role} content={msg.content} />
            ))}
            
            {isLoading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '15px 20px',
                borderRadius: '18px 18px 18px 4px',
                backgroundColor: 'rgba(100, 100, 255, 0.2)',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                gap: '5px'
              }}>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
                <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            padding: '15px',
            borderTop: '1px solid rgba(236, 224, 196, 0.3)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '12px 15px',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ECE0C4',
                marginRight: '10px'
              }}
            />
            
            {browserSupportsSpeechRecognition && (
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  backgroundColor: isListening ? 'rgba(255, 0, 0, 0.6)' : 'transparent',
                  border: '2px solid #ECE0C4',
                  color: '#ECE0C4',
                  padding: '10px',
                  borderRadius: '50%',
                  marginRight: '10px',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                {isListening ? (
                  // Stop square when recording
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="6" width="12" height="12" fill="#ECE0C4" />
                  </svg>
                ) : (
                  // Microphone icon when not recording
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z" 
                          stroke="#ECE0C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.35 9.65V11.35C4.35 15.57 7.78 19 12 19C16.22 19 19.65 15.57 19.65 11.35V9.65" 
                          stroke="#ECE0C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 19V22" stroke="#ECE0C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )}
            
            <button
              type="submit"
              disabled={!inputMessage.trim() || !model || isLoading}
              style={{
                backgroundColor: 'transparent',
                border: '2px solid #ECE0C4',
                color: '#ECE0C4',
                padding: '10px 20px',
                borderRadius: '25px',
                cursor: inputMessage.trim() && model && !isLoading ? 'pointer' : 'not-allowed',
                opacity: inputMessage.trim() && model && !isLoading ? 1 : 0.6
              }}
            >
              Send
            </button>
          </form>
            </>
          )}
        </motion.div>
      )}

      <style jsx>{`
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ECE0C4;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default memo(Harmony);
