import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let warnedNotConfigured = false;

function getClient(): { client: S3Client; bucket: string; publicBaseUrl: string } | null {
  const accountId = process.env['R2_ACCOUNT_ID'];
  const accessKeyId = process.env['R2_ACCESS_KEY_ID'];
  const secretAccessKey = process.env['R2_SECRET_ACCESS_KEY'];
  const bucket = process.env['R2_BUCKET'];
  const publicBaseUrl = process.env['R2_PUBLIC_BASE_URL'];

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    if (!warnedNotConfigured) {
      console.warn('[storage] R2 not configured — skipping meal image upload');
      warnedNotConfigured = true;
    }
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, bucket, publicBaseUrl };
}

// Uploads a base64 data URL to R2 under `meals/{key}.jpg`. Returns the public URL,
// or null if R2 isn't configured or imageDataUrl isn't a base64 data URL — caller
// should leave meal_logs.image_url unset in that case.
export async function uploadMealImage(imageDataUrl: string, key: string): Promise<string | null> {
  if (!imageDataUrl.startsWith('data:')) return null;

  const r2 = getClient();
  if (!r2) return null;

  const [meta, data] = imageDataUrl.split(',');
  if (!data) return null;
  const contentType = meta?.split(';')[0]?.split(':')[1] ?? 'image/jpeg';
  const buffer = Buffer.from(data, 'base64');
  const objectKey = `meals/${key}.jpg`;

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `${r2.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
}
