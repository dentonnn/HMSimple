import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncStravaActivities } from '@/lib/sync';

export async function POST(_request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await syncStravaActivities(user.id);

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Error syncing Strava:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to sync' },
            { status: 500 }
        );
    }
}
