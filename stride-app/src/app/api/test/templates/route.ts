import { NextResponse } from 'next/server'
import { getPlanTemplate } from '@/lib/plan-templates'

export async function GET() {
    const plans: Array<{
        distance: '5k' | '10k' | 'half' | 'marathon' | '50k'
        difficulty: 'beginner' | 'intermediate' | 'advanced'
    }> = [
        { distance: '5k', difficulty: 'beginner' },
        { distance: '10k', difficulty: 'intermediate' },
        { distance: 'half', difficulty: 'intermediate' },
        { distance: 'marathon', difficulty: 'advanced' },
        { distance: '50k', difficulty: 'advanced' }
    ]

    const results = plans.map(p => {
        const template = getPlanTemplate(p.distance, p.difficulty)
        return {
            key: `${p.distance}-${p.difficulty}`,
            found: !!template,
            weeks: template?.length || 0,
            totalDistance: template?.reduce((sum, week) => sum + week.totalKm, 0) || 0
        }
    })

    return NextResponse.json({ results })
}
