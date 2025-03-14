import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const Harmony = () => {
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    const fetchResponse = async () => {
      const genAI = new GoogleGenerativeAI("No.");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Can you tell me the difference between 's  and IBM's Qiskit?";
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      
      setResponseText(answer);
    };

    fetchResponse();
  }, []);

  return (
    <p style={{ color: 'white' }}>
      {responseText || "Thinking..."}
    </p>
  );
};

export default Harmony;
