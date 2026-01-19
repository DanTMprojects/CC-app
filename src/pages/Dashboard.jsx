import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'
import { formatCurrency, formatDate, PROJECT_STATUSES, TASK_STATUSES } from '@/lib/utils'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  ListTodo,
  DollarSign,
  Clock,
  Camera,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export default function Dashboard() {
  const projects = useAppStore((state) => state.projects)
  const tasks = useAppStore((state) => state.tasks)
  const invoices = useAppStore((state) => state.invoices)
  const expenses = useAppStore((state) => state.expenses)
  const companyCamProjects = useAppStore((state) => state.companyCamProjects)

  // Stats calculations
  const activeProjects = projects.filter(p => p.status === 'in_progress').length
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
  const totalPhotos = companyCamProjects.reduce((sum, p) => sum + (p.photo_count || 0), 0) +
    projects.reduce((sum, p) => sum + (p.photos?.length || 0), 0)

  const recentProjects = [...projects].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5)

  const urgentTasks = tasks
    .filter(t => t.status !== 'completed' && (t.priority === 'high' || t.priority === 'urgent'))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalExpenses)} in expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPhotos}</div>
            <p className="text-xs text-muted-foreground">
              {companyCamProjects.length} CompanyCam projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest construction projects</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No projects yet</p>
                <Button className="mt-4" asChild>
                  <Link to="/projects">Create your first project</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.clientName || project.address || 'No details'}
                      </p>
                    </div>
                    <Badge className={PROJECT_STATUSES[project.status]?.color}>
                      {PROJECT_STATUSES[project.status]?.label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Priority Tasks</CardTitle>
                <CardDescription>High priority items needing attention</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/tasks">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">No urgent tasks</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urgentTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <AlertCircle className={
                      task.priority === 'urgent' ? 'h-5 w-5 text-red-500' : 'h-5 w-5 text-orange-500'
                    } />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                      </p>
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

        {/* Unpaid Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Unpaid Invoices</CardTitle>
                <CardDescription>Outstanding payments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/invoices">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">All invoices paid!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unpaidInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {invoice.clientName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                      <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/projects">
                  <FolderKanban className="h-6 w-6 mb-2" />
                  New Project
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/tasks">
                  <ListTodo className="h-6 w-6 mb-2" />
                  Add Task
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/invoices">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Create Invoice
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/photos">
                  <Camera className="h-6 w-6 mb-2" />
                  View Photos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
