import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Camera,
  ListTodo,
  FileText,
  Receipt,
  Clock,
  ClipboardList,
  Users,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useAppStore } from '@/store/appStore'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: Camera, label: 'Photos', path: '/photos' },
  { icon: ListTodo, label: 'Tasks', path: '/tasks' },
  { icon: FileText, label: 'Invoices', path: '/invoices' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Clock, label: 'Time Tracking', path: '/time-tracking' },
  { icon: ClipboardList, label: 'Daily Logs', path: '/daily-logs' },
  { icon: Users, label: 'Contacts', path: '/contacts' },
]

const secondaryItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const settings = useAppStore((state) => state.settings)

  return (
    <aside
      className={cn(
        "flex flex-col bg-slate-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
          <Building2 className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="font-bold text-lg">TradeTalk Pro</h1>
            <p className="text-xs text-slate-400 truncate max-w-[150px]">
              {settings.companyName}
            </p>
          </div>
        </div>
        {collapsed && <Building2 className="h-8 w-8 text-blue-400 mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Secondary Navigation */}
      <div className="p-2 border-t border-slate-700">
        {secondaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* CompanyCam Status */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className={cn(
              "w-2 h-2 rounded-full",
              settings.companyCamApiKey ? "bg-green-500" : "bg-slate-500"
            )} />
            <span>
              CompanyCam: {settings.companyCamApiKey ? 'Connected' : 'Not configured'}
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
