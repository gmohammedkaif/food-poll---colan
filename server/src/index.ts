import http from 'http';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { imagekit } from './config/imagekit.js';
import { initSocket } from './services/socketService.js';
import { syncPollStatuses } from './services/pollService.js';
import { auditMiddleware } from './middleware/auditMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/index.js';
import { User } from './models/User.js';
import { SystemSetting } from './models/SystemSetting.js';
import { Food } from './models/Food.js';
import { seedFoods } from './scripts/seedFoods.js';

async function bootstrapDefaults() {
  // Ensure global settings exist
  let settings = await SystemSetting.findOne({ key: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await SystemSetting.create({
      key: 'GLOBAL_SETTINGS',
      defaultStartTime: env.DEFAULT_POLL_START_TIME,
      defaultEndTime: env.DEFAULT_POLL_END_TIME,
      timezone: env.DEFAULT_TIMEZONE,
      allowVoteChangeDefault: true,
      defaultResultVisibility: 'VOTER_NAMES_VISIBLE',
      maxActiveSessionsPerEmployee: 3,
      autoFlagSuspiciousVotes: true
    });
    console.log('[Bootstrap] Global settings initialized.');
  }

  // Ensure authoritative Colan logo is stored in ImageKit and MongoDB
  if (settings && !settings.logoUrl) {
    try {
      const candidates = [
        path.resolve(process.cwd(), '../client/src/assets/logo.png'),
        path.resolve(process.cwd(), 'uploads/logo.png'),
        path.resolve(process.cwd(), '../client/public/logo.png'),
      ];
      const logoPath = candidates.find((p) => fs.existsSync(p));
      if (logoPath) {
        const logoBuffer = await fs.promises.readFile(logoPath);
        if (imagekit) {
          console.log('[Bootstrap] Syncing official Colan logo to ImageKit...');
          const response = await imagekit.upload({
            file: logoBuffer,
            fileName: 'colan_pollhub_official_logo.png',
            folder: '/pollhub/branding',
            useUniqueFileName: false
          });
          settings.logoUrl = response.url;
          settings.logoFileId = response.fileId;
          await settings.save();
          console.log(`[Bootstrap] Official logo synced to ImageKit & MongoDB: ${response.url}`);
        } else {
          settings.logoUrl = '/logo.png';
          await settings.save();
        }
      }
    } catch (err) {
      console.warn('[Bootstrap] Logo ImageKit upload failed, will fallback to local asset:', err);
    }
  }

  // Ensure default Admin exists if zero admins
  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  if (adminCount === 0) {
    const adminId = (env.ADMIN_BOOTSTRAP_ID || 'ADMIN001').trim().toUpperCase();
    const adminName = env.ADMIN_BOOTSTRAP_NAME || 'System Administrator';
    const adminPassword = env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin@PollHub2026!';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await User.create({
      employeeId: adminId,
      name: adminName,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      department: 'IT Operations'
    });

    console.log(`[Bootstrap] Initial admin created automatically (${adminId}).`);
  }

  // Ensure initial food catalog items exist if empty
  const foodCount = await Food.countDocuments();
  if (foodCount === 0) {
    await seedFoods();
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  // Security & standard middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in local development
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-device-id']
    })
  );

  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Audit extraction middleware
  app.use(auditMiddleware);

  // Serve static uploads for local image storage fallback
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'PollHub Server',
      serverTimeUtc: new Date().toISOString(),
      timezone: env.DEFAULT_TIMEZONE
    });
  });

  // Mount API router
  app.use('/api', apiRateLimiter, apiRouter);

  // 404 Handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
      code: 'NOT_FOUND'
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  // Connect to Database
  await connectDB();
  await bootstrapDefaults();

  // Run initial poll lifecycle sync
  await syncPollStatuses();

  // Schedule server-side heartbeat for automatic poll status transitions (every 10 seconds)
  const pollHeartbeatInterval = setInterval(async () => {
    try {
      await syncPollStatuses();
    } catch (err) {
      console.error('[Heartbeat Error] Failed to sync poll statuses:', err);
    }
  }, 10000);

  // Start HTTP Server
  server.listen(env.PORT, () => {
    console.log('====================================================');
    console.log(`🚀 POLLHUB SERVER RUNNING AT: http://localhost:${env.PORT}`);
    console.log(`⏰ Server UTC Time : ${new Date().toISOString()}`);
    console.log(`🌐 Config Timezone : ${env.DEFAULT_TIMEZONE}`);
    console.log(`📱 Client URL      : ${env.CLIENT_URL}`);
    console.log('====================================================');
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    clearInterval(pollHeartbeatInterval);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((error) => {
  console.error('[Fatal Startup Error]:', error);
  process.exit(1);
});
