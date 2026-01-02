import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Only allow in development to avoid accidental exposure
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const hasMassiveKey = !!process.env.MASSIVE_API_KEY;
  const massiveKeyLength = process.env.MASSIVE_API_KEY ? process.env.MASSIVE_API_KEY.length : 0;

  return NextResponse.json({
    env: {
      MASSIVE_API_KEY: hasMassiveKey ? `present (length: ${massiveKeyLength})` : 'missing',
      MASSIVE_S3_KEY: !!process.env.MASSIVE_S3_KEY ? 'present' : 'missing',
      MASSIVE_S3_SECRET: !!process.env.MASSIVE_S3_SECRET ? 'present' : 'missing',
      MASSIVE_S3_ENDPOINT: process.env.MASSIVE_S3_ENDPOINT || null,
      MASSIVE_S3_BUCKET: process.env.MASSIVE_S3_BUCKET || null,
      NEXT_PUBLIC_USE_MASSIVE: process.env.NEXT_PUBLIC_USE_MASSIVE || null,
      NODE_ENV: process.env.NODE_ENV || null,
    },
  });
}
