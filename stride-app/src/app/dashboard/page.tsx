"use client";

import { AlertCircle, TrendingUp, Heart, Calendar, type ReactNode } from "lucide-react";
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

export default function Dashboard() {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [stats, setStats] = useState({ totalKm: 0, avgFeel: 0, keyWorkouts: 0 });
    const [syncing, setSyncing] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    const fetchData = useCallback(async () => {
        const { data: logs } = await supabase
            .from('workout_logs')
            .select('*, sessions(session_type)')
            .order('logged_at', { ascending: true });

        if (logs) {
            const chartData = logs.map(log => ({
                week: new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                km: (log.distance_meters / 1000).toFixed(1),
                feel: log.feel_rating || 4
            }));
            setData(chartData);

            const totalKm = logs.reduce((acc, log) => acc + (log.distance_meters / 1000), 0);
            const avgFeel = logs.reduce((acc, log) => acc + (log.feel_rating || 4), 0) / logs.length;
            const keyWorkouts = logs.filter(log => log.sessions?.session_type === 'intervals' || log.sessions?.session_type === 'long-run').length;

            setStats({
                totalKm: Number(totalKm.toFixed(1)),
                avgFeel: Number(avgFeel.toFixed(1)) || 0,
                keyWorkouts
            });
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
                        &ldquo;You&apos;ve shown great consistency over the last 4 weeks. Your feel rating is trending upwards, even as we&apos;ve increased volume. Keep focusing on those recovery runs!&rdquo;
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total KM (Week)"
                    value={stats.totalKm}
                    unit="km"
                    trend="+12%"
                    positive={true}
                    icon={<Calendar className="w-5 h-5" />}
                />
                <StatCard
                    label="Avg. Feel"
                    value={stats.avgFeel}
                    unit="/5"
                    trend="+15%"
                    positive={true}
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
