/**
 * List available Gemini models
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line: string) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${key}`)
  .then((r: any) => {
    console.log('Available Gemini models:\n');
    r.data.models.forEach((m: any) => {
      console.log(`  - ${m.name}`);
      if (m.supportedGenerationMethods) {
        console.log(`    Methods: ${m.supportedGenerationMethods.join(', ')}`);
      }
    });
  })
  .catch((e: any) => {
    console.error('Error:', e.response?.data || e.message);
  });


