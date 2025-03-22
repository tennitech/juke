import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';


const Harmony = () => {
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    const fetchResponse = async () => {
      const apiKey = process.env.GEMINI_API_KEY;;
      if (!apiKey) {
        console.error("GEMINI_API_KEY is not defined.");
        return;
      } else console.log(apiKey);

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Introduce yourself.";
        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        setResponseText(answer);
      } catch (error) {
        console.error("Error fetching response:", error);
        return;
      }
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
