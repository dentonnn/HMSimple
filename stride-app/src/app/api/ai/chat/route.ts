import { NextResponse } from 'next/server'
import { getGenAI } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json()

        const genAI = getGenAI()
        
        if (!genAI) {
            return NextResponse.json({ 
                reply: "I'm in offline mode right now since the AI service isn't configured, but keep up the great training! Check your plan for the next session." 
            })
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Format history for Gemini API
        // Filter out initial greeting if it's not strictly necessary, or format it
        const formattedHistory = history.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'coach' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: `Act as Coach Stride, a supportive, knowledgeable, and concise AI running coach. 
You are chatting with a user who is currently viewing their half marathon training plan dashboard.
Keep your responses relatively brief (1-3 short paragraphs max), encouraging, and focused on training principles, recovery, and motivation. Do not use markdown headers unless necessary.`}]
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
