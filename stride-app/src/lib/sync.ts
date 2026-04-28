import { createClient } from './supabase/server';
import { getStravaActivities } from './strava';

export async function syncStravaActivities(userId: string) {
    const supabase = await createClient();

    // 1. Get user profile and tokens
    const { data: profile } = await supabase
        .from('profiles')
        .select('strava_access_token')
        .eq('id', userId)
        .single();

    if (!profile?.strava_access_token && process.env.STRAVA_CLIENT_ID) {
        throw new Error('Strava not connected');
    }

    // 2. Fetch latest activities (Mock or Real depends on env)
    const activities = await getStravaActivities(profile?.strava_access_token || 'demo_token');

    // 3. Find pending sessions for this user
    const { data: sessions } = await supabase
        .from('sessions')
        .select('*, training_plans(user_id)')
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: false });

    if (!sessions) return { count: 0 };

    let matchCount = 0;

    for (const activity of activities) {
        if (activity.type !== 'Run') continue;

        const activityDate = activity.start_date.split('T')[0];

        // Find a session on the same date
        const matchingSession = sessions.find(s => s.scheduled_date === activityDate);

        if (matchingSession) {
            // 4. Create workout log
            const { error: logError } = await supabase
                .from('workout_logs')
                .upsert({
                    user_id: userId,
                    session_id: matchingSession.id,
                    strava_activity_id: activity.id,
                    distance_meters: Math.round(activity.distance),
                    duration_seconds: activity.moving_time,
                    avg_pace_seconds_per_km: Math.round(activity.moving_time / (activity.distance / 1000)),
                    avg_heart_rate: Math.round(activity.average_heartrate),
                    notes: activity.name,
                    logged_at: activity.start_date
                }, { onConflict: 'strava_activity_id' });

            if (!logError) {
                // 5. Mark session as completed
                await supabase
                    .from('sessions')
                    .update({ status: 'completed' })
                    .eq('id', matchingSession.id);

                matchCount++;
            }
        }
    }

    return { count: matchCount };
}
