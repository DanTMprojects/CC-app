import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/appStore'
import { formatDate, WEATHER_OPTIONS } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Pencil,
  Trash2,
  ClipboardList,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Users,
  Clock,
  Thermometer,
  AlertTriangle,
} from 'lucide-react'

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  snow: Snowflake,
}

export default function DailyLogs() {
  const dailyLogs = useAppStore((state) => state.dailyLogs)
  const projects = useAppStore((state) => state.projects)
  const addDailyLog = useAppStore((state) => state.addDailyLog)
  const updateDailyLog = useAppStore((state) => state.updateDailyLog)
  const deleteDailyLog = useAppStore((state) => state.deleteDailyLog)

  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)

  const [formData, setFormData] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    weather: 'sunny',
    temperature: '',
    workerCount: '',
    hoursWorked: '',
    workSummary: '',
    materialsUsed: '',
    issuesDelays: '',
  })

  const resetForm = () => {
    setFormData({
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      weather: 'sunny',
      temperature: '',
      workerCount: '',
      hoursWorked: '',
      workSummary: '',
      materialsUsed: '',
      issuesDelays: '',
    })
    setEditingLog(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const logData = {
      ...formData,
      temperature: formData.temperature ? parseInt(formData.temperature) : null,
      workerCount: formData.workerCount ? parseInt(formData.workerCount) : null,
      hoursWorked: formData.hoursWorked ? parseFloat(formData.hoursWorked) : null,
    }

    if (editingLog) {
      updateDailyLog(editingLog.id, logData)
      toast.success('Log updated')
    } else {
      addDailyLog(logData)
      toast.success('Log created')
    }

    resetForm()
    setDialogOpen(false)
  }

  const handleEdit = (log) => {
    setEditingLog(log)
    setFormData({
      projectId: log.projectId || '',
      date: log.date || new Date().toISOString().split('T')[0],
      weather: log.weather || 'sunny',
      temperature: log.temperature?.toString() || '',
      workerCount: log.workerCount?.toString() || '',
      hoursWorked: log.hoursWorked?.toString() || '',
      workSummary: log.workSummary || '',
      materialsUsed: log.materialsUsed || '',
      issuesDelays: log.issuesDelays || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = (log) => {
    if (confirm('Delete this daily log?')) {
      deleteDailyLog(log.id)
      toast.success('Log deleted')
    }
  }

  const filteredLogs = dailyLogs.filter((log) => {
    const matchesSearch =
      log.workSummary?.toLowerCase().includes(search.toLowerCase()) ||
      log.materialsUsed?.toLowerCase().includes(search.toLowerCase())
    const matchesProject = projectFilter === 'all' || log.projectId === projectFilter
    return matchesSearch && matchesProject
  })

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.name || 'No project'
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{dailyLogs.length}</p>
                <p className="text-xs text-muted-foreground">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {dailyLogs.reduce((sum, l) => sum + (l.workerCount || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Worker-Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {dailyLogs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Total Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingLog ? 'Edit Daily Log' : 'Create Daily Log'}</DialogTitle>
                <DialogDescription>
                  Record daily progress on a project
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Project *</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Weather</Label>
                    <Select
                      value={formData.weather}
                      onValueChange={(value) => setFormData({ ...formData, weather: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEATHER_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="temperature">Temp (F)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="72"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="workerCount">Workers</Label>
                    <Input
                      id="workerCount"
                      type="number"
                      value={formData.workerCount}
                      onChange={(e) => setFormData({ ...formData, workerCount: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    step="0.5"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                    placeholder="8"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workSummary">Work Summary *</Label>
                  <Textarea
                    id="workSummary"
                    value={formData.workSummary}
                    onChange={(e) => setFormData({ ...formData, workSummary: e.target.value })}
                    placeholder="What work was completed today?"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="materialsUsed">Materials Used</Label>
                  <Textarea
                    id="materialsUsed"
                    value={formData.materialsUsed}
                    onChange={(e) => setFormData({ ...formData, materialsUsed: e.target.value })}
                    placeholder="List materials used..."
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issuesDelays">Issues / Delays</Label>
                  <Textarea
                    id="issuesDelays"
                    value={formData.issuesDelays}
                    onChange={(e) => setFormData({ ...formData, issuesDelays: e.target.value })}
                    placeholder="Any problems or delays?"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLog ? 'Update' : 'Create'} Log
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Log List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No daily logs found</h3>
            <p className="text-muted-foreground text-sm">Start documenting your daily progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date)).map((log) => {
            const WeatherIcon = weatherIcons[log.weather] || Sun
            return (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{getProjectName(log.projectId)}</Badge>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.date)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
                        <span className="flex items-center gap-1">
                          <WeatherIcon className="h-4 w-4" />
                          {WEATHER_OPTIONS.find(w => w.value === log.weather)?.label}
                          {log.temperature && ` ${log.temperature}°F`}
                        </span>
                        {log.workerCount && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {log.workerCount} workers
                          </span>
                        )}
                        {log.hoursWorked && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {log.hoursWorked}h
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2">{log.workSummary}</p>
                      {log.materialsUsed && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Materials:</strong> {log.materialsUsed}
                        </p>
                      )}
                      {log.issuesDelays && (
                        <p className="text-sm text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {log.issuesDelays}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(log)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(log)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
