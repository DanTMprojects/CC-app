import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Pencil,
  Trash2,
  Receipt,
  DollarSign,
  TrendingUp,
} from 'lucide-react'

export default function Expenses() {
  const expenses = useAppStore((state) => state.expenses)
  const projects = useAppStore((state) => state.projects)
  const addExpense = useAppStore((state) => state.addExpense)
  const updateExpense = useAppStore((state) => state.updateExpense)
  const deleteExpense = useAppStore((state) => state.deleteExpense)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'materials',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    receiptUrl: '',
    billable: false,
  })

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'materials',
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      receiptUrl: '',
      billable: false,
    })
    setEditingExpense(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData)
      toast.success('Expense updated')
    } else {
      addExpense(expenseData)
      toast.success('Expense added')
    }

    resetForm()
    setDialogOpen(false)
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      category: expense.category || 'materials',
      projectId: expense.projectId || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      vendor: expense.vendor || '',
      receiptUrl: expense.receiptUrl || '',
      billable: expense.billable || false,
    })
    setDialogOpen(true)
  }

  const handleDelete = (expense) => {
    if (confirm('Delete this expense?')) {
      deleteExpense(expense.id)
      toast.success('Expense deleted')
    }
  }

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.description?.toLowerCase().includes(search.toLowerCase()) ||
      exp.vendor?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter
    const matchesProject = projectFilter === 'all' || exp.projectId === projectFilter
    return matchesSearch && matchesCategory && matchesProject
  })

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.name || 'No project'
  }

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const billableExpenses = filteredExpenses.filter(e => e.billable).reduce((sum, e) => sum + (e.amount || 0), 0)

  const categoryTotals = Object.keys(EXPENSE_CATEGORIES).map(cat => ({
    category: cat,
    label: EXPENSE_CATEGORIES[cat].label,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredExpenses.length}</p>
                <p className="text-xs text-muted-foreground">Expense Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(billableExpenses)}</p>
                <p className="text-xs text-muted-foreground">Billable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      {categoryTotals.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Expenses by Category</p>
            <div className="flex flex-wrap gap-2">
              {categoryTotals.map(({ category, label, total }) => (
                <Badge key={category} variant="outline" className="py-1 px-3">
                  {label}: {formatCurrency(total)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                <DialogDescription>
                  Track project expenses and costs
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Lumber for framing"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="e.g., Home Depot"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receiptUrl">Receipt URL</Label>
                  <Input
                    id="receiptUrl"
                    value={formData.receiptUrl}
                    onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="billable"
                    checked={formData.billable}
                    onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
                  />
                  <Label htmlFor="billable">Billable to client</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No expenses found</h3>
            <p className="text-muted-foreground text-sm">Start tracking your expenses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{expense.description}</p>
                      <Badge variant="outline">{EXPENSE_CATEGORIES[expense.category]?.label}</Badge>
                      {expense.billable && <Badge className="bg-green-100 text-green-800">Billable</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {expense.vendor && <span>{expense.vendor}</span>}
                      {expense.projectId && <span>{getProjectName(expense.projectId)}</span>}
                      {expense.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold">{formatCurrency(expense.amount)}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(expense)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(expense)}
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
