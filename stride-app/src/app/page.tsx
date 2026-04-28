import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold" style={{ color: 'var(--color-text)' }}>
            🏃 Stride
          </h1>
          <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>
            Your AI-powered running coach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['5K', '10K', 'Half Marathon', 'Marathon', '50K'].map((distance) => (
            <div
              key={distance}
              className="p-6 rounded-xl border transition-all hover:scale-105 cursor-pointer"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                {distance}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Training Plan
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/plan"
            className="px-8 py-4 rounded-lg font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}
          >
            View Demo Plan
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-lg font-bold border-2 transition-all hover:opacity-80"
            style={{
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
            }}
          >
            Get Started
          </Link>
        </div>

        <div className="pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                AI Coach
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Personalized feedback and plan adjustments
              </div>
            </div>
            <div>
              <div className="text-2xl mb-2">🔗</div>
              <div className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                Strava Sync
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Auto-log workouts from your Strava activities
              </div>
            </div>
            <div>
              <div className="text-2xl mb-2">🌱</div>
              <div className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                Positive Focus
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Encouraging, judgment-free training
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
