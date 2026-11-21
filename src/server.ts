import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { seedDatabase } from './utils/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    const mongoUri = await connectDB();
    console.log(`[Server] Database ready: ${mongoUri}`);

    // Auto-seed if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Running initial system seed...');
      await seedDatabase(false);
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` FREEDOM CAR & TRUCK WORKSHOP MANAGEMENT SYSTEM     `);
      console.log(` Backend REST API running on port: ${PORT}          `);
      console.log(` http://localhost:${PORT}/api/health                `);
      console.log(`====================================================`);
    });
  } catch (err: any) {
    console.error('[Server] Critical failure during startup:', err);
    process.exit(1);
  }
}

startServer();
