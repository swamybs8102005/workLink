const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const jobsRouter = require('./routes/jobs');
const servicesRouter = require('./routes/services');
const applicationsRouter = require('./routes/applications');

dotenv.config();

const app = express();

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) => {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origin === 'null') {
        callback(null, true);
        return;
      }

      if (configuredOrigins.length === 0 || configuredOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WorkLink API is healthy' });
});

app.use('/api/jobs', jobsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/applications', applicationsRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;