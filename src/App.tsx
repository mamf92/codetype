import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import Home from '@/routes/Home'
import Explore from '@/routes/Explore'
import Statistics from '@/routes/Statistics'
import Settings from '@/routes/Settings'
import Drill from '@/routes/Drill'
import NotFound from '@/routes/NotFound'
import Welcome from '@/routes/Welcome'
import { useProgress } from '@/store/useProgress'
import { applyTheme } from '@/lib/themes'

/*
 * Basics is its own chunk: the practice runner, the game and the key tracks
 * are only needed once someone goes there, and loading them up front pushed
 * the main bundle past Vite's size warning for everyone who never does.
 */
const Basics = lazy(() => import('@/routes/Basics'))
const WeakKeyPractice = lazy(() => import('@/routes/WeakKeyPractice'))
const KeyStage = lazy(() => import('@/routes/KeyStage'))
const Keyfall = lazy(() => import('@/routes/Keyfall'))

/** Holds the page's own background while a chunk loads, rather than flashing blank. */
const FullScreenLoading = () => <div className="crt min-h-dvh" />

export default function App() {
  const progress = useProgress()

  // Keep the document in sync with whatever the store says the theme is —
  // including a change made later from Settings, not just the first choice.
  useEffect(() => {
    if (progress.theme !== undefined) applyTheme(progress.theme)
  }, [progress.theme])

  // No theme on record means no choice has been made yet, first visit or
  // upgrade alike. Nothing else renders until that is settled.
  if (progress.theme === undefined) return <Welcome />

  return (
    <Routes>
      {/* The drill and practice screens own the whole viewport: no chrome to look away at. */}
      <Route path="/drill/:trackId" element={<Drill />} />
      <Route path="/drill/:trackId/:drillId" element={<Drill />} />
      <Route
        path="/basics/weak/:mode"
        element={
          <Suspense fallback={<FullScreenLoading />}>
            <WeakKeyPractice />
          </Suspense>
        }
      />
      <Route
        path="/basics/keys/:trackId/:stageId"
        element={
          <Suspense fallback={<FullScreenLoading />}>
            <KeyStage />
          </Suspense>
        }
      />
      <Route
        path="/basics/keyfall"
        element={
          <Suspense fallback={<FullScreenLoading />}>
            <Keyfall />
          </Suspense>
        }
      />
      {/* Where weak-key practice lived before Basics; kept so old links still land. */}
      <Route path="/practice" element={<Navigate to="/basics/weak/ladder" replace />} />
      <Route
        path="*"
        element={
          <Shell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route
                path="/basics"
                element={
                  <Suspense fallback={null}>
                    <Basics />
                  </Suspense>
                }
              />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  )
}
