import { NextRequest, NextResponse } from 'next/server'
import { generateSessionFeedback } from '@/lib/gemini'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const feedback = await generateSessionFeedback(body)

        return NextResponse.json({ feedback })
    } catch (error) {
        console.error('Error generating feedback:', error)
        return NextResponse.json(
            { error: 'Failed to generate feedback' },
            { status: 500 }
        )
    }
}
