import ImageKit from 'imagekit';
import { env } from './env.js';

let imagekitInstance: ImageKit | null = null;

if (env.IMAGEKIT_PUBLIC_KEY && env.IMAGEKIT_PRIVATE_KEY && env.IMAGEKIT_URL_ENDPOINT) {
  try {
    imagekitInstance = new ImageKit({
      publicKey: env.IMAGEKIT_PUBLIC_KEY,
      privateKey: env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT
    });
    console.log('[ImageKit] ImageKit initialized with configured credentials.');
  } catch (err) {
    console.warn('[ImageKit] Failed to initialize ImageKit client:', err);
  }
} else {
  console.log('[ImageKit] ImageKit credentials not supplied in .env. Using built-in local static image storage handler.');
}

export const imagekit = imagekitInstance;
