// Training plan templates for different race distances
// These are the base structures that can be personalized by the AI coach

export interface WeekStructure {
    weekNumber: number
    phase: string
    totalKm: number
    sessions: SessionTemplate[]
    startDate?: Date
    aiAdjustments?: string
}

export interface SessionTemplate {
    dayOfWeek: string
    sessionType: 'easy' | 'tempo' | 'intervals' | 'long-run' | 'recovery' | 'race'
    distance: string
    prescribedWorkout: {
        structure?: string
        pace?: string
        hrZone: string
        notes?: string
    }
    optional?: boolean
    keyWorkout?: boolean
}

// 5K - Beginner (8 weeks)
export const FIVE_K_BEGINNER: WeekStructure[] = [
    {
        weekNumber: 1,
        phase: 'Introduction',
        totalKm: 15,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'easy',
                distance: '3K',
                prescribedWorkout: {
                    pace: 'Run/Walk mix if needed',
                    hrZone: '<145 bpm',
                    notes: 'Start slow. If new to running, alternate 1 min run / 1 min walk.'
                }
            },
            {
                dayOfWeek: 'Thursday',
                sessionType: 'easy',
                distance: '3K',
                prescribedWorkout: {
                    pace: 'Conversational pace',
                    hrZone: '<145 bpm',
                    notes: 'Focus on consistency. Keep it easy.'
                }
            },
            {
                dayOfWeek: 'Saturday',
                sessionType: 'long-run',
                distance: '5K',
                prescribedWorkout: {
                    pace: 'Very comfortable',
                    hrZone: '<150 bpm',
                    notes: 'Longest run of the week. Take walk breaks if needed.'
                }
            }
        ]
    },
    {
        weekNumber: 4,
        phase: 'Building',
        totalKm: 20,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'intervals',
                distance: '5K',
                prescribedWorkout: {
                    structure: '1K warm, 6x400m faster, 1K cool',
                    hrZone: '155-165 bpm',
                    notes: 'Pick up the pace lightly on the 400s.'
                }
            },
            {
                dayOfWeek: 'Thursday',
                sessionType: 'easy',
                distance: '4K',
                prescribedWorkout: {
                    pace: 'Easy',
                    hrZone: '<145 bpm',
                    notes: 'Recovery run.'
                }
            },
            {
                dayOfWeek: 'Saturday',
                sessionType: 'long-run',
                distance: '7K',
                prescribedWorkout: {
                    pace: 'Steady',
                    hrZone: '<150 bpm',
                    notes: 'Building endurance.'
                }
            }
        ]
    },
    {
        weekNumber: 8,
        phase: 'Race Week',
        totalKm: 12,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'easy',
                distance: '3K',
                prescribedWorkout: {
                    pace: 'Easy',
                    hrZone: '<145 bpm',
                    notes: 'Shakeout run. Keep legs loose.'
                }
            },
            {
                dayOfWeek: 'Saturday',
                sessionType: 'race',
                distance: '5K',
                keyWorkout: true,
                prescribedWorkout: {
                    structure: 'RACE DAY - 5K',
                    hrZone: '170-180 bpm',
                    notes: 'You made it! Start steady, finish strong.'
                }
            }
        ]
    }
]

// 10K - Intermediate (10 weeks)
export const TEN_K_INTERMEDIATE: WeekStructure[] = [
    {
        weekNumber: 1,
        phase: 'Base',
        totalKm: 35,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'intervals',
                distance: '8K',
                prescribedWorkout: {
                    structure: '2K warm, 8x400m @ 5K pace, 2K cool',
                    hrZone: '165-175 bpm',
                    notes: 'Speed work to start.'
                }
            },
            {
                dayOfWeek: 'Thursday',
                sessionType: 'tempo',
                distance: '7K',
                prescribedWorkout: {
                    structure: '2K warm, 3K @ 10K pace, 2K cool',
                    hrZone: '160-170 bpm',
                    notes: 'Get used to race pace.'
                }
            },
            {
                dayOfWeek: 'Sunday',
                sessionType: 'long-run',
                distance: '12K',
                prescribedWorkout: {
                    pace: 'Easy',
                    hrZone: '<155 bpm',
                    notes: 'Aerobic base building.'
                }
            }
        ]
    },
    {
        weekNumber: 10,
        phase: 'Race Week',
        totalKm: 20,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'intervals',
                distance: '6K',
                prescribedWorkout: {
                    structure: '2K warm, 4x400m @ race pace, 2K cool',
                    hrZone: '160-170 bpm',
                    notes: 'Taper intervals.'
                }
            },
            {
                dayOfWeek: 'Sunday',
                sessionType: 'race',
                distance: '10K',
                keyWorkout: true,
                prescribedWorkout: {
                    structure: 'RACE DAY - 10K',
                    hrZone: '175-185 bpm',
                    notes: 'Push hard in the second half!'
                }
            }
        ]
    }
]

// Half Marathon - Intermediate (12 weeks)
export const HALF_MARATHON_INTERMEDIATE: WeekStructure[] = [
    {
        weekNumber: 1,
        phase: 'Base Building',
        totalKm: 30,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'intervals',
                distance: '8K',
                prescribedWorkout: {
                    structure: 'Warmup: 2K easy\nMain: 4x800m @ 5K pace\nRecovery: 2 min jog\nCooldown: 2K easy',
                    hrZone: '160-168 bpm',
                    notes: 'First interval session - focus on form and completing all reps.'
                }
            },
            {
                dayOfWeek: 'Thursday',
                sessionType: 'easy',
                distance: '6K',
                prescribedWorkout: {
                    pace: 'Easy conversational pace',
                    hrZone: '<155 bpm',
                    notes: 'Pure recovery run. Should feel conversational.'
                }
            },
            {
                dayOfWeek: 'Sunday',
                sessionType: 'long-run',
                distance: '12K',
                prescribedWorkout: {
                    structure: '10K @ easy pace\nLast 2K @ moderate effort',
                    hrZone: '155-162 bpm',
                    notes: 'Building aerobic base. Start easy and finish strong.'
                }
            }
        ]
    },
    {
        weekNumber: 12,
        phase: 'Race Week',
        totalKm: 25,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'intervals',
                distance: '7K',
                prescribedWorkout: {
                    structure: 'Warmup: 2K easy\nMain: 4x800m @ race pace\nRecovery: 90 sec jog\nCooldown: 1K easy',
                    hrZone: '165-172 bpm',
                    notes: 'Final sharpener - keep it controlled.'
                }
            },
            {
                dayOfWeek: 'Thursday',
                sessionType: 'easy',
                distance: '5K',
                prescribedWorkout: {
                    pace: 'Very easy',
                    hrZone: '<150 bpm',
                    notes: 'Just keeping legs moving. Feel fresh and ready.'
                }
            },
            {
                dayOfWeek: 'Sunday',
                sessionType: 'race',
                distance: '21.1K',
                keyWorkout: true,
                prescribedWorkout: {
                    structure: 'RACE DAY - Half Marathon',
                    hrZone: '172-182 bpm',
                    notes: 'Trust your training. Execute the plan. Enjoy the race!'
                }
            }
        ]
    }
]

// Marathon - Advanced (16 weeks)
export const MARATHON_ADVANCED: WeekStructure[] = [
    {
        weekNumber: 1,
        phase: 'Base',
        totalKm: 60,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'intervals',
                distance: '12K',
                prescribedWorkout: {
                    structure: '3K warm, 6x1K @ 10K pace, 3K cool',
                    hrZone: '165-175 bpm',
                    notes: 'Setting the foundation.'
                }
            },
            {
                dayOfWeek: 'Thursday',
                sessionType: 'tempo',
                distance: '10K',
                prescribedWorkout: {
                    structure: '2K warm, 6K @ Marathon Pace, 2K cool',
                    hrZone: '160-170 bpm',
                    notes: 'Marathon pace feel.'
                }
            },
            {
                dayOfWeek: 'Sunday',
                sessionType: 'long-run',
                distance: '20K',
                prescribedWorkout: {
                    pace: 'Easy + 30s',
                    hrZone: '145-155 bpm',
                    notes: 'Long steady distance.'
                }
            }
        ]
    },
    {
        weekNumber: 16,
        phase: 'Race Week',
        totalKm: 42,
        sessions: [
            {
                dayOfWeek: 'Tuesday',
                sessionType: 'easy',
                distance: '6K',
                prescribedWorkout: {
                    pace: 'Easy',
                    hrZone: '<145 bpm',
                    notes: 'Taper week. Keep it chill.'
                }
            },
            {
                dayOfWeek: 'Sunday',
                sessionType: 'race',
                distance: '42.2K',
                keyWorkout: true,
                prescribedWorkout: {
                    structure: 'RACE DAY - Marathon',
                    hrZone: '165-175 bpm',
                    notes: 'The big day. Pace yourself early.'
                }
            }
        ]
    }
]

// 50K Ultra - Advanced (20 weeks)
export const ULTRA_50K_ADVANCED: WeekStructure[] = [
    {
        weekNumber: 1,
        phase: 'Base',
        totalKm: 50,
        sessions: [
            {
                dayOfWeek: 'Wednesday',
                sessionType: 'easy',
                distance: '10K',
                prescribedWorkout: {
                    pace: 'Easy trails',
                    hrZone: '<150 bpm',
                    notes: 'Get some elevation.'
                }
            },
            {
                dayOfWeek: 'Saturday',
                sessionType: 'long-run',
                distance: '20K',
                prescribedWorkout: {
                    pace: 'Easy trail pace',
                    hrZone: '145-155 bpm',
                    notes: 'Time on feet is key.'
                }
            },
            {
                dayOfWeek: 'Sunday',
                sessionType: 'long-run',
                distance: '15K',
                prescribedWorkout: {
                    pace: 'Easy',
                    hrZone: '<145 bpm',
                    notes: 'Back-to-back long run practice.'
                }
            }
        ]
    },
    {
        weekNumber: 20,
        phase: 'Race Week',
        totalKm: 50,
        sessions: [
            {
                dayOfWeek: 'Sunday',
                sessionType: 'race',
                distance: '50K',
                keyWorkout: true,
                prescribedWorkout: {
                    structure: 'RACE DAY - 50K Ultra',
                    hrZone: '150-165 bpm',
                    notes: 'Eat early, eat often. Keep moving.'
                }
            }
        ]
    }
]

// Default durations for each distance
const DEFAULT_PLAN_WEEKS: Record<string, number> = {
    '5k': 8,
    '10k': 10,
    'half': 12,
    'marathon': 16,
    '50k': 20,
}

// Helper function to get templates by distance
export function getPlanTemplate(distance: '5k' | '10k' | 'half' | 'marathon' | '50k', _difficulty: 'beginner' | 'intermediate' | 'advanced') {
    if (distance === '5k') return FIVE_K_BEGINNER;
    if (distance === '10k') return TEN_K_INTERMEDIATE;
    if (distance === 'half') return HALF_MARATHON_INTERMEDIATE;
    if (distance === 'marathon') return MARATHON_ADVANCED;
    if (distance === '50k') return ULTRA_50K_ADVANCED;
    return HALF_MARATHON_INTERMEDIATE
}

// Phase label based on progress through the plan
function getPhase(weekIndex: number, totalWeeks: number): string {
    const progress = weekIndex / (totalWeeks - 1)
    if (weekIndex === totalWeeks - 1) return 'Race Week'
    if (weekIndex === totalWeeks - 2) return 'Taper'
    if (progress < 0.4) return 'Base Building'
    if (progress < 0.75) return 'Build / Race Specific'
    return 'Peak'
}

// Generate a personalized plan from template
// This interpolates between the sparse anchor weeks in the template
// to produce the correct full plan duration (8, 10, 12, 16, or 20 weeks).
export function generatePlanFromTemplate(
    template: WeekStructure[],
    startDate: Date,
    personalization?: {
        coachingPhilosophy?: string
        suggestedAdjustments?: string
        weeklyNotes?: string[]
        raceDate?: string
        distanceType?: string
        experienceLevel?: string
        currentWeeklyKm?: number
        goalTime?: string
    }
) {
    const anchorWeeks = JSON.parse(JSON.stringify(template)) as WeekStructure[]
    const firstAnchor = anchorWeeks[0]
    const lastAnchor = anchorWeeks[anchorWeeks.length - 1]

    // Determine target plan length
    const distanceType = personalization?.distanceType || 'half'
    let totalWeeks = DEFAULT_PLAN_WEEKS[distanceType] ?? 12

    // If a race date is given, use the number of weeks until the race (capped at template max)
    if (personalization?.raceDate) {
        const raceDate = new Date(personalization.raceDate)
        const diffMs = raceDate.getTime() - startDate.getTime()
        const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))
        if (diffWeeks > 0) {
            totalWeeks = Math.min(diffWeeks + 1, totalWeeks)
        }
    }

    // Volume progression: build 3 weeks, cutback every 4th week, taper last 2 weeks
    const userCurrentVol = personalization?.currentWeeklyKm || 0
    const startVol = Math.max(firstAnchor.totalKm, userCurrentVol * 1.0)
    // Peak at ~week (totalWeeks - 2), about 110% of template's last non-race volume
    const peakVol = lastAnchor.totalKm * 1.05

    const generatedWeeks: WeekStructure[] = []

    for (let i = 0; i < totalWeeks; i++) {
        const isRaceWeek = i === totalWeeks - 1
        const isTaperWeek = i === totalWeeks - 2
        const isCutback = !isRaceWeek && !isTaperWeek && ((i + 1) % 4 === 0)

        // Linear volume progression from startVol to peakVol, with cutbacks
        const buildProgress = Math.min(i / Math.max(totalWeeks - 3, 1), 1.0)
        let weekVol = startVol + (peakVol - startVol) * buildProgress

        if (isCutback) weekVol *= 0.75
        if (isTaperWeek) weekVol = peakVol * 0.80
        if (isRaceWeek) weekVol = lastAnchor.totalKm

        // Sessions: use last anchor's sessions for race week, first anchor for all others
        const sessionSource: SessionTemplate[] = JSON.parse(
            JSON.stringify(isRaceWeek ? lastAnchor.sessions : firstAnchor.sessions)
        )

        // Scale individual session distances proportionally to the week volume change
        const volRatio = weekVol / (isRaceWeek ? lastAnchor.totalKm : firstAnchor.totalKm)
        const sessions = sessionSource.map((session, sIdx) => {
            let scaledDist = session.distance
            if (session.distance.match(/^\d+(\.\d+)?K$/i)) {
                const raw = parseFloat(session.distance)
                scaledDist = `${Math.round(raw * volRatio)}K`
            }

            // Only annotate the first session of week 1 with coaching philosophy
            const aiNote = i === 0 && sIdx === 0 ? personalization?.coachingPhilosophy : undefined

            return {
                ...session,
                distance: scaledDist,
                prescribedWorkout: {
                    ...session.prescribedWorkout,
                    notes: aiNote
                        ? `${aiNote}\n\n${session.prescribedWorkout.notes || ''}`.trim()
                        : session.prescribedWorkout.notes
                }
            }
        })

        const weekDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)

        generatedWeeks.push({
            weekNumber: i + 1,
            phase: getPhase(i, totalWeeks),
            totalKm: Math.round(weekVol),
            sessions,
            startDate: weekDate,
            aiAdjustments: personalization?.suggestedAdjustments
        })
    }

    return generatedWeeks
}
