import { getStravaAuthUrl } from '@/lib/strava'
import { NextResponse } from 'next/server'

export async function GET() {
    // Redirect to Strava OAuth page
    const url = getStravaAuthUrl()
    return NextResponse.redirect(url)
}
