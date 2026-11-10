import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { scopedEnv } from '@shared/utils/scopedEnv';
import { logger } from '@shared/utils/logger';
import { config } from '../config/index';

// Railway containers have no persistent disk: files written to ./uploads vanish on every deploy.
// When Cloudinary credentials are present, avatars go there (permanent https URL).
// Without them (local dev) we keep the old disk behaviour.
const cloudName = scopedEnv('USER', 'CLOUDINARY_CLOUD_NAME');
const apiKey = scopedEnv('USER', 'CLOUDINARY_API_KEY');
const apiSecret = scopedEnv('USER', 'CLOUDINARY_API_SECRET');

export const cloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

const AVATAR_FOLDER = 'wewatch/avatars';

/** Stores an avatar image and returns the value saved on the user (absolute URL or /uploads path). */
export const saveAvatar = async (userId: string, buffer: Buffer, originalName: string): Promise<string> => {
  if (cloudinaryEnabled) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: AVATAR_FOLDER,
          public_id: userId, // one image per user, a new upload replaces the old one
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
          transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }, { quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            logger.error('Avatar upload to Cloudinary failed', { error: error?.message });
            return reject(error ?? new Error('Avatar upload failed'));
          }
          resolve(result.secure_url);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  const dir = path.join(config.uploadPath, 'avatars');
  await fs.promises.mkdir(dir, { recursive: true });
  const ext = path.extname(originalName).toLowerCase();
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await fs.promises.writeFile(path.join(dir, fileName), buffer);
  return `/uploads/avatars/${fileName}`;
};
