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
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  User,
} from 'lucide-react'

export default function TimeTracking() {
  const timeEntries = useAppStore((state) => state.timeEntries)
  const projects = useAppStore((state) => state.projects)
  const addTimeEntry = useAppStore((state) => state.addTimeEntry)
  const updateTimeEntry = useAppStore((state) => state.updateTimeEntry)
  const deleteTimeEntry = useAppStore((state) => state.deleteTimeEntry)

  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  const [formData, setFormData] = useState({
    workerName: '',
    hours: '',
    hourlyRate: '',
    overtime: '0',
    breakDuration: '0',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const resetForm = () => {
    setFormData({
      workerName: '',
      hours: '',
      hourlyRate: '',
      overtime: '0',
      breakDuration: '0',
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    })
    setEditingEntry(null)
  }

  const calculateCost = (entry) => {
    const regularHours = parseFloat(entry.hours) || 0
    const overtime = parseFloat(entry.overtime) || 0
    const rate = parseFloat(entry.hourlyRate) || 0
    return (regularHours * rate) + (overtime * rate * 1.5)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const entryData = {
      ...formData,
      hours: parseFloat(formData.hours) || 0,
      hourlyRate: parseFloat(formData.hourlyRate) || 0,
      overtime: parseFloat(formData.overtime) || 0,
      breakDuration: parseFloat(formData.breakDuration) || 0,
    }

    if (editingEntry) {
      updateTimeEntry(editingEntry.id, entryData)
      toast.success('Time entry updated')
    } else {
      addTimeEntry(entryData)
      toast.success('Time entry added')
    }

    resetForm()
    setDialogOpen(false)
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setFormData({
      workerName: entry.workerName || '',
      hours: entry.hours?.toString() || '',
      hourlyRate: entry.hourlyRate?.toString() || '',
      overtime: entry.overtime?.toString() || '0',
      breakDuration: entry.breakDuration?.toString() || '0',
      projectId: entry.projectId || '',
      date: entry.date || new Date().toISOString().split('T')[0],
      description: entry.description || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = (entry) => {
    if (confirm('Delete this time entry?')) {
      deleteTimeEntry(entry.id)
      toast.success('Time entry deleted')
    }
  }

  const filteredEntries = timeEntries.filter((entry) => {
    const matchesSearch = entry.workerName?.toLowerCase().includes(search.toLowerCase())
    const matchesProject = projectFilter === 'all' || entry.projectId === projectFilter
    return matchesSearch && matchesProject
  })

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.name || 'No project'
  }

  const totalHours = filteredEntries.reduce((sum, e) => sum + (e.hours || 0) + (e.overtime || 0), 0)
  const totalCost = filteredEntries.reduce((sum, e) => sum + calculateCost(e), 0)
  const uniqueWorkers = new Set(filteredEntries.map(e => e.workerName)).size

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
                <p className="text-xs text-muted-foreground">Total Labor Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{uniqueWorkers}</p>
                <p className="text-xs text-muted-foreground">Workers</p>
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
              placeholder="Search by worker..."
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
              Log Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingEntry ? 'Edit Time Entry' : 'Log Time'}</DialogTitle>
                <DialogDescription>
                  Track worker hours and labor costs
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="workerName">Worker Name *</Label>
                  <Input
                    id="workerName"
                    value={formData.workerName}
                    onChange={(e) => setFormData({ ...formData, workerName: e.target.value })}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hours">Regular Hours *</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      placeholder="8"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="25.00"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="overtime">Overtime Hours</Label>
                    <Input
                      id="overtime"
                      type="number"
                      step="0.5"
                      value={formData.overtime}
                      onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="breakDuration">Break (minutes)</Label>
                    <Input
                      id="breakDuration"
                      type="number"
                      value={formData.breakDuration}
                      onChange={(e) => setFormData({ ...formData, breakDuration: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Project</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No project</SelectItem>
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
                <div className="grid gap-2">
                  <Label htmlFor="description">Work Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What work was performed?"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Update' : 'Log'} Time
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Time Entry List */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No time entries found</h3>
            <p className="text-muted-foreground text-sm">Start logging work hours</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.workerName}</p>
                      {entry.projectId && (
                        <Badge variant="outline">{getProjectName(entry.projectId)}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.hours}h {entry.overtime > 0 && `+ ${entry.overtime}h OT`}
                      </span>
                      <span>@ {formatCurrency(entry.hourlyRate)}/hr</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold">{formatCurrency(calculateCost(entry))}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(entry)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
