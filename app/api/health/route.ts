import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hostel-management-api',
    version: process.env['npm_package_version'] ?? '0.1.0',
  });
}
