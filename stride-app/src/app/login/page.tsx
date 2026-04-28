'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Try to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                // If sign in fails, try to sign up (simplified for demo)
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                })

                if (signUpError) {
                    throw signInError // Throw the original error or the sign up error
                }
            }

            router.push('/onboarding')
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                        Welcome to Stride
                    </h1>
                    <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                        Sign in to start your training journey
                    </p>
                </div>

                <div className="p-8 rounded-2xl border" style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                }}>
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 rounded-lg border-2"
                                style={{
                                    background: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-lg border-2"
                                style={{
                                    background: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-lg font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: 'var(--color-accent)' }}
                        >
                            {loading ? 'Signing In...' : 'Sign In / Sign Up'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
