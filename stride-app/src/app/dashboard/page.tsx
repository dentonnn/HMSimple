"use client";

import { AlertCircle, TrendingUp, Heart, Calendar } from "lucide-react";
import type { ReactNode } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, useMemo } from "react";

interface ChartDataPoint {
    week: string;
    km: string;
    feel: number;
}

interface StatCardProps {
    label: string;
    value: number;
    unit?: string;
    trend?: string;
    positive?: boolean;
    icon: ReactNode;
}

function getISOWeekKey(dateStr: string): string {
    const d = new Date(dateStr)
    // Find Thursday of this week (ISO weeks are defined by their Thursday)
    const thursday = new Date(d)
    thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3)
    // ISO year is the year that Thursday belongs to
    const isoYear = thursday.getFullYear()
    // Jan 4 is always in ISO week 1
    const jan4 = new Date(isoYear, 0, 4)
    // Find the Monday that starts ISO week 1
    const week1Monday = new Date(jan4)
    week1Monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
    const weekNo = Math.floor((thursday.getTime() - week1Monday.getTime()) / (7 * 86400000)) + 1
    return `${isoYear}-W${String(weekNo).padStart(2, '0')}`
}

export default function Dashboard() {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [stats, setStats] = useState({ currentWeekKm: 0, totalKm: 0, avgFeel: 0, keyWorkouts: 0, kmTrend: null as string | null, feelTrend: null as string | null });
    const [coachInsight, setCoachInsight] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    const fetchData = useCallback(async () => {
        const { data: logs } = await supabase
            .from('workout_logs')
            .select('*, sessions(session_type)')
            .order('logged_at', { ascending: true });

        if (logs && logs.length > 0) {
            // Group by ISO calendar week
            const byWeek: Record<string, typeof logs> = {}
            for (const log of logs) {
                const key = getISOWeekKey(log.logged_at)
                if (!byWeek[key]) byWeek[key] = []
                byWeek[key].push(log)
            }
            const weekKeys = Object.keys(byWeek).sort()

            // Chart: one point per week
            const chartData: ChartDataPoint[] = weekKeys.map(key => {
                const weekLogs = byWeek[key]
                const weekKm = weekLogs.reduce((s, l) => s + (l.distance_meters ?? 0) / 1000, 0)
                const weekFeel = weekLogs.reduce((s, l) => s + (l.feel_rating ?? 4), 0) / weekLogs.length
                return { week: key.replace(/^\d{4}-/, ''), km: weekKm.toFixed(1), feel: Number(weekFeel.toFixed(1)) }
            })
            setData(chartData)

            // Trend: current week vs. previous week
            const latestKey = weekKeys[weekKeys.length - 1]
            const prevKey = weekKeys.length > 1 ? weekKeys[weekKeys.length - 2] : null

            const currentKm = byWeek[latestKey].reduce((s, l) => s + (l.distance_meters ?? 0) / 1000, 0)
            const currentFeelLogs = byWeek[latestKey].filter(l => l.feel_rating != null)
            const currentFeel = currentFeelLogs.length > 0
                ? currentFeelLogs.reduce((s, l) => s + l.feel_rating!, 0) / currentFeelLogs.length
                : 0

            let kmTrend: string | null = null
            let feelTrend: string | null = null

            if (prevKey) {
                const prevKm = byWeek[prevKey].reduce((s, l) => s + (l.distance_meters ?? 0) / 1000, 0)
                const prevFeelLogs = byWeek[prevKey].filter(l => l.feel_rating != null)
                const prevFeel = prevFeelLogs.length > 0
                    ? prevFeelLogs.reduce((s, l) => s + l.feel_rating!, 0) / prevFeelLogs.length
                    : 0
                if (prevKm > 0) {
                    const pct = Math.round(((currentKm - prevKm) / prevKm) * 100)
                    kmTrend = `${pct >= 0 ? '+' : ''}${pct}%`
                }
                if (prevFeel > 0) {
                    const pct = Math.round(((currentFeel - prevFeel) / prevFeel) * 100)
                    feelTrend = `${pct >= 0 ? '+' : ''}${pct}%`
                }
            }

            const totalKm = logs.reduce((s, l) => s + (l.distance_meters ?? 0) / 1000, 0)
            const feelLogs = logs.filter(l => l.feel_rating != null)
            const avgFeel = feelLogs.length > 0
                ? feelLogs.reduce((s, l) => s + l.feel_rating!, 0) / feelLogs.length
                : 0
            const keyWorkouts = logs.filter(l => ['intervals', 'long-run'].includes(l.sessions?.session_type ?? '')).length

            setStats({ currentWeekKm: Number(currentKm.toFixed(1)), totalKm: Number(totalKm.toFixed(1)), avgFeel: Number(avgFeel.toFixed(1)), keyWorkouts, kmTrend, feelTrend })
        }

        // Coach insight from stored AI philosophy
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: plan } = await supabase
                    .from('training_plans')
                    .select('ai_adjustments')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .single()
                const adj = plan?.ai_adjustments as Record<string, unknown> | null
                const philosophy = adj?.find
                    // ai_adjustments is stored as an array of {type, content} objects
                    ? (adj as unknown as Array<{type: string, content: string}>).find(a => a.type === 'philosophy')?.content ?? null
                    : (adj?.coachingPhilosophy as string ?? null)
                setCoachInsight(philosophy)
            }
        } catch {
            // non-fatal — coach insight stays null
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch('/api/strava/sync', { method: 'POST' });
            await fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setSyncing(false);
        }
    };
    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-4 md:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text)]">Training Progress</h1>
                    <p className="text-[var(--color-text-secondary)]">Your journey, at your pace.</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                    <TrendingUp className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Strava'}
                </button>
            </header>

            {/* AI Insight Card */}
            <div className="p-6 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm flex items-start gap-4">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-[var(--color-text)]">Coach Insight</h3>
                    <p className="text-[var(--color-text-secondary)]">
                        {coachInsight
                            ? `“${coachInsight}”`
                            : 'Log your first session to get personalized coach insights here!'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="This Week's KM"
                    value={stats.currentWeekKm}
                    unit="km"
                    trend={stats.kmTrend ?? undefined}
                    positive={stats.kmTrend ? !stats.kmTrend.startsWith('-') : undefined}
                    icon={<Calendar className="w-5 h-5" />}
                />
                <StatCard
                    label="Avg. Feel"
                    value={stats.avgFeel}
                    unit="/5"
                    trend={stats.feelTrend ?? undefined}
                    positive={stats.feelTrend ? !stats.feelTrend.startsWith('-') : undefined}
                    icon={<Heart className="w-5 h-5" />}
                />
                <StatCard
                    label="Key Workouts"
                    value={stats.keyWorkouts}
                    unit="sessions"
                    icon={<AlertCircle className="w-5 h-5" />}
                />
            </div>

            {/* Chart Section */}
            <div className="p-6 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm">
                <h3 className="font-bold text-[var(--color-text)] mb-6">Volume & Feel Trend</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="km"
                                stroke="var(--color-accent)"
                                strokeWidth={3}
                                dot={{ r: 4, fill: 'var(--color-accent)' }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="feel"
                                stroke="#06A77D"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#06A77D' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]"></div>
                        <span className="text-sm text-[var(--color-text-secondary)]">Weekly Volume (KM)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#06A77D]"></div>
                        <span className="text-sm text-[var(--color-text-secondary)]">Average Feel (1-5)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, unit, trend, positive, icon }: StatCardProps) {
    return (
        <div className="p-6 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-text-secondary)]">
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[var(--color-text)]">{value}</span>
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">{unit}</span>
                </div>
            </div>
        </div>
    );
}
