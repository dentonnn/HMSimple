'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

type EditableProfile = Pick<Profile,
    'display_name' | 'gender' | 'age' |
    'height_cm' | 'weight_kg' | 'experience_level' |
    'running_history_months' | 'current_weekly_km'
>

const emptyProfile: EditableProfile = {
    display_name: null,
    gender: null,
    age: null,
    height_cm: null,
    weight_kg: null,
    experience_level: null,
    running_history_months: null,
    current_weekly_km: null,
}

export default function SettingsPage() {
    const supabase = createClient()
    const [form, setForm] = useState<EditableProfile>(emptyProfile)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    useEffect(() => {
        ;(async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setLoading(false); return }
            const { data: profile } = await supabase
                .from('profiles')
                .select('display_name,gender,age,height_cm,weight_kg,experience_level,running_history_months,current_weekly_km')
                .eq('id', user.id)
                .single()
            if (profile) setForm(profile)
            setLoading(false)
        })()
    }, [supabase])

    const set = (field: keyof EditableProfile, value: string) => {
        const numericFields: (keyof EditableProfile)[] = ['age', 'height_cm', 'weight_kg', 'running_history_months', 'current_weekly_km']
        setForm(prev => ({
            ...prev,
            [field]: numericFields.includes(field)
                ? (value === '' ? null : Number(value))
                : (value || null)
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        setSaveError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
            if (error) throw error
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    const inputClass = "w-full p-3 rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-700 focus:border-[#FF6B35] focus:outline-none transition-colors"
    const labelClass = "block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"

    return (
        <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 dark:text-white">Settings</h1>

            <div className="space-y-6">
                {/* Strava Integration */}
                <div className="p-6 rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">Integrations</h2>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#FC4C02] flex items-center justify-center text-white font-bold">
                                S
                            </div>
                            <div>
                                <div className="font-bold dark:text-white">Strava</div>
                                <div className="text-sm text-gray-500">Connect to sync activities</div>
                            </div>
                        </div>
                        <a
                            href="/api/strava/auth"
                            className="px-4 py-2 rounded-lg bg-[#FC4C02] text-white font-bold text-sm hover:opacity-90"
                        >
                            Connect
                        </a>
                    </div>
                </div>

                {/* Profile Editing */}
                <div className="p-6 rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
                    <h2 className="text-lg font-bold mb-5 dark:text-white">Profile</h2>

                    {loading ? (
                        <div className="h-32 flex items-center justify-center text-gray-400">Loading profile...</div>
                    ) : (
                        <div className="space-y-5">
                            {/* Personal */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Personal</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelClass}>Display Name</label>
                                        <input
                                            type="text"
                                            value={form.display_name ?? ''}
                                            onChange={e => set('display_name', e.target.value)}
                                            className={inputClass}
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Gender</label>
                                            <select
                                                value={form.gender ?? ''}
                                                onChange={e => set('gender', e.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Age</label>
                                            <input
                                                type="number"
                                                value={form.age ?? ''}
                                                onChange={e => set('age', e.target.value)}
                                                className={inputClass}
                                                placeholder="e.g. 32"
                                                min={10} max={100}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Height (cm)</label>
                                            <input
                                                type="number"
                                                value={form.height_cm ?? ''}
                                                onChange={e => set('height_cm', e.target.value)}
                                                className={inputClass}
                                                placeholder="e.g. 175"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Weight (kg)</label>
                                            <input
                                                type="number"
                                                value={form.weight_kg ?? ''}
                                                onChange={e => set('weight_kg', e.target.value)}
                                                className={inputClass}
                                                placeholder="e.g. 70"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Running Background */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Running Background</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelClass}>Experience Level</label>
                                        <select
                                            value={form.experience_level ?? ''}
                                            onChange={e => set('experience_level', e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="">Select</option>
                                            <option value="beginner">Beginner — new to running or starting back</option>
                                            <option value="intermediate">Intermediate — run 2-3x a week consistently</option>
                                            <option value="advanced">Advanced — train regularly for performance</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Running History (months)</label>
                                            <input
                                                type="number"
                                                value={form.running_history_months ?? ''}
                                                onChange={e => set('running_history_months', e.target.value)}
                                                className={inputClass}
                                                placeholder="e.g. 24"
                                                min={0}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Current Weekly km</label>
                                            <input
                                                type="number"
                                                value={form.current_weekly_km ?? ''}
                                                onChange={e => set('current_weekly_km', e.target.value)}
                                                className={inputClass}
                                                placeholder="e.g. 30"
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {saveError && (
                                <p className="text-sm text-red-500 text-center">{saveError}</p>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
