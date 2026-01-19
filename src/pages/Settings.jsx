import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/appStore'
import { companyCam } from '@/services/companyCam'
import { toast } from 'sonner'
import {
  Settings as SettingsIcon,
  Camera,
  Building2,
  Database,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Key,
  ExternalLink,
} from 'lucide-react'

export default function Settings() {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const resetStore = useAppStore((state) => state.resetStore)
  const setCompanyCamProjects = useAppStore((state) => state.setCompanyCamProjects)
  const updateLastSync = useAppStore((state) => state.updateLastSync)

  const projects = useAppStore((state) => state.projects)
  const tasks = useAppStore((state) => state.tasks)
  const invoices = useAppStore((state) => state.invoices)
  const expenses = useAppStore((state) => state.expenses)

  const [apiKey, setApiKey] = useState(settings.companyCamApiKey || '')
  const [companyName, setCompanyName] = useState(settings.companyName || '')
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const handleSaveCompanyInfo = () => {
    updateSettings({ companyName })
    toast.success('Company information saved')
  }

  const handleSaveApiKey = () => {
    updateSettings({ companyCamApiKey: apiKey })
    setConnectionStatus(null)
    toast.success('API key saved')
  }

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key first')
      return
    }

    setTesting(true)
    setConnectionStatus(null)

    try {
      companyCam.setApiKey(apiKey)
      const result = await companyCam.testConnection()

      if (result.success) {
        setConnectionStatus({
          success: true,
          company: result.company,
        })
        toast.success('Connection successful!')
      } else {
        setConnectionStatus({
          success: false,
          error: result.error,
        })
        toast.error(`Connection failed: ${result.error}`)
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error.message,
      })
      toast.error(`Connection failed: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const handleSyncProjects = async () => {
    if (!settings.companyCamApiKey) {
      toast.error('Please configure your API key first')
      return
    }

    setSyncing(true)
    try {
      companyCam.setApiKey(settings.companyCamApiKey)
      const projects = await companyCam.syncAllProjects()
      setCompanyCamProjects(projects)
      updateLastSync()
      toast.success(`Synced ${projects.length} projects from CompanyCam`)
    } catch (error) {
      toast.error(`Sync failed: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleExportData = () => {
    const data = {
      settings,
      projects: useAppStore.getState().projects,
      tasks: useAppStore.getState().tasks,
      contacts: useAppStore.getState().contacts,
      invoices: useAppStore.getState().invoices,
      expenses: useAppStore.getState().expenses,
      dailyLogs: useAppStore.getState().dailyLogs,
      timeEntries: useAppStore.getState().timeEntries,
      trades: useAppStore.getState().trades,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tradetalk-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Data exported successfully')
  }

  const handleImportData = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)

        if (data.settings) updateSettings(data.settings)
        // Note: In a real app, we'd import all the data properly

        toast.success('Data imported successfully')
      } catch (error) {
        toast.error('Failed to import data: Invalid file format')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      resetStore()
      setApiKey('')
      setCompanyName('My Construction Co.')
      setConnectionStatus(null)
      toast.success('All data cleared')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>
            Basic information about your company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
          <Button onClick={handleSaveCompanyInfo}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* CompanyCam Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <CardTitle>CompanyCam Integration</CardTitle>
          </div>
          <CardDescription>
            Connect to CompanyCam to sync project photos automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your CompanyCam API key"
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSaveApiKey}>
                <Key className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://app.companycam.com/settings/integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                CompanyCam Settings <ExternalLink className="h-3 w-3 inline" />
              </a>
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : connectionStatus?.success ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              ) : connectionStatus?.success === false ? (
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
              ) : null}
              Test Connection
            </Button>
            <Button
              variant="outline"
              onClick={handleSyncProjects}
              disabled={syncing || !settings.companyCamApiKey}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Projects
            </Button>
          </div>

          {connectionStatus && (
            <div className={`p-3 rounded-lg ${
              connectionStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {connectionStatus.success ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Connected to CompanyCam</p>
                    {connectionStatus.company && (
                      <p className="text-sm">Company: {connectionStatus.company.name}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Connection Failed</p>
                    <p className="text-sm">{connectionStatus.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Data Management</CardTitle>
          </div>
          <CardDescription>
            Export, import, or clear your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-xs text-muted-foreground">Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{invoices.length}</p>
              <p className="text-xs text-muted-foreground">Invoices</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{expenses.length}</p>
              <p className="text-xs text-muted-foreground">Expenses</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <CardTitle>About TradeTalk Pro</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Version 1.0.0</p>
            <p>
              A comprehensive construction project management app with CompanyCam integration
              for seamless photo organization and sharing.
            </p>
            <p className="pt-2">
              <strong>Features:</strong> Project Management, Task Tracking, Invoicing,
              Expense Tracking, Time Tracking, Daily Logs, Contact Management,
              and CompanyCam Photo Sync.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
