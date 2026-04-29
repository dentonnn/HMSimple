'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LogSessionModalProps {
    isOpen: boolean
    onClose: () => void
    onSaveSuccess?: (sessionId: string) => void
    session: {
        id: string
        session_type: string
        prescribed_workout: {
            structure?: string
            pace?: string
            hrZone: string
        }
    }
}

export function LogSessionModal({ isOpen, onClose, onSaveSuccess, session }: LogSessionModalProps) {
    const supabase = createClient()
    const [formData, setFormData] = useState({
        distance: '',
        duration: '',
        avgPace: '',
        avgHr: '',
        feelRating: 3,
        notes: ''
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [aiFeedback, setAiFeedback] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const distanceKm = parseFloat(formData.distance)
            const durationMin = parseFloat(formData.duration)
            const distance_meters = !isNaN(distanceKm) && distanceKm > 0 ? Math.round(distanceKm * 1000) : null
            const duration_seconds = !isNaN(durationMin) && durationMin > 0 ? Math.round(durationMin * 60) : null
            const avg_pace = distance_meters && duration_seconds
                ? Math.round((duration_seconds / distance_meters) * 1000)
                : null
            const avg_heart_rate = formData.avgHr ? parseInt(formData.avgHr) : null

            // 1. Get AI Feedback
            const response = await fetch('/api/ai/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionType: session.session_type,
                    prescribedWorkout: session.prescribed_workout,
                    actualData: {
                        distance_meters,
                        duration_seconds,
                        avg_heart_rate,
                        feel_rating: formData.feelRating,
                        notes: formData.notes
                    }
                })
            })

            const data = await response.json()
            setAiFeedback(data.feedback)

            // 2. Save workout log
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error: logError } = await supabase
                .from('workout_logs')
                .insert({
                    user_id: user.id,
                    session_id: session.id,
                    distance_meters,
                    duration_seconds,
                    avg_pace_seconds_per_km: avg_pace,
                    avg_heart_rate,
                    feel_rating: formData.feelRating,
                    notes: formData.notes || null,
                    ai_feedback: data.feedback,
                })
            if (logError) throw logError

            // 3. Mark session completed (non-fatal if this fails)
            const { error: sessionError } = await supabase
                .from('sessions')
                .update({ status: 'completed' })
                .eq('id', session.id)
            if (sessionError) console.warn('Could not update session status:', sessionError)

            onSaveSuccess?.(session.id)

        } catch (error) {
            console.error('Error logging session:', error)
            alert('Failed to log session')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Log {session.session_type} Session</h2>

                {!aiFeedback ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Distance (km)</label>
                                <input
                                    type="number"
                                    value={formData.distance}
                                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (min)</label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Avg HR (bpm)</label>
                                <input
                                    type="number"
                                    value={formData.avgHr}
                                    onChange={(e) => setFormData({ ...formData, avgHr: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Feel (1-5)</label>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800 p-2 rounded-lg border dark:border-zinc-700">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => setFormData({ ...formData, feelRating: rating })}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${formData.feelRating === rating
                                                    ? 'bg-[#FF6B35] text-white'
                                                    : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {rating}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-2 border rounded-lg h-24 dark:bg-zinc-800 dark:border-zinc-700"
                                placeholder="How did it feel?"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-[2] py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Analyzing...' : 'Save & Get Feedback'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                            <h3 className="font-bold text-[#FF6B35] mb-2 flex items-center gap-2">
                                <span>🤖</span> Coach Stride says:
                            </h3>
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                {aiFeedback}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-[#06A77D] text-white rounded-xl font-bold hover:opacity-90"
                        >
                            Start Rest & Recovery
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
