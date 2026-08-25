import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import v1Routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'X-Session-ID', 'Authorization'],
  })
);
app.use(express.json());

// Request logger for development
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount API v1
app.use('/api/v1', v1Routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

app.listen(PORT, () => {
  console.log(`🚀 CameraHub Backend API đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 Base API endpoint: http://localhost:${PORT}/api/v1`);
});
