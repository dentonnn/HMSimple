'use client'

import { SessionWithWorkout } from '@/types'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface SessionCardProps {
    session: SessionWithWorkout
    weekNumber: number
    onLogSession?: () => void
    isCompleted?: boolean
}

export function SessionCard({ session, weekNumber: _weekNumber, onLogSession, isCompleted = false }: SessionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const sessionType = session.session_type.toLowerCase().replace(/ /g, '-')

    // Get icon based on session type
    const getIcon = (type: string) => {
        const icons: Record<string, string> = {
            'intervals': '🏃',
            'tempo': '🎯',
            'easy': '🚶',
            'recovery': '🚶',
            'long-run': '🏔️',
            'race': '🏆',
        }
        return icons[type] || '🏃'
    }

    return (
        <div
            className={`session-card p-4 ${isCompleted ? 'completed' : ''}`}
            data-type={sessionType}
        >
            <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getIcon(sessionType)}</span>
                        <h3 className="text-lg font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>
                            {session.day_of_week}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="font-mono font-semibold">
                            {session.prescribed_workout.structure?.match(/\d+K/)?.[0] || 'Workout'}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{session.session_type}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isCompleted && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success)' }}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    <ChevronDown
                        className={`w-6 h-6 chevron ${isExpanded ? 'rotated' : ''}`}
                        style={{ color: 'var(--color-text-secondary)' }}
                    />
                </div>
            </div>

            <div className={`expandable-content ${isExpanded ? 'expanded' : ''} mt-4`}>
                <div className="space-y-4">
                    {/* Prescribed Workout */}
                    <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg)' }}>
                        <h4 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-accent)' }}>
                            📋 Prescribed Workout
                        </h4>
                        {session.prescribed_workout.structure && (
                            <div className="mb-3">
                                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    Structure
                                </div>
                                <pre className="font-mono text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                                    {session.prescribed_workout.structure}
                                </pre>
                            </div>
                        )}
                        {session.prescribed_workout.pace && (
                            <div className="mb-3">
                                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    Pace
                                </div>
                                <div className="font-mono font-semibold text-lg" style={{ color: 'var(--color-accent)' }}>
                                    {session.prescribed_workout.pace}
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Heart Rate Zone
                            </div>
                            <div className="font-mono font-semibold text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                                {session.prescribed_workout.hrZone}
                            </div>
                        </div>
                    </div>

                    {/* Training Notes */}
                    {session.prescribed_workout.notes && (
                        <div className="p-4 rounded-lg border-l-4" style={{
                            background: 'var(--color-bg)',
                            borderColor: 'var(--color-accent)'
                        }}>
                            <h4 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-accent)' }}>
                                💡 Training Notes & Tips
                            </h4>
                            <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                                {session.prescribed_workout.notes}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    {!isCompleted && onLogSession && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onLogSession()
                            }}
                            className="w-full py-3 px-4 rounded-lg font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                            style={{ background: 'var(--color-accent)', color: 'white' }}
                        >
                            <span>📝</span>
                            <span>Log This Session</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
