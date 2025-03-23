import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import backgroundPng from '../assets/background.png';

// Temporary hard-coded API key for testing - REMOVE IN PRODUCTION
const GEMINI_API_KEY = 'AIzaSyD0FdPiQBQuu7zJx92nNEEnP322bkNIX4A';
// const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const Harmony = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

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
        model: "gemini-1.5-flash-latest",
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
    } catch (error) {
      console.error("Error initializing Gemini API:", error);
      setError('Failed to initialize Gemini API. Check console for details.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !model) return;

    // Add user message to chat
    const newUserMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate response using Gemini
      const content = [{ text: inputMessage }];
      const result = await model.generateContent({ contents: [{ role: 'user', parts: content }] });
      const responseText = result.response.text();
      
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

  return (
    <div style={{
      backgroundImage: `url(${backgroundPng})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px',
      color: '#ECE0C4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div className="glow" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>HARMONY</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>Your AI companion powered by Google Gemini</p>
      </div>

      {error ? (
        <div style={{
          width: '80%',
          maxWidth: '600px',
          padding: '20px',
          borderRadius: '15px',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          marginTop: '50px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Configuration Error</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div style={{
          width: '90%',
          maxWidth: '800px',
          height: '70vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(236, 224, 196, 0.3)',
          borderRadius: '15px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)'
        }}>
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
              <div key={index} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: msg.role === 'user' ? 'rgba(236, 224, 196, 0.2)' : 'rgba(100, 100, 255, 0.2)',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
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
        </div>
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


export default Harmony;
