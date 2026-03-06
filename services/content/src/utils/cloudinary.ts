import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export type UploadFolder = 'movies/videos' | 'movies/posters' | 'movies/backdrops';

interface UploadResult {
  url: string;
  publicId: string;
  duration?: number;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: UploadFolder,
  resourceType: 'video' | 'image',
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        chunk_size: 6_000_000, // 6MB chunks for large video files
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload failed', { error: error?.message });
          return reject(error ?? new Error('Upload failed'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId: string, resourceType: 'video' | 'image'): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
