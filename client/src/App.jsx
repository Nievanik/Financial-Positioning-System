import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import ProfileGate from '@/features/profiles/ProfileGate'
import Dashboard from '@/pages/Dashboard'
import Investments from '@/pages/Investments'
import NotFound from '@/pages/NotFound'
import ProfilePicker from '@/pages/ProfilePicker'
import Simulator from '@/pages/Simulator'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ProfilePicker />} />
          <Route path="p/:slug" element={<ProfileGate />}>
            <Route index element={<Dashboard />} />
            <Route path="simulate" element={<Simulator />} />
            <Route path="investments" element={<Investments />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
