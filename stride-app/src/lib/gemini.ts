import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export function getGenAI() {
    if (!GEMINI_API_KEY) return null
    return new GoogleGenerativeAI(GEMINI_API_KEY)
}

// System prompt for the AI coach
export const COACH_SYSTEM_PROMPT = `
You are Stride Coach, a supportive and encouraging running coach helping runners train for races from 5K to 50K ultramarathons.

## Your Personality
- Warm, positive, and non-judgmental
- Focus on progress over perfection
- Never compare users to others - each runner's journey is unique
- Celebrate small wins and incremental improvements
- Acknowledge when life gets in the way - training isn't everything
- Offer gentle suggestions, not demands
- Use encouraging language without being over-the-top
- Be concise but meaningful (2-4 sentences typically)

## Your Role
You provide feedback on training sessions, help runners understand their progress, and make supportive suggestions for plan adjustments when needed.

## Response Guidelines
- Keep responses brief and actionable
- Use emojis sparingly and naturally
- Never be condescending or pushy
- If a runner is struggling, offer empathy and practical solutions
- If a runner is doing well, celebrate without creating pressure to maintain perfection
- Always end with encouragement or a helpful tip

## Important Principles
- Training should enhance life, not dominate it
- Rest and recovery are just as important as hard workouts  
- Mental health > performance metrics
- Every runner is different - what works for one may not work for another
- Missing workouts is normal and human
- Progress isn't always linear

Remember: You're here to support runners in living better, healthier lives - not to create anxiety or obsession around performance.
`.trim()

export interface CoachFeedbackRequest {
    sessionType: string
    prescribedWorkout: {
        structure?: string
        pace?: string
        hrZone: string
        notes?: string
    }
    actualData?: {
        distance_meters?: number
        duration_seconds?: number
        avg_pace_seconds_per_km?: number
        avg_heart_rate?: number
        feel_rating?: number
        notes?: string
    }
    userProfile?: {
        experience_level?: string
        age?: number
        gender?: string
    }
    context?: string
}

export interface PlanGenerationRequest {
    distanceType: '5k' | '10k' | 'half' | 'marathon' | '50k'
    goalTime?: string
    raceDate?: string
    userProfile: {
        experience_level: string
        age: number
        gender: string
        height_cm: number
        weight_kg: number
        running_history_months: number
        current_weekly_km: number
        recent_race_time?: string
    }
}

export interface PersonalizedPlanResponse {
    coachingPhilosophy: string
    suggestedAdjustments: string
    weeklyNotes: string[]
}

/**
 * Generate AI coach feedback for a completed training session
 */
export async function generateSessionFeedback(
    request: CoachFeedbackRequest
): Promise<string> {
    const genAI = getGenAI()
    if (!genAI) return "Great job on your session! Consistency is the foundation of progress. Keep it up!"

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: COACH_SYSTEM_PROMPT,
    })

    const { sessionType, prescribedWorkout, actualData, context } = request

    const prompt = `
A runner just completed a ${sessionType} session. Please provide encouraging feedback.

**Prescribed Workout:**
${prescribedWorkout.structure || prescribedWorkout.pace || ''}
Heart Rate Zone: ${prescribedWorkout.hrZone}

${actualData ? `
**Actual Performance:**
${actualData.distance_meters ? `Distance: ${(actualData.distance_meters / 1000).toFixed(2)}K` : ''}
${actualData.duration_seconds ? `Duration: ${Math.floor(actualData.duration_seconds / 60)} minutes` : ''}
${actualData.avg_pace_seconds_per_km ? `Pace: ${Math.floor(actualData.avg_pace_seconds_per_km / 60)}:${String(actualData.avg_pace_seconds_per_km % 60).padStart(2, '0')}/km` : ''}
${actualData.avg_heart_rate ? `Avg HR: ${actualData.avg_heart_rate} bpm` : ''}
${actualData.feel_rating ? `How it felt: ${actualData.feel_rating}/5 (1=terrible, 5=amazing)` : ''}
${actualData.notes ? `Runner's notes: "${actualData.notes}"` : ''}
` : ''}

${context ? `Additional context: ${context}` : ''}

Provide brief, supportive feedback (2-4 sentences).
  `.trim()

    const result = await model.generateContent(prompt)
    return result.response.text()
}

/**
 * Generate feedback when a session is missed
 */
export async function generateMissedSessionFeedback(
    sessionType: string,
    context?: string
): Promise<string> {
    const genAI = getGenAI()
    if (!genAI) return "Life happens! Don't worry about the missed session. Focus on getting back to it when you're ready."

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: COACH_SYSTEM_PROMPT,
    })

    const prompt = `
A runner missed their planned ${sessionType} session.
${context ? `Context: ${context}` : ''}

Provide a brief, supportive message (1-2 sentences). Acknowledge that life happens and offer a gentle suggestion.
  `.trim()

    const result = await model.generateContent(prompt)
    return result.response.text()
}

/**
 * Generate a weekly summary
 */
export async function generateWeeklySummary(
    weekNumber: number,
    completedSessions: number,
    totalSessions: number,
    highlights?: string
): Promise<string> {
    const genAI = getGenAI()
    if (!genAI) return `Solid work on Week ${weekNumber}! You're building a great habit.`

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: COACH_SYSTEM_PROMPT,
    })

    const prompt = `
Generate a brief weekly summary for Week ${weekNumber}.

Sessions completed: ${completedSessions}/${totalSessions}
${highlights ? `Highlights: ${highlights}` : ''}

Provide encouraging feedback about the week (2-3 sentences).
  `.trim()

    const result = await model.generateContent(prompt)
    return result.response.text()
}

/**
 * Generate a personalized training plan structure
 */
export async function generatePersonalizedPlan(
    request: PlanGenerationRequest
): Promise<PersonalizedPlanResponse> {
    const genAI = getGenAI()
    if (!genAI) {
        return {
            coachingPhilosophy: "Focus on building a strong aerobic base with consistent easy runs. Your history suggests a steady progression is best, prioritizing injury prevention while gradually building to your goal distance.",
            suggestedAdjustments: "Gradually increase weekly volume by no more than 10%. Incorporate cross-training to build strength without high impact.",
            weeklyNotes: ["Start slow and focus on habit.", "Begin adding slight intensity.", "Recovery is part of training.", "Celebrate the first month!"]
        }
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
    })

    const { distanceType, goalTime, raceDate, userProfile } = request

    const distanceNames: Record<string, string> = {
        '5k': '5K',
        '10k': '10K',
        'half': 'Half Marathon',
        'marathon': 'Marathon',
        '50k': '50K Ultra',
    }

    const prompt = `
You are a running coach creating a personalized training plan.

**Runner Profile:**
- Experience: ${userProfile.experience_level}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height_cm}cm
- Weight: ${userProfile.weight_kg}kg
- Running history: ${userProfile.running_history_months} months
- Current weekly volume: ${userProfile.current_weekly_km}km/week
${userProfile.recent_race_time ? `- Recent race performance: ${userProfile.recent_race_time}` : ''}

**Goal:**
- Race distance: ${distanceNames[distanceType]}
${goalTime ? `- Target time: ${goalTime}` : ''}
${raceDate ? `- Race date: ${raceDate}` : ''}

Based on this profile, provide:
1. A welcome message and training plan philosophy (3-4 sentences).
2. Specific suggested adjustments to a standard template (e.g., "Incorporate more rest", "Conservative volume increase").
3. A list of weekly focus notes for the first 4 weeks.

Return your response in the following JSON format:
{
  "coachingPhilosophy": "...",
  "suggestedAdjustments": "...",
  "weeklyNotes": ["Week 1 note", "Week 2 note", "Week 3 note", "Week 4 note"]
}
  `.trim()

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    try {
        // Find JSON in response (Gemini sometimes adds markdown block)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : text
        return JSON.parse(jsonStr) as PersonalizedPlanResponse
    } catch (_e) {
        console.error('Failed to parse AI response as JSON:', text)
        return {
            coachingPhilosophy: text.substring(0, 500),
            suggestedAdjustments: "Focus on consistency and gradual progression.",
            weeklyNotes: ["Listen to your body", "Stay consistent", "Focus on form", "Build base endurance"]
        }
    }
}
