import { NextResponse } from 'next/server'
import { checkDbHealth } from '@/lib/db'

export async function GET() {
  const dbOk = await checkDbHealth()
  return NextResponse.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
  }, { status: dbOk ? 200 : 503 })
}
