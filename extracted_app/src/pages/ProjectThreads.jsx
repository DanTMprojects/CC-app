import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChevronRight, Pin, Archive, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { toggleThreadPinned, toggleThreadArchived, getTradeDisplayName } from "@/components/messages/threadUtils";
import { isGCForProject, ensureAnnouncementThread } from "@/components/utils/threadRules";

export default function ProjectThreads() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [filterTab, setFilterTab] = useState("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("projectId");
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, []);

  const { data: project } = useQuery({
    queryKey: ["project", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const projects = await base44.entities.Project.list();
      return projects.find((p) => p.id === selectedProjectId);
    },
    enabled: !!selectedProjectId,
  });

  const { data: projectTradeLinks = [] } = useQuery({
    queryKey: ["projectTradeLinks", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      return await base44.entities.ProjectTradeLink.filter({
        project_id: selectedProjectId,
      });
    },
    enabled: !!selectedProjectId,
  });

  const { data: allThreads = [], isLoading } = useQuery({
    queryKey: ["threads", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      
      // Ensure announcement thread exists
      await ensureAnnouncementThread(selectedProjectId);
      
      // Get existing threads for this project
      const existingThreads = await base44.entities.ProjectThread.filter({
        project_id: selectedProjectId,
      });
      
      // Get all trade links for this project
      const tradeLinks = await base44.entities.ProjectTradeLink.filter({
        project_id: selectedProjectId,
      });
      
      // Ensure a project thread exists for each trade link
      const threadMap = new Map();
      existingThreads.forEach((thread) => {
        if (thread.thread_type === "project" && thread.trade_profile_id) {
          threadMap.set(thread.trade_profile_id, thread);
        }
      });
      
      // Create missing project threads
      const threadsToCreate = [];
      for (const link of tradeLinks) {
        if (!threadMap.has(link.trade_profile_id)) {
          threadsToCreate.push({
            project_id: selectedProjectId,
            trade_profile_id: link.trade_profile_id,
            thread_type: "project",
            last_message_at: null,
            last_message_preview: "",
            pinned: false,
            archived: false,
            unread_count_gc: 0,
            unread_count_trade: 0,
          });
        }
      }
      
      if (threadsToCreate.length > 0) {
        const newThreads = await base44.entities.ProjectThread.bulkCreate(threadsToCreate);
        return [...existingThreads, ...newThreads].sort((a, b) => {
          // Announcement first, then by pinned, then by last_message_at
          if (a.thread_type === "announcement") return -1;
          if (b.thread_type === "announcement") return 1;
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          if (!a.last_message_at) return 1;
          if (!b.last_message_at) return -1;
          return new Date(b.last_message_at) - new Date(a.last_message_at);
        });
      }
      
      return existingThreads.sort((a, b) => {
        if (a.thread_type === "announcement") return -1;
        if (b.thread_type === "announcement") return 1;
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at) - new Date(a.last_message_at);
      });
    },
    enabled: !!selectedProjectId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["tradeProfiles"],
    queryFn: async () => {
      const allProfiles = await base44.entities.Profile.list();
      return allProfiles.filter(p => p.role === "trade");
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: myProfile } = useQuery({
    queryKey: ["myProfile", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const profiles = await base44.entities.Profile.list();
      return profiles.find((p) => p.user_id === currentUser.email);
    },
    enabled: !!currentUser?.email,
  });

  const projectThreads = selectedProjectId
    ? allThreads.filter((thread) => {
        if (thread.project_id !== selectedProjectId) return false;
        if (filterTab === "pinned" && !thread.pinned) return false;
        if (filterTab === "unread" && thread.unread_count_gc === 0) return false;
        if (filterTab === "archived" && !thread.archived) return false;
        if (filterTab === "all" && thread.archived) return false;
        return true;
      })
    : [];

  const profilesById = profiles.reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  const getProfile = (tradeProfileId) => {
    return profilesById[tradeProfileId];
  };

  const handleSelectThread = (thread) => {
    navigate(`${createPageUrl("Thread")}?threadId=${thread.id}&projectId=${selectedProjectId}`);
  };

  const handleBack = () => {
    navigate(createPageUrl("Messages"));
  };

  const handleTogglePin = async (thread, e) => {
    e.stopPropagation();
    await toggleThreadPinned(thread.id, thread.pinned);
    queryClient.invalidateQueries({ queryKey: ["threads"] });
  };

  const handleToggleArchive = async (thread, e) => {
    e.stopPropagation();
    await toggleThreadArchived(thread.id, thread.archived);
    queryClient.invalidateQueries({ queryKey: ["threads"] });
  };

  const isGC = project && currentUser && isGCForProject(project, currentUser);

  if (!selectedProjectId) {
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={handleBack} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Button>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{project?.name || "Project"}</h1>
        <p className="text-slate-500 mt-1">Conversations with trades</p>
      </div>

      {/* Filters */}
      <Tabs value={filterTab} onValueChange={setFilterTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Threads List */}
      {projectThreads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-500 text-center">No conversations yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projectThreads.map((thread) => {
            const isAnnouncement = thread.thread_type === "announcement";
            const profile = isAnnouncement ? null : getProfile(thread.trade_profile_id);
            const hasUnread = thread.unread_count_gc > 0;
            const displayName = isAnnouncement ? "Announcements" : getTradeDisplayName(profile);

            return (
              <Card
                key={thread.id}
                className={`border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                  isAnnouncement ? "border-2 border-indigo-200 bg-indigo-50/30" : ""
                }`}
                onClick={() => handleSelectThread(thread)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {thread.pinned && <Pin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-1" />}
                      {isAnnouncement && <Megaphone className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-1" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium truncate ${hasUnread ? "text-slate-900" : "text-slate-700"}`}>
                            {displayName}
                          </p>
                          {hasUnread && (
                            <Badge className="bg-indigo-600 text-white">{thread.unread_count_gc}</Badge>
                          )}
                        </div>
                        {!isAnnouncement && profile?.trade_category && (
                          <p className="text-xs text-slate-500 mb-1">{profile.trade_category}</p>
                        )}
                        {thread.last_message_preview ? (
                          <p className="text-sm text-slate-600 truncate">{thread.last_message_preview}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No messages yet</p>
                        )}
                        {thread.last_message_at && (
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(thread.last_message_at), "MMM d, h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {!isAnnouncement && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleTogglePin(thread, e)}
                          >
                            <Pin className={`w-4 h-4 ${thread.pinned ? "text-indigo-600" : "text-slate-400"}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleToggleArchive(thread, e)}
                          >
                            <Archive className="w-4 h-4 text-slate-400" />
                          </Button>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}