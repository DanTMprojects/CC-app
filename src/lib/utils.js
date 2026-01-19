import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0)
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

export const PROJECT_STATUSES = {
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
}

export const TASK_STATUSES = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
}

export const TASK_PRIORITIES = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
}

export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-800' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
}

export const EXPENSE_CATEGORIES = {
  materials: { label: 'Materials', icon: 'Package' },
  labor: { label: 'Labor', icon: 'Users' },
  equipment: { label: 'Equipment', icon: 'Wrench' },
  permits: { label: 'Permits', icon: 'FileText' },
  subcontractor: { label: 'Subcontractor', icon: 'HardHat' },
  travel: { label: 'Travel', icon: 'Car' },
  office: { label: 'Office', icon: 'Building2' },
  other: { label: 'Other', icon: 'MoreHorizontal' },
}

export const TRADE_CATEGORIES = [
  'Electrician',
  'Plumber',
  'HVAC',
  'Carpenter',
  'Painter',
  'Roofer',
  'Mason',
  'Landscaper',
  'Flooring',
  'Drywall',
  'Concrete',
  'General Labor',
  'Other',
]

export const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Sunny', icon: 'Sun' },
  { value: 'cloudy', label: 'Cloudy', icon: 'Cloud' },
  { value: 'rainy', label: 'Rainy', icon: 'CloudRain' },
  { value: 'stormy', label: 'Stormy', icon: 'CloudLightning' },
  { value: 'snow', label: 'Snow', icon: 'Snowflake' },
]
