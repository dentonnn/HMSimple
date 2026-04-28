'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generatePlanFromTemplate, getPlanTemplate, WeekStructure, SessionTemplate } from '@/lib/plan-templates'
import { DistanceType, ExperienceLevel } from '@/types'
import { ChevronRight, Check, Sparkles, Trophy, Info } from 'lucide-react'

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [previewPlan, setPreviewPlan] = useState<WeekStructure[] | null>(null)
    const [aiPhilosophy, setAiPhilosophy] = useState<{ philosophy: string; adjustments: string; weeklyNotes: string[] } | null>(null)

    const [formData, setFormData] = useState({
        // Profile
        gender: '',
        age: '',
        height: '',
        weight: '',
        experience: 'intermediate',
        currentWeeklyKm: '',
        runningHistoryMonths: '12',
        recentRaceTime: '',

        // Goal
        distance: 'half', // 5k, 10k, half, marathon, 50k
        goalTime: '',
        raceDate: '',
        startDate: new Date().toISOString().split('T')[0]
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleNext = () => {
        if (step === 3) {
            generatePreview()
        }
        setStep(step + 1)
    }
    const handleBack = () => setStep(step - 1)

    const generatePreview = async () => {
        setLoading(true)
        try {
            // 1. Get AI Coaching Philosophy
            const aiResponse = await fetch('/api/ai/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    distanceType: formData.distance,
                    goalTime: formData.goalTime,
                    raceDate: formData.raceDate,
                    userProfile: {
                        experience_level: formData.experience,
                        age: parseInt(formData.age) || 30,
                        gender: formData.gender,
                        height_cm: parseInt(formData.height) || 170,
                        weight_kg: parseFloat(formData.weight) || 70,
                        running_history_months: parseInt(formData.runningHistoryMonths) || 12,
                        current_weekly_km: parseFloat(formData.currentWeeklyKm) || 20,
                        recent_race_time: formData.recentRaceTime
                    }
                })
            });
            const aiData = await aiResponse.json();
            const philosophyData = aiData.philosophy;
            setAiPhilosophy({
                philosophy: philosophyData.coachingPhilosophy,
                adjustments: philosophyData.suggestedAdjustments,
                weeklyNotes: philosophyData.weeklyNotes
            })

            // 2. Generate Plan Preview
            const template = getPlanTemplate(formData.distance as DistanceType, formData.experience as ExperienceLevel)
            if (template) {
                const generated = generatePlanFromTemplate(
                    template,
                    new Date(formData.startDate),
                    {
                        distanceType: formData.distance,
                        raceDate: formData.raceDate,
                        experienceLevel: formData.experience,
                        currentWeeklyKm: parseFloat(formData.currentWeeklyKm),
                        goalTime: formData.goalTime,
                        coachingPhilosophy: philosophyData.coachingPhilosophy,
                        suggestedAdjustments: philosophyData.suggestedAdjustments,
                        weeklyNotes: philosophyData.weeklyNotes
                    }
                )
                setPreviewPlan(generated)
            }
        } catch (e) {
            console.error("Preview generation failed", e);
        } finally {
            setLoading(false)
        }
    }

    const handleComplete = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!user) {
                // For demo purposes, if no user is found, we just simulate success
                console.warn('No user session found. Simulating completion for demo.')
                router.push('/plan?demo=true')
                return
            }

            // 1. Save Profile
            await supabase.from('profiles').upsert({
                id: user.id,
                gender: formData.gender,
                age: parseInt(formData.age) || 30,
                height_cm: parseInt(formData.height) || 170,
                weight_kg: parseFloat(formData.weight) || 70,
                experience_level: formData.experience,
                current_weekly_km: parseFloat(formData.currentWeeklyKm) || 20,
                running_history_months: parseInt(formData.runningHistoryMonths) || 12,
            })

            // 2. Save Plan and Sessions (always run, regenerate plan if preview was skipped)
            {
                // Insert plan - note: no distance_type column in schema, encoded in name
                const { data: plan, error: planError } = await supabase.from('training_plans').insert({
                    user_id: user.id,
                    name: `My ${formData.distance.toUpperCase()} Plan`,
                    start_date: formData.startDate,
                    race_date: formData.raceDate || null,
                    goal_time: formData.goalTime || null,
                    status: 'active',
                    ai_adjustments: aiPhilosophy ? [
                        { type: 'philosophy', content: aiPhilosophy.philosophy },
                        { type: 'adjustments', content: aiPhilosophy.adjustments },
                        { type: 'distance', content: formData.distance }
                    ] : [{ type: 'distance', content: formData.distance }]
                }).select().single()

                if (planError || !plan) {
                    console.error('Plan insert error:', planError)
                    throw planError || new Error('Failed to create plan')
                }

                // If previewPlan wasn't generated (user went back and skipped step 4)
                // regenerate it now before saving
                let planToSave = previewPlan
                if (!planToSave) {
                    const template = getPlanTemplate(formData.distance as DistanceType, formData.experience as ExperienceLevel)
                    planToSave = generatePlanFromTemplate(template, new Date(formData.startDate), {
                        distanceType: formData.distance,
                        raceDate: formData.raceDate,
                        currentWeeklyKm: parseFloat(formData.currentWeeklyKm) || 20,
                    })
                }

                // Prepare sessions
                const sessionsToInsert: {
                    plan_id: string
                    week_number: number
                    scheduled_date: string
                    day_of_week: string
                    session_type: string
                    prescribed_workout: SessionTemplate['prescribedWorkout']
                    status: string
                }[] = []
                const dayMap: Record<string, number> = {
                    'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
                    'Friday': 4, 'Saturday': 5, 'Sunday': 6
                }

                planToSave.forEach((week) => {
                    week.sessions.forEach((session: SessionTemplate) => {
                        const dayOffset = dayMap[session.dayOfWeek] ?? 0
                        // week.startDate may be a Date or ISO string depending on JSON round-trip
                        const weekStart = new Date(week.startDate as Date)
                        const sessionDate = new Date(weekStart)
                        sessionDate.setDate(sessionDate.getDate() + dayOffset)

                        sessionsToInsert.push({
                            plan_id: plan.id,
                            week_number: week.weekNumber,
                            scheduled_date: sessionDate.toISOString().split('T')[0],
                            day_of_week: session.dayOfWeek,
                            session_type: session.sessionType,
                            prescribed_workout: session.prescribedWorkout,
                            status: 'pending'
                        })
                    })
                })

                const { error: sessionsError } = await supabase.from('sessions').insert(sessionsToInsert)
                if (sessionsError) {
                    console.error('Sessions insert error:', sessionsError)
                    // Non-fatal: plan is created, sessions may have partial data
                }
            }

            router.push('/plan')
        } catch (error) {
            console.error('Error completing onboarding:', error)
            alert('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // AI Coach Insight messages based on step and data
    const getCoachInsight = () => {
        if (step === 1) {
            if (formData.age && parseInt(formData.age) > 40) return "Great to see you training! We'll make sure to build in plenty of recovery to keep you injury-free."
            return "Getting the basics down helps me tailor your intensity zones perfectly."
        }
        if (step === 2) {
            if (formData.experience === 'beginner') return "Excellent! We'll start with a solid foundation. Consistency is your superpower right now."
            if (formData.currentWeeklyKm && parseFloat(formData.currentWeeklyKm) > 40) return "Impressive volume! Your base is strong, so we can focus more on quality speed work."
            return "Knowing your history helps me scale your weekly volume safely."
        }
        if (step === 3) {
            if (formData.distance === 'marathon' || formData.distance === '50k') return "A big goal! We'll need to focus on long-run durability and fueling strategy."
            return "Setting a target gives our training purpose. Let's make it happen!"
        }
        return "Your personalized plan is ready. It's designed specifically for your goals and experience."
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-zinc-950">
            {/* Sidebar / Top bar for Coach */}
            <div className="w-full md:w-80 bg-[#FF6B35] p-8 text-white flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">🏃‍♂️</div>
                        <div>
                            <h1 className="font-bold text-xl">Stride Coach</h1>
                            <p className="text-white/70 text-sm">Your Personal Guide</p>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 relative animate-slide-in">
                        <p className="text-lg leading-relaxed italic">&ldquo;{getCoachInsight()}&rdquo;</p>
                        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-[#FF6B35] rotate-45 border-r border-b border-white/10" />
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step === i ? 'bg-white text-[#FF6B35] border-white' : step > i ? 'bg-white/20 border-white/20' : 'border-white/20 text-white/40'}`}>
                                    {step > i ? <Check className="w-4 h-4" /> : i}
                                </div>
                                <span className={`font-semibold ${step === i ? 'text-white' : 'text-white/40'}`}>
                                    {i === 1 ? 'Profile' : i === 2 ? 'Experience' : i === 3 ? 'Goal' : 'The Reveal'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-2xl">
                    
                    {/* Step 1: Profile */}
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h2 className="text-3xl font-extrabold mb-2">Let&apos;s start with the basics</h2>
                                <p className="text-gray-500 dark:text-gray-400">These details help us calculate your effort zones.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none">
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Age</label>
                                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 30" className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Height (cm)</label>
                                    <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 175" className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Weight (kg)</label>
                                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 72" className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                </div>
                            </div>

                            <button onClick={handleNext} disabled={!formData.gender || !formData.age} className="w-full py-5 bg-[#FF6B35] text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100">
                                Continue <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Experience */}
                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h2 className="text-3xl font-extrabold mb-2">Your Running Journey</h2>
                                <p className="text-gray-500 dark:text-gray-400">Be honest - we&apos;ll build the plan to match your current fitness.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['beginner', 'intermediate', 'advanced'].map((level) => (
                                    <div
                                        key={level}
                                        onClick={() => setFormData({ ...formData, experience: level })}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${formData.experience === level ? 'border-[#FF6B35] bg-orange-50 dark:bg-orange-950/20' : 'border-transparent bg-white dark:bg-zinc-900 shadow-sm'}`}
                                    >
                                        <div className="text-2xl">{level === 'beginner' ? '🌱' : level === 'intermediate' ? '🏃' : '⚡'}</div>
                                        <div className="font-bold capitalize">{level}</div>
                                        <div className="text-xs text-gray-500 leading-tight">
                                            {level === 'beginner' ? 'New to running or just starting back.' : level === 'intermediate' ? 'Run 2-3 times a week consistently.' : 'Train regularly for performance.'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Weekly Volume (km)</label>
                                    <input type="number" name="currentWeeklyKm" value={formData.currentWeeklyKm} onChange={handleChange} placeholder="e.g. 20" className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Running History (months)</label>
                                    <input type="number" name="runningHistoryMonths" value={formData.runningHistoryMonths} onChange={handleChange} placeholder="e.g. 12" className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Recent Race Time (Optional)</label>
                                <input type="text" name="recentRaceTime" value={formData.recentRaceTime} onChange={handleChange} placeholder="e.g. 5K in 25:00" className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                <p className="text-xs text-gray-400">Helps me predict your potential more accurately.</p>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-5 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl font-bold hover:bg-white dark:hover:bg-zinc-900 transition-all">Back</button>
                                <button onClick={handleNext} disabled={!formData.currentWeeklyKm} className="flex-[2] py-5 bg-[#FF6B35] text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    Next Step <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Goal */}
                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h2 className="text-3xl font-extrabold mb-2">What are we training for?</h2>
                                <p className="text-gray-500 dark:text-gray-400">Pick your distance and set a target date if you have one.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Race Distance</label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {['5k', '10k', 'half', 'marathon', '50k'].map((dist) => (
                                            <button
                                                key={dist}
                                                onClick={() => setFormData({ ...formData, distance: dist })}
                                                className={`py-4 rounded-xl border-2 font-bold transition-all ${formData.distance === dist ? 'border-[#FF6B35] bg-[#FF6B35] text-white' : 'border-transparent bg-white dark:bg-zinc-900 text-gray-500'}`}
                                            >
                                                {dist.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Race Date</label>
                                        <input type="date" name="raceDate" value={formData.raceDate} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Goal Time</label>
                                        <input type="text" name="goalTime" value={formData.goalTime} onChange={handleChange} placeholder="e.g. 1:45:00" className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Training Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-[#FF6B35] transition-all outline-none" />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-5 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl font-bold hover:bg-white dark:hover:bg-zinc-900 transition-all">Back</button>
                                <button onClick={handleNext} className="flex-[2] py-5 bg-[#FF6B35] text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                    See My Plan <Sparkles className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: The Reveal */}
                    {step === 4 && (
                        <div className="space-y-8 animate-fade-in-up py-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                    <div className="w-20 h-20 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold">Personalizing your journey...</h2>
                                        <p className="text-gray-500">Consulting with the AI Coach and aligning templates.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <div className="inline-flex items-center gap-2 bg-[#FF6B35]/10 text-[#FF6B35] px-4 py-1 rounded-full text-sm font-bold mb-4">
                                            <Sparkles className="w-4 h-4" /> Personalized Plan Ready
                                        </div>
                                        <h2 className="text-4xl font-extrabold">Your Path to the Finish Line</h2>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                                            <div className="text-gray-400 text-xs font-bold uppercase mb-1">Duration</div>
                                            <div className="text-xl font-bold">{previewPlan?.length || 0} Weeks</div>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                                            <div className="text-gray-400 text-xs font-bold uppercase mb-1">Peak Vol</div>
                                            <div className="text-xl font-bold">{Math.max(...(previewPlan?.map(w => w.totalKm) || [0]))}km/w</div>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                                            <div className="text-gray-400 text-xs font-bold uppercase mb-1">Distance</div>
                                            <div className="text-xl font-bold uppercase">{formData.distance}</div>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                                            <div className="text-gray-400 text-xs font-bold uppercase mb-1">Sessions</div>
                                            <div className="text-xl font-bold">{previewPlan?.reduce((acc, w) => acc + w.sessions.length, 0)} Total</div>
                                        </div>
                                    </div>

                                    {/* AI Insight Card */}
                                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-gray-100 text-white dark:text-zinc-900 p-8 rounded-3xl shadow-xl relative overflow-hidden">
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-2 opacity-70">
                                                <Info className="w-5 h-5" />
                                                <span className="text-sm font-bold uppercase tracking-wider">Coach Philosophy</span>
                                            </div>
                                            <p className="text-xl font-medium leading-relaxed">
                                                {aiPhilosophy?.philosophy || "Loading your coaching philosophy..."}
                                            </p>
                                            <div className="pt-4 border-t border-white/20 dark:border-zinc-200">
                                                <p className="text-sm font-bold uppercase opacity-50 mb-2">Suggested Adjustments</p>
                                                <p className="opacity-90">{aiPhilosophy?.adjustments}</p>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Sparkles className="w-32 h-32" />
                                        </div>
                                    </div>

                                    {/* Pledge Interaction */}
                                    <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border-2 border-dashed border-[#FF6B35]/30 text-center">
                                        <h3 className="font-bold text-lg mb-2">The Stride Commitment</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">&ldquo;I commit to my {formData.distance.toUpperCase()} goal, respecting my body&apos;s limits and celebrating every mile.&rdquo;</p>
                                        <div className="flex items-center justify-center gap-2 text-[#FF6B35] font-bold">
                                            <Trophy className="w-5 h-5" />
                                            <span>Ready to start your journey?</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={handleBack} className="flex-1 py-5 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl font-bold hover:bg-white dark:hover:bg-zinc-900 transition-all">Adjust Details</button>
                                        <button onClick={handleComplete} disabled={loading} className="flex-[2] py-5 bg-[#06A77D] text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                            {loading ? 'Finalizing...' : 'Accept & Start Plan'} <Check className="w-6 h-6" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
