import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

import { withAuth } from '@/lib/middleware-utils';

export const runtime = 'nodejs';

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function sanitizeFileBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const safeName = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safeName || 'drink-image';
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { error: 'Image uploads are not configured.' },
          { status: 500 }
        );
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'Choose an image file to upload.' },
          { status: 400 }
        );
      }

      const extension = allowedImageTypes.get(file.type);

      if (!extension) {
        return NextResponse.json(
          { error: 'Upload a JPEG, PNG, or WebP image.' },
          { status: 400 }
        );
      }

      if (file.size > maxImageSize) {
        return NextResponse.json(
          { error: 'Image must be 5 MB or smaller.' },
          { status: 400 }
        );
      }

      const pathname = [
        'menu-images',
        `${sanitizeFileBaseName(file.name)}-${crypto.randomUUID()}.${extension}`,
      ].join('/');
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: file.type,
      });

      return NextResponse.json({ imageUrl: blob.url });
    } catch (error) {
      console.error('Manager menu image upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload image.' },
        { status: 500 }
      );
    }
  });
}
