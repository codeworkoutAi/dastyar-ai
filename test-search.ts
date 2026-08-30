import { SmartWebAgent } from './server/services/WebSearchAgent';
import { apiConfig } from './server/api';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log("Testing search...");
  const result = await SmartWebAgent.processQuery("آب و هوا شیراز", []);
  console.log("Result length:", result.length);
  console.log(result.slice(0, 500));
}

test().catch(console.error);
