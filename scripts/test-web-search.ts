import dotenv from 'dotenv';
dotenv.config();

const questions = [
  'قیمت امروز دلار چنده؟',
  'آخرین اخبار ایران چیست؟',
  'امروز چندم است و چه مناسبت‌هایی دارد؟'
];

async function runTests() {
  for (const q of questions) {
    console.log(`\n\n==========================================`);
    console.log(`🗣️ Question: ${q}`);
    console.log(`==========================================\n`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          apiConfig: {
            activeProvider: 'gemini',
            gemini: { apiKey: process.env.GEMINI_API_KEY, modelName: 'gemini-3.1-flash-lite' },
            webSearch: true
          }
        })
      });

      if (!response.body) {
        console.log('No response body');
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.chunk) {
                  process.stdout.write(data.chunk);
                } else if (data.error) {
                  console.error('\nAPI Error:', data.error);
                }
              } catch (e) { 
                console.error('Parse error:', e, 'Raw:', dataStr);
              }
            }
          }
        }
      }
      console.log('\n'); // Add newline after response
    } catch (err) {
      console.error('Error:', err);
    }
  }
}

runTests();
