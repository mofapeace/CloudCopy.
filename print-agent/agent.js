const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { printDocument } = require('./printer');

const configPath = path.join(__dirname, 'config.json');
let config = {
  shopId: '00000000-0000-0000-0000-000000000000',
  serverUrl: 'http://localhost:3000/api',
  printerName: 'default'
};

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const POLL_INTERVAL_MS = 5000; // 5 seconds
const api = axios.create({ baseURL: config.serverUrl });

async function pollQueue() {
  try {
    const res = await api.get(`/queue/${config.shopId}`);
    const jobs = res.data;

    if (jobs && jobs.length > 0) {
      console.log(`\n[Agent] Found ${jobs.length} jobs to print.`);
      
      for (const job of jobs) {
        try {
          await printDocument(job, config);
          // Confirm printed
          await api.post('/queue/printed', { jobId: job.id });
          console.log(`[Agent] Job ${job.id} marked as printed.`);
        } catch (err) {
          console.error(`[Agent] Failed to print job ${job.id}`, err.message);
        }
      }
    }
  } catch (err) {
    // Suppress connection refused logs when server is offline
    if (err.code !== 'ECONNREFUSED') {
      console.error('[Agent] Polling error:', err.message);
    }
  }
}

console.log('🖨️ Cloudkopii Print Agent Started');
console.log(`Connecting to: ${config.serverUrl}`);
console.log(`Shop ID: ${config.shopId}`);
console.log('Polling for jobs...');

setInterval(pollQueue, POLL_INTERVAL_MS);
// Initial poll
pollQueue();
