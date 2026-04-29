import { NextResponse } from 'next/server'
import { getGenAI } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json()

        const genAI = getGenAI()

        if (!genAI) {
            return NextResponse.json({
                reply: "I'm in offline mode right now since the AI service isn't configured, but keep up the great training! Check your plan for the next session."
            })
        }

        // Build user context block from Supabase (best-effort — falls back to generic if anything fails)
        let contextBlock = ''
        try {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const [{ data: plan }, { data: recentLogs }, { data: profile }] = await Promise.all([
                    supabase
                        .from('training_plans')
                        .select('name, goal_time, race_date, ai_adjustments')
                        .eq('user_id', user.id)
                        .eq('status', 'active')
                        .single(),
                    supabase
                        .from('workout_logs')
                        .select('distance_meters, feel_rating, logged_at, sessions(session_type)')
                        .eq('user_id', user.id)
                        .order('logged_at', { ascending: false })
                        .limit(5),
                    supabase
                        .from('profiles')
                        .select('display_name, experience_level, age, current_weekly_km')
                        .eq('id', user.id)
                        .single(),
                ])

                const adj = plan?.ai_adjustments as Array<{type: string, content: string}> | null
                const philosophy = adj?.find(a => a.type === 'philosophy')?.content ?? null

                contextBlock = `
## Runner Context
Name: ${profile?.display_name ?? 'Runner'}
Experience: ${profile?.experience_level ?? 'unknown'}
Age: ${profile?.age ?? 'unknown'}
Current weekly volume: ${profile?.current_weekly_km ?? 'unknown'} km/week

## Active Plan
${plan ? `${plan.name} | Goal: ${plan.goal_time ?? 'finish'} | Race: ${plan.race_date ?? 'TBD'}` : 'No active plan'}
${philosophy ? `Coaching approach: ${philosophy}` : ''}

## Recent Workouts (last 5)
${(recentLogs ?? []).map(l => {
    const km = l.distance_meters ? (l.distance_meters / 1000).toFixed(1) : '?'
    const date = new Date(l.logged_at).toLocaleDateString()
    const type = (l.sessions as {session_type?: string} | null)?.session_type ?? 'run'
    return `- ${date}: ${type}, ${km}km, feel ${l.feel_rating ?? '?'}/5`
}).join('\n') || '- No recent sessions logged yet'}`.trim()
            }
        } catch {
            // context fetch failed — proceed with generic prompt
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const formattedHistory = history.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'coach' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))

        const systemPrompt = `Act as Coach Stride, a supportive, knowledgeable, and concise AI running coach.
Keep your responses brief (1-3 short paragraphs max), encouraging, and focused on training principles, recovery, and motivation. Do not use markdown headers.
${contextBlock ? `\n${contextBlock}\n\nUse this context to personalize your advice when relevant.` : ''}`

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Understood! I'm Coach Stride, ready to help." }]
                },
                ...formattedHistory
            ],
            generationConfig: {
                maxOutputTokens: 300,
            }
        })

        const result = await chat.sendMessage([{ text: message }])
        const response = result.response
        const text = response.text()

        return NextResponse.json({ reply: text })

    } catch (error) {
        console.error('AI Chat Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate chat response' },
            { status: 500 }
        )
    }
}
