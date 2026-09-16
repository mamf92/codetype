import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
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
      {/* The drill screen owns the whole viewport: no chrome to look away at. */}
      <Route path="/drill/:trackId" element={<Drill />} />
      <Route path="/drill/:trackId/:drillId" element={<Drill />} />
      <Route
        path="*"
        element={
          <Shell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
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
