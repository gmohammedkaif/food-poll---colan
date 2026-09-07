import dotenv from 'dotenv';
import path from 'path';

// Load root .env or server .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  MONGODB_URI: process.env.MONGODB_URI || '',
  
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'pollhub_dev_access_secret_key_12345',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'pollhub_dev_refresh_secret_key_67890',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'pollhub_cookie_secret_dev',

  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  DEFAULT_POLL_START_TIME: process.env.DEFAULT_POLL_START_TIME || '11:00',
  DEFAULT_POLL_END_TIME: process.env.DEFAULT_POLL_END_TIME || '12:30',

  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || '',
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || '',
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || '',

  ADMIN_BOOTSTRAP_ID: process.env.ADMIN_BOOTSTRAP_ID || 'ADMIN001',
  ADMIN_BOOTSTRAP_NAME: process.env.ADMIN_BOOTSTRAP_NAME || 'System Administrator',
  ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin@PollHub2026!',

  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:admin@colaninfotech.com'
};
