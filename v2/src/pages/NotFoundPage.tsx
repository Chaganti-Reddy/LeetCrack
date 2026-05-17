import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="card flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-text-dim">404</p>
        <h1 className="font-display text-5xl font-bold">Route not found</h1>
        <p className="max-w-lg text-sm text-text-muted">The page you asked for doesn’t exist in AlgoTrack v2. Use the command palette or jump back to the tracker.</p>
        <Link to="/tracker/lc"><Button>Go to tracker</Button></Link>
      </div>
    </Layout>
  )
}
