require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

// Import routes
const uploadRoute = require('./routes/upload');
const pinRoute = require('./routes/pin');
const queueRoute = require('./routes/queue');
const shopRoute = require('./routes/shop');
const jobsRoute = require('./routes/jobs');
const jobRoute = require('./routes/job');
const authRoute = require('./routes/auth');

// Initialize cleanup service cron jobs
require('./services/cleanup');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload', uploadRoute);
app.use('/api/pin', pinRoute);
app.use('/api/queue', queueRoute);
app.use('/api/shop', shopRoute);
app.use('/api/jobs', jobsRoute);
app.use('/api/job', jobRoute);
app.use('/api/auth', authRoute);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cloudkopii API',
    endpoints: [
      'GET /health',
      'POST /api/upload',
      'POST /api/pin/verify',
      'POST /api/pin/release',
      'GET /api/queue',
      'GET /api/shop'
    ]
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`☁️ Cloudkopii Server running on http://localhost:${PORT}`);
});
