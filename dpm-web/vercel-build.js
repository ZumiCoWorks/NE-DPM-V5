#!/usr/bin/env node

// Build script for Vercel deployment
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🚀 Building for Vercel deployment...');

// Build the frontend
console.log('📦 Building frontend...');
execSync('npm run build', { stdio: 'inherit' });

// Create a simple serverless function wrapper
console.log('🔧 Creating serverless wrapper...');
const serverlessWrapper = `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the Express app
import app from './api/index.js';

// Export for Vercel
export default app;
`;

writeFileSync('./api/vercel-entry.js', serverlessWrapper);

console.log('✅ Build complete!');
console.log('📋 Ready for Vercel deployment');