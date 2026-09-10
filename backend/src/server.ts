import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import { seedDatabase } from './database/seed';
import { DB_PATH } from './database/schema';

import authRoutes from './routes/authRoutes';
import itemRoutes from './routes/itemRoutes';
import matchRoutes from './routes/matchRoutes';
import claimRoutes from './routes/claimRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize & Seed Database
seedDatabase();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve Static Image Uploads
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', itemRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api', claimRoutes);
app.use('/api', notificationRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'CampusFind Full-Stack Backend + Hybrid AI/DSA Engine',
    databasePath: DB_PATH,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler (Handles Multer & Route Errors cleanly)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message: `Image upload error: ${err.message}. Please select a photo under 25MB.`
    });
    return;
  }
  if (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'An unexpected error occurred on the server.'
    });
    return;
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CampusFind Server Running on http://localhost:${PORT}`);
  console.log(`📂 DB FILE LOCATION: ${DB_PATH}`);
  console.log(`🖼️  UPLOADS DIR: ${uploadsPath}`);
  console.log(`⚡ Hybrid AI + DSA Engine Active`);
  console.log(`=======================================================`);
});
