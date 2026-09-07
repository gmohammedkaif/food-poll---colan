import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { imagekit } from '../config/imagekit.js';
import { env } from '../config/env.js';

// Setup local uploads directory for dev fallback
const uploadsDir = path.resolve(process.cwd(), 'uploads/foods');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed.'));
    }
  }
});

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
}

export async function uploadImage(file: Express.Multer.File, customName?: string): Promise<UploadResult> {
  const fileName = (customName || `food_${Date.now()}_${file.originalname}`).replace(/[^a-zA-Z0-9._-]/g, '_');

  if (imagekit) {
    try {
      const response = await imagekit.upload({
        file: file.buffer,
        fileName,
        folder: '/pollhub/foods',
        useUniqueFileName: true
      });

      return {
        url: response.url,
        fileId: response.fileId,
        name: response.name
      };
    } catch (error) {
      console.error('[ImageKit] Upload failed, falling back to local storage:', error);
    }
  }

  // Local fallback
  const uniqueName = `${Date.now()}-${fileName}`;
  const filePath = path.join(uploadsDir, uniqueName);
  await fs.promises.writeFile(filePath, file.buffer);

  const localUrl = `http://localhost:${env.PORT}/uploads/foods/${uniqueName}`;
  return {
    url: localUrl,
    fileId: `local_${uniqueName}`,
    name: uniqueName
  };
}

export async function deleteImage(fileId: string): Promise<void> {
  if (!fileId) return;

  if (fileId.startsWith('local_')) {
    const localName = fileId.replace('local_', '');
    const filePath = path.join(uploadsDir, localName);
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn('[ImageService] Failed to delete local image:', err);
      }
    }
    return;
  }

  if (imagekit) {
    try {
      await imagekit.deleteFile(fileId);
    } catch (err) {
      console.warn('[ImageKit] Failed to delete file:', err);
    }
  }
}
