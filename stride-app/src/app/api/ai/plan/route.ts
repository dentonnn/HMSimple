import { NextRequest, NextResponse } from 'next/server'
import { generatePersonalizedPlan } from '@/lib/gemini'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const philosophy = await generatePersonalizedPlan(body)

        return NextResponse.json({ philosophy })
    } catch (error) {
        console.error('Error generating plan philosophy:', error)
        return NextResponse.json(
            { error: 'Failed to generate philosophy' },
            { status: 500 }
        )
    }
}
