// Quick test to verify AI Gateway setup
const { streamText } = require('ai');

async function test() {
  try {
    const result = streamText({
      model: 'openai/gpt-4o-mini',
      prompt: 'Say hello in German',
      apiKey: process.env.AI_GATEWAY_API_KEY
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
    
    console.log('\n✅ AI Gateway works!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();