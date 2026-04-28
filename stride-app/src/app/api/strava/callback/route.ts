import { exchangeStravaToken } from '@/lib/strava'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
        return NextResponse.redirect(new URL('/settings?error=strava_auth_failed', request.url))
    }

    try {
        const tokenData = await exchangeStravaToken(code)
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Update profile with Strava data
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                strava_athlete_id: tokenData.athlete.id,
                strava_access_token: tokenData.access_token,
                strava_refresh_token: tokenData.refresh_token,
                strava_token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return NextResponse.redirect(new URL('/settings?error=profile_update_failed', request.url))
        }

        return NextResponse.redirect(new URL('/settings?success=strava_connected', request.url))
    } catch (error) {
        console.error('Strava callback error:', error)
        return NextResponse.redirect(new URL('/settings?error=strava_callback_failed', request.url))
    }
}
