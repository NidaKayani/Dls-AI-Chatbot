/**
 * cli-test.js
 * Simple interactive CLI client for testing the DLS AI Chatbot
 */

const readline = require('readline');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5100/api/ai/chat';
const JWT_SECRET = process.env.JWT_SECRET || 'e192781289402157bcc19d323c53d251fc25cd6ed13fa840eedf315008370f1b3373f1177601ff0ace6873870cbacc8c2796e141a9772376873ca195d4cef00d';

// Create a test JWT token
const testToken = jwt.sign(
  { id: 'user123', name: 'Test User' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: message,
      context: {
        currentTopic: 'boolean-algebra',
        difficulty: 'beginner',
      },
    });

    const options = {
      hostname: 'localhost',
      port: 5100,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${testToken}`,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode === 200) {
            resolve(parsed.reply);
          } else {
            reject(parsed.error || 'Unknown error');
          }
        } catch (err) {
          reject('Failed to parse response: ' + responseData);
        }
      });
    });

    req.on('error', (err) => {
      reject(`Connection error: ${err.message}`);
    });

    req.write(data);
    req.end();
  });
}

function promptUser() {
  rl.question('\n📚 You: ', async (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye!');
      rl.close();
      return;
    }

    if (!input.trim()) {
      promptUser();
      return;
    }

    try {
      console.log('\n⏳ DLS Mentor is thinking...');
      const reply = await sendMessage(input);
      console.log('\n🤖 DLS Mentor:', reply);
      promptUser();
    } catch (err) {
      console.error('\n❌ Error:', err);
      promptUser();
    }
  });
}

console.log('╔════════════════════════════════════════╗');
console.log('║   DLS AI Chatbot - Interactive CLI     ║');
console.log('╚════════════════════════════════════════╝');
console.log('\n📖 Topic: Boolean Algebra');
console.log('🎓 Difficulty: Beginner');
console.log('\nType your question and press Enter.');
console.log('Type "exit" or "quit" to leave.\n');

promptUser();
