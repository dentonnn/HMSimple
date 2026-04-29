'use client'

import { SessionCard } from '@/components/SessionCard'
import { LogSessionModal } from '@/components/LogSessionModal'
import { AICoachChat } from '@/components/AICoachChat'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SessionWithWorkout, TrainingPlan } from '@/types'


export default function PlanPage() {
    const supabase = createClient()
    const router = useRouter()

    // State
    const [loading, setLoading] = useState(true)
    const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null)
    const [groupedSessions, setGroupedSessions] = useState<Record<number, SessionWithWorkout[]>>({})
    const [totalWeeks, setTotalWeeks] = useState(0)
    const [currentWeek, setCurrentWeek] = useState(1) // The actual current week in time
    const [activeTabWeek, setActiveTabWeek] = useState(1) // The week currently in view/selected
    const [selectedSession, setSelectedSession] = useState<SessionWithWorkout | null>(null)
    
    // Progress Stats
    const [completedSessionsCount, setCompletedSessionsCount] = useState(0)
    const [totalSessionsCount, setTotalSessionsCount] = useState(0)

    // Refs for scrolling
    const weekRefs = useRef<Record<number, HTMLDivElement | null>>({})
    const tabsContainerRef = useRef<HTMLDivElement>(null)

    // Load Data
    useEffect(() => {
        async function loadData() {
            try {
                // 1. Get User
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    console.warn('No user found, showing demo data if available or redirecting')
                }

                // 2. Get Active Plan
                if (user) {
                    const { data: plan } = await supabase
                        .from('training_plans')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('status', 'active')
                        .single()

                    if (!plan) {
                        router.push('/onboarding')
                        return
                    }

                    setActivePlan(plan)

                    // Calculate current week based on start date
                    const startDate = new Date(plan.start_date)
                    const today = new Date()
                    // Set time to midnight for accurate day diff
                    today.setHours(0, 0, 0, 0)
                    startDate.setHours(0, 0, 0, 0)
                    
                    const diffTime = today.getTime() - startDate.getTime()
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                    
                    let weekNum = 1
                    if (diffDays >= 0) {
                        weekNum = Math.floor(diffDays / 7) + 1
                    }
                    setCurrentWeek(weekNum)
                    setActiveTabWeek(weekNum)

                    // 3. Get ALL Sessions for this plan
                    const { data: sessions } = await supabase
                        .from('sessions')
                        .select('*')
                        .eq('plan_id', plan.id)
                        .order('week_number', { ascending: true })
                        .order('scheduled_date', { ascending: true })

                    if (sessions) {
                        const typedSessions = sessions as unknown as SessionWithWorkout[]
                        setTotalSessionsCount(typedSessions.length)
                        setCompletedSessionsCount(typedSessions.filter(s => s.status === 'completed').length)
                        
                        const grouped = typedSessions.reduce((acc, session) => {
                            if (!acc[session.week_number]) {
                                acc[session.week_number] = []
                            }
                            acc[session.week_number].push(session)
                            return acc
                        }, {} as Record<number, SessionWithWorkout[]>)
                        
                        setGroupedSessions(grouped)
                        const maxWeek = Math.max(...Object.keys(grouped).map(Number))
                        setTotalWeeks(maxWeek)
                        
                        // Cap current week to max week if plan is over
                        if (weekNum > maxWeek) {
                            setCurrentWeek(maxWeek)
                            setActiveTabWeek(maxWeek)
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading plan:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [supabase, router])

    // Scroll observing logic
    useEffect(() => {
        if (loading || totalWeeks === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Trigger when top of week card hits top 20% of viewport
            threshold: 0
        };

        const observerCallback: IntersectionObserverCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const weekNum = parseInt(entry.target.getAttribute('data-week') || '1');
                    setActiveTabWeek(weekNum);
                    
                    // Scroll the tab container to keep the active tab in view
                    if (tabsContainerRef.current) {
                        const activeTab = tabsContainerRef.current.querySelector('[data-tab-week="'+weekNum+'"]') as HTMLElement;
                        if (activeTab) {
                            const container = tabsContainerRef.current;
                            const scrollLeft = activeTab.offsetLeft - (container.clientWidth / 2) + (activeTab.clientWidth / 2);
                            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                        }
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        Object.values(weekRefs.current).forEach(ref => {
            if (ref) observer.observe(ref);
        });

        // Initial scroll to current week
        if (weekRefs.current[currentWeek]) {
            setTimeout(() => {
                scrollToWeek(currentWeek)
            }, 100);
        }

        return () => observer.disconnect();
    }, [loading, totalWeeks, currentWeek]);

    const handleSessionSaved = (sessionId: string) => {
        setGroupedSessions(prev => {
            const updated = { ...prev }
            for (const week in updated) {
                updated[week] = updated[week].map(s =>
                    s.id === sessionId ? { ...s, status: 'completed' as const } : s
                )
            }
            return updated
        })
        // Only increment if the session wasn't already completed
        setCompletedSessionsCount(prev => {
            const alreadyDone = Object.values(groupedSessions).flat().find(s => s.id === sessionId)?.status === 'completed'
            return alreadyDone ? prev : prev + 1
        })
        // Do NOT close the modal here — let onClose (Start Rest & Recovery) handle teardown
    }

    const scrollToWeek = (weekNum: number) => {
        setActiveTabWeek(weekNum);
        if (weekRefs.current[weekNum]) {
            // Offset for sticky header and tabs (~140px)
            const y = weekRefs.current[weekNum]!.getBoundingClientRect().top + window.scrollY - 140;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-[#FF6B35] font-bold animate-pulse">Loading Your Plan...</div>
            </div>
        )
    }

    // fallback if no plan found
    if (!activePlan) {
        return <div className="min-h-screen flex items-center justify-center gap-4 flex-col text-center p-6">
            <h2 className="text-2xl font-bold">No Active Plan</h2>
            <p className="text-gray-500 max-w-sm">You haven&apos;t set up a training plan yet. Let&apos;s get you started on your journey.</p>
            <button onClick={() => router.push('/onboarding')} className="mt-4 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-xl active:scale-95 transition-transform">Create My Plan</button>
        </div>
    }

    const progressPercentage = totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0;

    return (
        <div className="min-h-screen pb-24 bg-gray-50 dark:bg-[#121212]">
            {/* Header */}
            <header className="sticky top-0 z-40 px-4 py-4 shadow-sm bg-white dark:bg-[#1e1e1e] border-b dark:border-zinc-800">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="w-10"></div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Your Plan</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Horizontal Week Tabs */}
            <div className="sticky top-[61px] z-30 bg-gray-50 dark:bg-[#121212] border-b dark:border-zinc-800 shadow-sm" style={{ margin: '0 0' }}>
                <div 
                    ref={tabsContainerRef}
                    className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar items-center max-w-2xl mx-auto"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style dangerouslySetInnerHTML={{__html: `
                        .hide-scrollbar::-webkit-scrollbar { display: none; }
                    `}} />
                    
                    {Array.from({ length: totalWeeks }).map((_, i) => {
                        const weekNum = i + 1;
                        const isActive = activeTabWeek === weekNum;
                        const isCurrent = currentWeek === weekNum;
                        
                        // Check if all sessions in this week are complete
                        const weekSessions = groupedSessions[weekNum] || [];
                        const isCompleted = weekSessions.length > 0 && weekSessions.every(s => s.status === 'completed');

                        let btnClass = "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors cursor-pointer active:scale-95 ";
                        
                        if (isActive && isCompleted) {
                            btnClass += "bg-[#06A77D] text-white border-[#06A77D]";
                        } else if (isActive) {
                            btnClass += "bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white";
                        } else if (isCompleted) {
                            btnClass += "bg-[#06A77D]/10 text-[#06A77D] border-[#06A77D]/20 hover:bg-[#06A77D]/20";
                        } else {
                            btnClass += "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700";
                        }

                        return (
                            <button 
                                key={weekNum}
                                data-tab-week={weekNum}
                                onClick={() => scrollToWeek(weekNum)}
                                className={btnClass}
                            >
                                {isCurrent && !isCompleted ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse"></span>
                                        Week {weekNum}
                                    </span>
                                ) : (
                                    `Week ${weekNum}`
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Main Content */}
            <main className="px-4 py-6 max-w-2xl mx-auto">
                <div className="space-y-6">
                    
                    {/* Overall Progress Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border dark:border-zinc-800 shadow-sm flex items-center gap-6">
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.915" fill="none" className="stroke-gray-200 dark:stroke-zinc-700" strokeWidth="3"></circle>
                                <circle cx="18" cy="18" r="15.915" fill="none" className="stroke-[#06A77D] transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray={`${progressPercentage}, 100`} strokeLinecap="round"></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-sm font-bold">{progressPercentage}%</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Training Progress</h3>
                            <div className="text-xl font-bold dark:text-white">{completedSessionsCount} / {totalSessionsCount} Sessions</div>
                        </div>
                    </div>

                    {/* Vertical Timeline of Weeks */}
                    <div className="space-y-8 relative">
                        {/* Vertical line connecting weeks */}
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-zinc-800 z-0"></div>

                        {Array.from({ length: totalWeeks }).map((_, i) => {
                            const weekNum = i + 1;
                            const weekSessions = groupedSessions[weekNum] || [];
                            const isCompleted = weekSessions.length > 0 && weekSessions.every(s => s.status === 'completed');
                            const isCurrent = currentWeek === weekNum;
                            
                            if (weekSessions.length === 0) return null;

                            const firstDate = new Date(weekSessions[0].scheduled_date);
                            const lastDate = new Date(weekSessions[weekSessions.length - 1].scheduled_date);
                            
                            const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                            const dateRange = `${firstDate.toLocaleDateString(undefined, dateOptions)} - ${lastDate.toLocaleDateString(undefined, dateOptions)}`;

                            // Determine phase from the AI adjustment if present, or infer
                            // For simplicity, we just look at the week number proportion
                            let phase = "Base Building";
                            const progress = weekNum / totalWeeks;
                            if (progress > 0.8) phase = "Taper & Peak";
                            else if (progress > 0.4) phase = "Race Specific";

                            return (
                                <div 
                                    key={weekNum} 
                                    className="relative z-10 pl-10"
                                    ref={el => {
                                        weekRefs.current[weekNum] = el;
                                    }}
                                    data-week={weekNum}
                                >
                                    {/* Timeline Node */}
                                    <div className={`absolute left-2.5 top-6 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#121212] flex items-center justify-center ${
                                        isCompleted ? 'bg-[#06A77D]' : 
                                        isCurrent ? 'bg-[#FF6B35]' : 'bg-gray-300 dark:bg-zinc-600'
                                    }`}>
                                        {isCurrent && !isCompleted && <div className="absolute inset-x-[-4px] inset-y-[-4px] rounded-full border border-[#FF6B35] animate-ping opacity-50"></div>}
                                    </div>

                                    {/* Week Card */}
                                    <div className={`bg-white dark:bg-[#1e1e1e] rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
                                        isCompleted ? 'border-[#06A77D]/30 bg-[#06A77D]/5 dark:bg-[#06A77D]/5' : 
                                        isCurrent ? 'border-[#FF6B35]/50 ring-1 ring-[#FF6B35]/20 shadow-md' : 'border-gray-200 dark:border-zinc-800'
                                    }`}>
                                        <div className="mb-5">
                                            <div className="text-xs uppercase tracking-wide mb-1.5 text-gray-500 dark:text-gray-400 font-semibold">
                                                {dateRange}
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                                                        Week {weekNum}
                                                        {isCompleted && (
                                                            <svg className="w-5 h-5 text-[#06A77D]" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </h2>
                                                    <div className="text-sm font-medium text-[#FF6B35] mt-1">{phase}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sessions */}
                                        <div className="space-y-3">
                                            {weekSessions.map((session) => (
                                                <SessionCard
                                                    key={session.id}
                                                    session={session}
                                                    weekNumber={weekNum}
                                                    isCompleted={session.status === 'completed'}
                                                    onLogSession={() => setSelectedSession(session)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>

            {/* Log Modal */}
            {selectedSession && (
                <LogSessionModal
                    isOpen={true}
                    onClose={() => setSelectedSession(null)}
                    onSaveSuccess={handleSessionSaved}
                    session={selectedSession}
                />
            )}

            {/* Floating AI Coach Chat */}
            <AICoachChat />

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-zinc-800">
                <div className="max-w-2xl mx-auto flex">
                    <button className="text-[#FF6B35] flex-1 py-3 flex flex-col items-center gap-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-xs font-bold">Plan</span>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-1 py-3 flex flex-col items-center gap-1 transition-colors" onClick={() => router.push('/settings')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-medium">Settings</span>
                    </button>
                </div>
            </nav>
        </div>
    )
}
