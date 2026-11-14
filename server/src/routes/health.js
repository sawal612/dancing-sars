import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EarthWatch Geospatial Engine',
    mission: process.env.MISSION_NAME || 'NISAR',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;

