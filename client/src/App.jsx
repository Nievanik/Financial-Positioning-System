import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import ProfileGate from '@/features/profiles/ProfileGate'
import Accounts from '@/pages/Accounts'
import Dashboard from '@/pages/Dashboard'
import Investments from '@/pages/Investments'
import Loans from '@/pages/Loans'
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
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:accountId" element={<Accounts />} />
            <Route path="loans" element={<Loans />} />
            <Route path="simulate" element={<Simulator />} />
            <Route path="investments" element={<Investments />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
