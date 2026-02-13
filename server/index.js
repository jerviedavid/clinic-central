import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import clinicsRoutes from './routes/clinics.js';
import superadminRoutes from './routes/superadmin.js';
import patientsRoutes from './routes/patients.js';
import billingRoutes from './routes/billing.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

const BANNER_VERSION = "2026-02-02-V2";

app.use(cors({
  origin: [
    'http://localhost:5173',        // Vite dev server
    'http://localhost:5000',        // Direct access
    'https://localhost',            // Capacitor iOS
    'capacitor://localhost',        // Capacitor iOS native
    'http://localhost',             // Capacitor Android
    'https://life-clinic-management-system.vercel.app',  // Production
  ],
  credentials: true
}));
// Increase payload size limit for file uploads (images/attachments)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Debug logger
app.use((req, res, next) => {
  res.setHeader('X-Server-Version', BANNER_VERSION);
  console.log(`[${new Date().toISOString()}] [${BANNER_VERSION}] ${req.method} ${req.url}`);
  if (req.method === 'POST') console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/clinics', clinicsRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api', dataRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: BANNER_VERSION,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  SERVER VERSION: ${BANNER_VERSION}`);
  console.log(`  Server running on port ${PORT}`);
  console.log(`========================================`);
});
