import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/appStore'
import { formatCurrency, formatDate, INVOICE_STATUSES } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Pencil,
  Trash2,
  DollarSign,
  FileText,
  Send,
  CheckCircle,
  X,
} from 'lucide-react'

export default function Invoices() {
  const invoices = useAppStore((state) => state.invoices)
  const projects = useAppStore((state) => state.projects)
  const addInvoice = useAppStore((state) => state.addInvoice)
  const updateInvoice = useAppStore((state) => state.updateInvoice)
  const deleteInvoice = useAppStore((state) => state.deleteInvoice)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    projectId: '',
    dueDate: '',
    notes: '',
    taxRate: '0',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
  })

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      projectId: '',
      dueDate: '',
      notes: '',
      taxRate: '0',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    })
    setEditingInvoice(null)
  }

  const calculateTotals = (lineItems, taxRate) => {
    const subtotal = lineItems.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0)
    const tax = subtotal * (parseFloat(taxRate) / 100)
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { subtotal, tax, total } = calculateTotals(formData.lineItems, formData.taxRate)

    const invoiceData = {
      ...formData,
      subtotal,
      tax,
      total,
      status: editingInvoice?.status || 'draft',
      taxRate: parseFloat(formData.taxRate),
    }

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData)
      toast.success('Invoice updated')
    } else {
      addInvoice(invoiceData)
      toast.success('Invoice created')
    }

    resetForm()
    setDialogOpen(false)
  }

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      clientName: invoice.clientName || '',
      clientEmail: invoice.clientEmail || '',
      projectId: invoice.projectId || '',
      dueDate: invoice.dueDate || '',
      notes: invoice.notes || '',
      taxRate: invoice.taxRate?.toString() || '0',
      lineItems: invoice.lineItems?.length > 0
        ? invoice.lineItems
        : [{ description: '', quantity: 1, unitPrice: 0 }],
    })
    setDialogOpen(true)
  }

  const handleDelete = (invoice) => {
    if (confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      deleteInvoice(invoice.id)
      toast.success('Invoice deleted')
    }
  }

  const handleStatusChange = (invoice, newStatus) => {
    updateInvoice(invoice.id, { status: newStatus })
    toast.success(`Invoice marked as ${newStatus}`)
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0 }],
    })
  }

  const removeLineItem = (index) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    })
  }

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, lineItems: newItems })
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totals = {
    all: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0),
    outstanding: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0),
  }

  const { subtotal, tax, total } = calculateTotals(formData.lineItems, formData.taxRate)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totals.all)}</p>
                <p className="text-xs text-muted-foreground">Total Invoiced</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totals.paid)}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totals.outstanding)}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(INVOICE_STATUSES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
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
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                <DialogDescription>
                  {editingInvoice ? 'Update invoice details' : 'Create a new invoice'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
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
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  </div>

                  {formData.lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1">
                        {formData.lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>
                    <p className="text-sm text-muted-foreground">Tax: {formatCurrency(tax)}</p>
                    <p className="text-lg font-bold">Total: {formatCurrency(total)}</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Payment terms, notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingInvoice ? 'Update' : 'Create'} Invoice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No invoices found</h3>
            <p className="text-muted-foreground text-sm">Create your first invoice to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{invoice.invoiceNumber}</p>
                      <Badge className={INVOICE_STATUSES[invoice.status]?.color}>
                        {INVOICE_STATUSES[invoice.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{invoice.clientName}</p>
                    {invoice.dueDate && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(invoice.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(invoice, 'sent')}>
                            <Send className="h-4 w-4 mr-2" /> Mark as Sent
                          </DropdownMenuItem>
                        )}
                        {['sent', 'overdue'].includes(invoice.status) && (
                          <DropdownMenuItem onClick={() => handleStatusChange(invoice, 'paid')}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(invoice)}
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
