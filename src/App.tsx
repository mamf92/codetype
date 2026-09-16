import { Route, Routes } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import Home from '@/routes/Home'
import Explore from '@/routes/Explore'
import Statistics from '@/routes/Statistics'
import Drill from '@/routes/Drill'
import NotFound from '@/routes/NotFound'

export default function App() {
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  )
}
