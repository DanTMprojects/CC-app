import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Pencil,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import ProjectAttachments from "@/components/projects/ProjectAttachments";
import TradePickerModal from "@/components/trades/TradePickerModal";
import { ensureProjectTradeLink, findOrCreateThread } from "@/components/messages/threadUtils";

const statusColors = {
  planning: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const typeColors = {
  residential: "bg-purple-100 text-purple-700",
  commercial: "bg-cyan-100 text-cyan-700",
  industrial: "bg-orange-100 text-orange-700",
  renovation: "bg-pink-100 text-pink-700",
};

export default function ProjectDetail() {
  const [projectId, setProjectId] = useState(null);
  const [tradePickerOpen, setTradePickerOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get("projectId");
    if (pid) setProjectId(pid);
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const projects = await base44.entities.Project.list();
      return projects.find((p) => p.id === projectId);
    },
    enabled: !!projectId,
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const handleAddTrade = () => {
    setTradePickerOpen(true);
  };

  const handleTradeSelected = async (trade) => {
    if (!projectId || !currentUser) return;

    try {
      await ensureProjectTradeLink(projectId, trade.id, currentUser.email);
      await findOrCreateThread(projectId, trade.id);
      navigate(`${createPageUrl("ProjectThreads")}?projectId=${projectId}`);
    } catch (error) {
      console.error("Error adding trade:", error);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl("Projects"));
  };

  const handleEdit = () => {
    navigate(createPageUrl("Projects"));
  };

  const handleViewMessages = () => {
    navigate(`${createPageUrl("ProjectThreads")}?projectId=${projectId}`);
  };

  const isProjectCreator = currentUser && project && project.created_by === currentUser.email;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No project selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={handleBack} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-slate-500 mt-1">{project.client}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddTrade} variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Trade
            </Button>
            <Button onClick={handleViewMessages} variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            {isProjectCreator && (
              <Button onClick={handleEdit} variant="outline">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge className={statusColors[project.status] || statusColors.planning}>
              {project.status?.replace("_", " ")}
            </Badge>
            {project.project_type && (
              <Badge className={typeColors[project.project_type] || typeColors.residential}>
                {project.project_type}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.address && (
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-5 h-5 text-slate-400" />
              <span>{project.address}</span>
            </div>
          )}
          {(project.start_date || project.end_date) && (
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span>
                {project.start_date && format(new Date(project.start_date), "MMM d, yyyy")}
                {project.start_date && project.end_date && " - "}
                {project.end_date && format(new Date(project.end_date), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center gap-2 text-slate-700">
              <DollarSign className="w-5 h-5 text-slate-400" />
              <span>${project.budget.toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description Card */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.description ? (
            <p className="text-slate-700 whitespace-pre-wrap">{project.description}</p>
          ) : (
            <p className="text-slate-400 italic">No description provided</p>
          )}

          {/* Attachments Section */}
          <ProjectAttachments
            project={project}
            isCreator={isProjectCreator}
            onUpdate={(updatedData) => {
              updateProjectMutation.mutate({
                id: project.id,
                data: updatedData,
              });
            }}
          />
        </CardContent>
      </Card>

      {/* Trade Picker Modal */}
      <TradePickerModal
        open={tradePickerOpen}
        onOpenChange={setTradePickerOpen}
        onSelectTrade={handleTradeSelected}
      />
    </div>
  );
}