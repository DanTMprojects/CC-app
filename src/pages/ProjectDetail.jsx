import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/store/appStore'
import { formatCurrency, formatDate, PROJECT_STATUSES, TASK_STATUSES } from '@/lib/utils'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Camera,
  ListTodo,
  Receipt,
  Clock,
  ClipboardList,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const project = useAppStore((state) => state.projects.find((p) => p.id === id))
  const tasks = useAppStore((state) => state.tasks.filter((t) => t.projectId === id))
  const expenses = useAppStore((state) => state.expenses.filter((e) => e.projectId === id))
  const dailyLogs = useAppStore((state) => state.dailyLogs.filter((d) => d.projectId === id))
  const timeEntries = useAppStore((state) => state.timeEntries.filter((t) => t.projectId === id))
  const companyCamProjects = useAppStore((state) => state.companyCamProjects)
  const deleteProject = useAppStore((state) => state.deleteProject)

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/projects">Back to Projects</Link>
        </Button>
      </div>
    )
  }

  const linkedCCProject = companyCamProjects.find((cc) => cc.id === project.companyCamProjectId)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalHours = timeEntries.reduce((sum, t) => sum + (t.hours || 0) + (t.overtime || 0), 0)
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const photoCount = (project.photos?.length || 0) + (linkedCCProject?.photo_count || 0)

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all associated tasks, expenses, and daily logs.`)) {
      deleteProject(project.id)
      toast.success('Project deleted')
      navigate('/projects')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge className={PROJECT_STATUSES[project.status]?.color}>
                {PROJECT_STATUSES[project.status]?.label}
              </Badge>
            </div>
            {project.clientName && (
              <p className="text-muted-foreground">{project.clientName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/photos?project=${project.id}`}>
              <Camera className="h-4 w-4 mr-2" />
              Photos ({photoCount})
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-bold">{formatCurrency(project.budget || 0)}</p>
                <p className="text-xs text-muted-foreground">Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-bold">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-muted-foreground">Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-bold">{completedTasks}/{tasks.length}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-bold">{totalHours.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-orange-500" />
              <div>
                <p className="font-bold">{dailyLogs.length}</p>
                <p className="text-xs text-muted-foreground">Daily Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{project.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {project.startDate ? formatDate(project.startDate) : 'No start date'} -
                {project.endDate ? ` ${formatDate(project.endDate)}` : ' No end date'}
              </span>
            </div>
            {project.description && (
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            )}
            {linkedCCProject && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Camera className="h-4 w-4 text-green-600" />
                <span className="text-green-700">
                  Linked to CompanyCam: {linkedCCProject.name} ({linkedCCProject.photo_count || 0} photos)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/tasks?project=${project.id}`}>
                <ListTodo className="h-4 w-4 mr-2" />
                View Tasks ({tasks.length})
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/expenses?project=${project.id}`}>
                <Receipt className="h-4 w-4 mr-2" />
                View Expenses ({expenses.length})
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/daily-logs?project=${project.id}`}>
                <ClipboardList className="h-4 w-4 mr-2" />
                View Daily Logs ({dailyLogs.length})
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/time-tracking?project=${project.id}`}>
                <Clock className="h-4 w-4 mr-2" />
                View Time Entries ({timeEntries.length})
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
          <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-4">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No tasks for this project</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div>
                        <p className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{task.title}</p>
                        {task.dueDate && <p className="text-xs text-muted-foreground">Due: {formatDate(task.dueDate)}</p>}
                      </div>
                      <Badge className={TASK_STATUSES[task.status]?.color}>
                        {TASK_STATUSES[task.status]?.label}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardContent className="p-4">
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No expenses for this project</p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div>
                        <p>{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                      <p className="font-bold">{formatCurrency(expense.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-4">
              {dailyLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No daily logs for this project</p>
              ) : (
                <div className="space-y-2">
                  {dailyLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-2 hover:bg-muted rounded">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatDate(log.date)}</p>
                        <span className="text-sm text-muted-foreground">{log.workerCount} workers</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.workSummary}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
