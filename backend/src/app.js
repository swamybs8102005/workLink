const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const jobsRouter = require('./routes/jobs');
const servicesRouter = require('./routes/services');
const applicationsRouter = require('./routes/applications');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
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