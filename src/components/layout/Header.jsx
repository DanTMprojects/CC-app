import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/appStore'
import { companyCam } from '@/services/companyCam'
import { toast } from 'sonner'

const pageTitles = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/photos': 'Photo Gallery',
  '/tasks': 'Tasks',
  '/invoices': 'Invoices',
  '/expenses': 'Expenses',
  '/time-tracking': 'Time Tracking',
  '/daily-logs': 'Daily Logs',
  '/contacts': 'Contacts',
  '/settings': 'Settings',
}

export function Header({ onMenuClick }) {
  const location = useLocation()
  const [syncing, setSyncing] = useState(false)
  const settings = useAppStore((state) => state.settings)
  const setCompanyCamProjects = useAppStore((state) => state.setCompanyCamProjects)
  const updateLastSync = useAppStore((state) => state.updateLastSync)
  const lastSync = useAppStore((state) => state.lastSync)

  const pageTitle = pageTitles[location.pathname] || 'TradeTalk Pro'

  const handleSync = async () => {
    if (!settings.companyCamApiKey) {
      toast.error('Please configure your CompanyCam API key in Settings')
      return
    }

    setSyncing(true)
    try {
      companyCam.setApiKey(settings.companyCamApiKey)
      const result = await companyCam.testConnection()

      if (!result.success) {
        throw new Error(result.error)
      }

      const projects = await companyCam.syncAllProjects((progress) => {
        console.log(`Syncing: ${progress.loaded} projects loaded`)
      })

      setCompanyCamProjects(projects)
      updateLastSync()
      toast.success(`Synced ${projects.length} projects from CompanyCam`)
    } catch (error) {
      toast.error(`Sync failed: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 w-64"
          />
        </div>

        {/* CompanyCam Sync */}
        {settings.companyCamApiKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="hidden sm:flex"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Last sync indicator */}
        {lastSync && (
          <span className="text-xs text-muted-foreground hidden lg:block">
            Last sync: {new Date(lastSync).toLocaleTimeString()}
          </span>
        )}
      </div>
    </header>
  )
}
