import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import estimateRoutes from './routes/estimateRoutes.js';
import authorizationRoutes from './routes/authorizationRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import repairOrderRoutes from './routes/repairOrderRoutes.js';
import technicianRoutes from './routes/technicianRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import cashUpRoutes from './routes/cashUpRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Ensure DB is connected for serverless environments (Vercel)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[DB] Serverless connection error:', err);
    }
  }
  next();
});

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Freedom Car & Truck Workshop Management System',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/authorizations', authorizationRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/repair-orders', repairOrderRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cash-up', cashUpRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handler
app.use(errorHandler);

export default app;
