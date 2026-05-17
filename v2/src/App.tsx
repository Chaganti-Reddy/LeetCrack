import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { ToastProvider } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useProgress } from '@/hooks/useProgress'
import { useProblems } from '@/hooks/useProblems'
import TrackerPage from '@/pages/TrackerPage'
import ProfilePage from '@/pages/ProfilePage'
import InsightsPage from '@/pages/InsightsPage'
import ContestsPage from '@/pages/ContestsPage'
import NotFoundPage from '@/pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    void _error
    void _errorInfo
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
          <div className="card max-w-lg p-6 text-center">
            <h1 className="font-display text-4xl font-bold">AlgoTrack hit a snag</h1>
            <p className="mt-3 text-sm text-text-muted">Refresh the page to recover. If the issue persists, check your data endpoints or Supabase env vars.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppBootstrap() {
  const initialize = useAuthStore((state) => state.initialize)
  const theme = useUiStore((state) => state.theme)
  useProblems()
  useProgress()

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tracker/lc" replace />} />
        <Route path="/tracker/:platform" element={<TrackerPage />} />
        <Route path="/profile/:platform" element={<ProfilePage />} />
        <Route path="/insights/:platform" element={<InsightsPage />} />
        <Route path="/contests/:platform" element={<ContestsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppBootstrap />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
