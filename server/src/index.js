import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import comparisonRouter from './routes/comparison.js';
import nisarRouter from './routes/nisar.js';
import processingRouter from './routes/processing.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', healthRouter);
app.use('/api', comparisonRouter);
app.use('/api', nisarRouter);
app.use('/api', processingRouter);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EarthWatch Backend API',
    mission: 'NISAR (NASA-ISRO Synthetic Aperture Radar)',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      categories: '/api/comparison/categories',
      validateGeometry: '/api/geometry/validate',
      validateComparison: '/api/comparison/validate',
      requestComparison: '/api/comparison/request',
      nisarSearch: '/api/nisar/search',
      nisarPair: '/api/nisar/pair',
      nisarStatus: '/api/nisar/status',
      nisarSamples: '/api/nisar/samples',
      radarCompare: '/api/processing/compare',
      radarMethods: '/api/processing/methods'
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`[EarthWatch Backend] Server running on port ${PORT}`);
  console.log(`[EarthWatch Backend] Health check available at http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[EarthWatch Backend] Error: Port ${PORT} is already in use.`);
    console.error(`[EarthWatch Backend] Please stop any existing instance running on port ${PORT} or configure a different PORT in .env`);
  } else {
    console.error(`[EarthWatch Backend] Server error:`, err);
  }
  process.exit(1);
});
