export default function SettingsPage() {
    return (
        <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Settings</h1>

            <div className="space-y-6">
                <div className="p-6 rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <h2 className="text-lg font-bold mb-4">Integrations</h2>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#FC4C02] flex items-center justify-center text-white font-bold">
                                S
                            </div>
                            <div>
                                <div className="font-bold">Strava</div>
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

                <div className="p-6 rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <h2 className="text-lg font-bold mb-4">Profile</h2>
                    <div className="text-sm text-gray-500">Profile editing coming soon...</div>
                </div>
            </div>
        </div>
    )
}
