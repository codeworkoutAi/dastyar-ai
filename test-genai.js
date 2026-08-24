import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  console.log("Calling generateContentStream...");
  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'hello',
    });
    console.log("Stream returned!");
    for await (const chunk of stream) {
      console.log(chunk.text);
    }
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}
run();
