import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  ClipboardList,
  Calendar,
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Users,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Thermometer
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  snow: Snowflake,
};

const weatherColors = {
  sunny: "bg-amber-100 text-amber-700",
  cloudy: "bg-slate-100 text-slate-700",
  rainy: "bg-blue-100 text-blue-700",
  stormy: "bg-purple-100 text-purple-700",
  snow: "bg-cyan-100 text-cyan-700",
};

export default function DailyLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    project_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    weather: "sunny",
    temperature: "",
    work_summary: "",
    workers_count: "",
    hours_worked: "",
    materials_used: "",
    issues: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["dailyLogs"],
    queryFn: () => base44.entities.DailyLog.list("-date"),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLogs"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyLog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLogs"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyLog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLogs"] });
    },
  });

  const resetForm = () => {
    setFormData({
      project_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      weather: "sunny",
      temperature: "",
      work_summary: "",
      workers_count: "",
      hours_worked: "",
      materials_used: "",
      issues: "",
      notes: "",
    });
    setEditingLog(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      project_id: log.project_id || "",
      date: log.date || format(new Date(), "yyyy-MM-dd"),
      weather: log.weather || "sunny",
      temperature: log.temperature || "",
      work_summary: log.work_summary || "",
      workers_count: log.workers_count || "",
      hours_worked: log.hours_worked || "",
      materials_used: log.materials_used || "",
      issues: log.issues || "",
      notes: log.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null,
      workers_count: formData.workers_count ? parseInt(formData.workers_count) : null,
      hours_worked: formData.hours_worked ? parseFloat(formData.hours_worked) : null,
    };
    if (editingLog) {
      updateMutation.mutate({ id: editingLog.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.work_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProjectName(log.project_id)?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || log.project_id === projectFilter;
    return matchesSearch && matchesProject;
  });

  if (logsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Daily Logs</h1>
          <p className="text-slate-500 mt-1">Track daily progress on your projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              New Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLog ? "Edit Daily Log" : "Create Daily Log"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_id">Project *</Label>
                  <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weather">Weather</Label>
                  <Select value={formData.weather} onValueChange={(v) => setFormData({ ...formData, weather: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">Sunny</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rainy">Rainy</SelectItem>
                      <SelectItem value="stormy">Stormy</SelectItem>
                      <SelectItem value="snow">Snow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°F)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workers_count">Workers Count</Label>
                  <Input
                    id="workers_count"
                    type="number"
                    value={formData.workers_count}
                    onChange={(e) => setFormData({ ...formData, workers_count: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours_worked">Hours Worked</Label>
                  <Input
                    id="hours_worked"
                    type="number"
                    step="0.5"
                    value={formData.hours_worked}
                    onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_summary">Work Summary</Label>
                <Textarea
                  id="work_summary"
                  value={formData.work_summary}
                  onChange={(e) => setFormData({ ...formData, work_summary: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materials_used">Materials Used</Label>
                <Textarea
                  id="materials_used"
                  value={formData.materials_used}
                  onChange={(e) => setFormData({ ...formData, materials_used: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issues">Issues/Delays</Label>
                <Textarea
                  id="issues"
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {editingLog ? "Save Changes" : "Create Log"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No daily logs found</h3>
            <p className="text-slate-500 text-center">
              {searchQuery || projectFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first daily log to track progress"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const WeatherIcon = weatherIcons[log.weather] || Sun;
            return (
              <Card key={log.id} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-normal">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(log.date), "MMMM d, yyyy")}
                        </Badge>
                        <Badge className={weatherColors[log.weather] || weatherColors.sunny}>
                          <WeatherIcon className="w-3 h-3 mr-1" />
                          {log.weather}
                          {log.temperature && ` · ${log.temperature}°F`}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{getProjectName(log.project_id)}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(log)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(log.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {log.work_summary && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">Work Summary</h4>
                      <p className="text-slate-600">{log.work_summary}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {log.workers_count && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{log.workers_count} workers</span>
                      </div>
                    )}
                    {log.hours_worked && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{log.hours_worked} hours</span>
                      </div>
                    )}
                  </div>
                  {log.issues && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <h4 className="text-sm font-medium text-amber-800 mb-1">Issues/Delays</h4>
                      <p className="text-sm text-amber-700">{log.issues}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}