import { useState, useEffect, useRef, memo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import backgroundPng from '../assets/background.png';
import cloudsSvg from '../assets/clouds.svg';
import harmonyGoldStar from '../assets/harmony-gold-star.svg';
import harmonyBlueStar from '../assets/harmony-blue-star.svg';
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

  // Initialize Web Speech API
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      setBrowserSupportsSpeechRecognition(true);
    } else {
      setBrowserSupportsSpeechRecognition(false);
      console.log('Browser does not support speech recognition');
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
      }
    };
  }, []);

  const handleStarClick = () => {
    setUiStage('chat');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !model) return;

    // Add user message to chat
    const formatPrompt = " Please list only the song titles you found, separated by newlines. Do not include any descriptions, bullet points, or additional text.";
    const newUserMessage = { role: 'user', content: inputMessage + formatPrompt };
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate response using Gemini
      const content = [{ text: inputMessage }];
      const result = await model.generateContent({ contents: [{ role: 'user', parts: content }] });
      const responseText = result.response.text();
      console.log(responseText);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'ai', content: responseText }]);
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
    chat: { x: -120, opacity: 0.5, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const rightCloudVariants = {
    initial: { x: 300, opacity: 0 },
    stars: { x: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    chat: { x: 120, opacity: 0.5, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const bottomCloudVariants = {
    initial: { y: 100, opacity: 0 },
    stars: { y: 0, opacity: 0.85, transition: { duration: 1, ease: "easeOut" } },
    chat: { y: 50, opacity: 0.5, transition: { duration: 0.8, ease: "easeOut" } }
  };

  // Optimized, simplified animations
  const largeStarVariants = {
    initial: { opacity: 0, scale: 0.5 },
    stars: { opacity: 1, scale: 1, transition: { delay: 0.3, duration: 0.8, ease: "easeOut" } },
    chat: { opacity: 0, scale: 1.2, transition: { duration: 0.4 } }
  };

  const smallStarVariants = {
    initial: { opacity: 0, scale: 0.5 },
    stars: { opacity: 1, scale: 1, transition: { delay: 0.5, duration: 0.8, ease: "easeOut" } },
    chat: { opacity: 0, scale: 1.2, transition: { duration: 0.4 } }
  };

  const textVariants = {
    initial: { opacity: 0, y: 20 },
    stars: { opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.6, ease: "easeOut" } },
    chat: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  const chatContainerVariants = {
    initial: { opacity: 0 },
    chat: { opacity: 1, transition: { delay: 0.2, duration: 0.6 } }
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

  const starIdleAnimation = {
    rotate: [0, 3, 0, -3, 0],
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
          animate={uiStage === 'stars' ? cloudIdleAnimation : undefined}
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
          animate={uiStage === 'stars' ? cloudIdleAnimation : undefined}
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
          animate={uiStage === 'stars' ? cloudIdleAnimation : undefined}
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
          pointerEvents: 'none',
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
            left: '0px',  // Shift left from center
            marginTop: '100px',
            marginBottom: '80px', // Space between stars and text
            pointerEvents: 'auto', // Enable clicking
            cursor: uiStage === 'stars' ? 'pointer' : 'default',
            zIndex: 10
          }}
        >
          <Star
            src={harmonyGoldStar}
            animate={uiStage === 'stars' ? starIdleAnimation : undefined}
            onClick={uiStage === 'stars' ? handleStarClick : undefined}
            style={{
              width: '300px',
              height: 'auto',
              willChange: 'transform'
            }}
          />
          
          {/* Blue star (positioned relative to gold star) */}
          <motion.div
            initial="initial"
            animate={uiStage}
            variants={smallStarVariants}
            style={{
              position: 'absolute',
              top: '-20px',
              left: 'calc(100% - 60px)',
              zIndex: 11
            }}
          >
            <Star
              src={harmonyBlueStar}
              animate={uiStage === 'stars' ? starIdleAnimation : undefined}
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
            fontSize: '3.0rem',
            fontWeight: 'bold',
            letterSpacing: '0.3rem',
            textShadow: '0 0 8px rgba(255,255,255,0.4)',
            width: '100%',
            pointerEvents: 'none'
          }}
        >
          TAP TO ASK HARMONY
        </motion.div>
      </motion.div>

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
