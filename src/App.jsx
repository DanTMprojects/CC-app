import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Toaster } from '@/components/ui/toast'

// Pages
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import Photos from '@/pages/Photos'
import Tasks from '@/pages/Tasks'
import Invoices from '@/pages/Invoices'
import Expenses from '@/pages/Expenses'
import TimeTracking from '@/pages/TimeTracking'
import DailyLogs from '@/pages/DailyLogs'
import Contacts from '@/pages/Contacts'
import Settings from '@/pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="photos" element={<Photos />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="time-tracking" element={<TimeTracking />} />
          <Route path="daily-logs" element={<DailyLogs />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App
