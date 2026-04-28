import { NextResponse } from 'next/server'
import { generatePlanFromTemplate, getPlanTemplate } from '@/lib/plan-templates'

export async function GET() {
    const template = getPlanTemplate('5k', 'beginner')
    const startDate = new Date('2026-03-01')

    // Case 1: Experienced runner (current vol 30km, template start ~15km)
    // No scaling should happen
    const res1 = generatePlanFromTemplate(template, startDate, {
        currentWeeklyKm: 30,
        experienceLevel: 'intermediate'
    })

    // Case 2: Beginner with low base (current vol 5km, template start ~15km)
    // Scaling should happen
    const res2 = generatePlanFromTemplate(template, startDate, {
        currentWeeklyKm: 5,
        experienceLevel: 'beginner'
    })

    return NextResponse.json({
        templateStartVol: template[0].totalKm,
        case1: {
            startVol: res1[0].totalKm,
            sessions: res1[0].sessions.map(s => ({ t: s.sessionType, d: s.distance }))
        },
        case2: {
            startVol: res2[0].totalKm,
            sessions: res2[0].sessions.map(s => ({ t: s.sessionType, d: s.distance }))
        }
    })
}
