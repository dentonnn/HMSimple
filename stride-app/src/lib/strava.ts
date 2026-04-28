export const STRAVA_CONFIG = {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI || 'http://localhost:3001/api/strava/callback',
    scopes: 'read,activity:read_all,profile:read_all',
}

export function getStravaAuthUrl() {
    const params = new URLSearchParams({
        client_id: STRAVA_CONFIG.clientId || '',
        redirect_uri: STRAVA_CONFIG.redirectUri,
        response_type: 'code',
        approval_prompt: 'force',
        scope: STRAVA_CONFIG.scopes,
    })
    return `https://www.strava.com/oauth/authorize?${params.toString()}`
}

export async function exchangeStravaToken(code: string) {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: STRAVA_CONFIG.clientId,
            client_secret: STRAVA_CONFIG.clientSecret,
            code,
            grant_type: 'authorization_code',
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to exchange Strava token')
    }

    return response.json()
}

export async function refreshStravaToken(refreshToken: string) {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: STRAVA_CONFIG.clientId,
            client_secret: STRAVA_CONFIG.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to refresh Strava token')
    }

    return response.json()
}

export async function getMockActivities() {
    // Artificial delay to simulate network
    await new Promise(resolve => setTimeout(resolve, 800));

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    return [
        {
            id: 101,
            type: 'Run',
            start_date: new Date(now.getTime() - oneDay * 2).toISOString(),
            distance: 8200,
            moving_time: 2400, // 40 mins
            average_heartrate: 162,
            name: "Morning Interval Session"
        },
        {
            id: 102,
            type: 'Run',
            start_date: new Date(now.getTime() - oneDay * 4).toISOString(),
            distance: 6150,
            moving_time: 2310, // ~38 mins
            average_heartrate: 145,
            name: "Easy Recovery Run"
        },
        {
            id: 103,
            type: 'Run',
            start_date: new Date(now.getTime() - oneDay * 7).toISOString(),
            distance: 12500,
            moving_time: 4680, // 1h 18m
            average_heartrate: 158,
            name: "Sunday Long Run"
        }
    ];
}

export async function getStravaActivities(accessToken: string, before?: number, after?: number) {
    // Fallback if no credentials provided (Demo mode)
    if (!STRAVA_CONFIG.clientId || !STRAVA_CONFIG.clientSecret) {
        console.log("🛠️ Using Mock Strava Data (No API keys found)");
        return getMockActivities();
    }

    const params = new URLSearchParams()
    if (before) params.append('before', before.toString())
    if (after) params.append('after', after.toString())

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to fetch Strava activities')
    }

    return response.json()
}
