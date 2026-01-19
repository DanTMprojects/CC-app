import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  FileText,
  Receipt,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 50),
  });

  const { data: estimates = [], isLoading: estimatesLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: () => base44.entities.Estimate.list("-created_date", 50),
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 50),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-created_date", 50),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 50),
  });

  const isLoading = projectsLoading || estimatesLoading || invoicesLoading || expensesLoading || tasksLoading;

  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const pendingEstimates = estimates.filter(e => e.status === "sent").length;
  const unpaidInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue");
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const pendingTasks = tasks.filter(t => t.status === "todo" || t.status === "in_progress").length;

  const recentProjects = projects.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);

  const statCards = [
    {
      title: "Active Projects",
      value: activeProjects,
      icon: FolderKanban,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      title: "Pending Estimates",
      value: pendingEstimates,
      icon: FileText,
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Unpaid Invoices",
      value: `$${unpaidTotal.toLocaleString()}`,
      icon: Receipt,
      color: "bg-rose-500",
      lightColor: "bg-rose-50",
      textColor: "text-rose-600",
    },
    {
      title: "Total Expenses",
      value: `$${totalExpenses.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
  ];

  const statusColors = {
    planning: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    on_hold: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    draft: "bg-slate-100 text-slate-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-rose-100 text-rose-700",
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.lightColor}`}>
                    <Icon className={`w-5 h-5 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
            <Link to={createPageUrl("Projects")}>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FolderKanban className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>No projects yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{project.name}</p>
                      <p className="text-sm text-slate-500 truncate">{project.client}</p>
                    </div>
                    <Badge className={statusColors[project.status] || statusColors.planning}>
                      {project.status?.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
            <Link to={createPageUrl("Invoices")}>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {invoice.invoice_number || "Draft"}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{invoice.client_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        ${(invoice.total || 0).toLocaleString()}
                      </span>
                      <Badge className={statusColors[invoice.status] || statusColors.draft}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Pending Tasks ({pendingTasks})
          </CardTitle>
          <Link to={createPageUrl("Tasks")}>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tasks.filter(t => t.status === "todo" || t.status === "in_progress").length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>All caught up!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks
                .filter(t => t.status === "todo" || t.status === "in_progress")
                .slice(0, 6)
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {task.priority === "urgent" || task.priority === "high" ? (
                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-sm text-slate-500 mt-1">
                            Due: {format(new Date(task.due_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}