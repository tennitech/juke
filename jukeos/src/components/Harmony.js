import { GoogleGenerativeAI } from '@google/generative-ai';


const genAI = new GoogleGenerativeAI("DON'T YOU THINK.");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = "Can you tell me the difference between Google's Cirq and IBM's Qiskit?";

const result = await model.generateContent(prompt);
console.log(result.response.text());

const Harmony = () => {
  return;
};

export default Harmony;
