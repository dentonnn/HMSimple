import { syncStravaActivities } from '../src/lib/sync';
import { createClient } from '../src/lib/supabase/server';

async function testSync() {
    console.log('🧪 Testing Strava Sync Integration...');

    // Use a dummy user ID for testing matching logic
    const mockUserId = '00000000-0000-0000-0000-000000000000';

    try {
        console.log('Running syncStravaActivities...');
        const result = await syncStravaActivities(mockUserId);
        console.log('✅ Sync result:', JSON.stringify(result, null, 2));

        const supabase = await createClient();
        const { data: logs, error } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', mockUserId);

        if (error) throw error;

        console.log(`✅ Found ${logs.length} workout logs in Supabase.`);
        if (logs.length > 0) {
            console.log('Sample Log Date:', logs[0].logged_at);
        }

    } catch (error) {
        console.error('❌ Sync test failed:', error);
        console.log('Note: This might fail if the mock database is not reachable or if RLS prevents insertion.');
    }
}

testSync();
