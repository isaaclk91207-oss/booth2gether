import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';

const UPLOADS_DIR = path.resolve('uploads');

function ensureUploadsDir(subdir: string): string {
  const dir = path.join(UPLOADS_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function saveLocal(
  buffer: Buffer,
  roomId: string,
  userId: string,
  shotIndex: number,
): Promise<string> {
  const dir = ensureUploadsDir(roomId);
  const filename = `${userId}_${shotIndex}.jpg`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${roomId}/${filename}`;
}

async function saveR2(
  buffer: Buffer,
  roomId: string,
  userId: string,
  shotIndex: number,
): Promise<string> {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const key = `photos/${roomId}/${userId}_${shotIndex}.jpg`;
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    }),
  );

  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function savePhoto(
  buffer: Buffer,
  roomId: string,
  userId: string,
  shotIndex: number,
): Promise<string> {
  if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID) {
    return saveR2(buffer, roomId, userId, shotIndex);
  }
  return saveLocal(buffer, roomId, userId, shotIndex);
}
