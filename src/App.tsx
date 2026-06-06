import { Navigate, Route, Routes } from 'react-router-dom'
import { FluidBackground } from './components/FluidBackground'
import { Header } from './components/Header'
import { IndexPage } from './pages/Index'
import { NotFoundPage } from './pages/NotFound'
import { RiverDetailPage } from './pages/RiverDetail'
import { SettingsPage } from './pages/Settings'

function App() {
  return (
    <FluidBackground>
      <div className="app-shell">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/river/:id" element={<RiverDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
      </div>
    </FluidBackground>
  )
}

export default App
