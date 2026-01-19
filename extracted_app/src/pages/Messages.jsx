import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, FolderKanban, ChevronRight, MessageSquare } from "lucide-react";
import { getTradeDisplayName } from "@/components/messages/threadUtils";

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("direct");
  const navigate = useNavigate();

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

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: allThreads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ["allThreads"],
    queryFn: () => base44.entities.ProjectThread.list(),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["tradeProfiles"],
    queryFn: async () => {
      const allProfiles = await base44.entities.Profile.list();
      return allProfiles.filter(p => p.role === "trade");
    },
  });

  const directThreads = allThreads.filter(
    t => t.thread_type === "direct" && !t.project_id && !t.archived
  );

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectThreads = directThreads.filter((thread) => {
    const profile = profiles.find(p => p.id === thread.trade_profile_id);
    const displayName = getTradeDisplayName(profile);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getProjectUnreadCount = (projectId) => {
    return allThreads
      .filter((t) => t.project_id === projectId && !t.archived)
      .reduce((sum, t) => sum + (t.unread_count_gc || 0), 0);
  };

  const handleSelectProject = (project) => {
    navigate(`${createPageUrl("ProjectThreads")}?projectId=${project.id}`);
  };

  const handleSelectDirectThread = (thread) => {
    navigate(`${createPageUrl("Thread")}?threadId=${thread.id}`);
  };

  if (projectsLoading || threadsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 mt-1">View all conversations</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="direct">
            Direct
            {directThreads.length > 0 && (
              <Badge className="ml-2 bg-indigo-600 text-white">{directThreads.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="relative max-w-md mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={activeTab === "direct" ? "Search trades..." : "Search projects..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Direct Threads Tab */}
        <TabsContent value="direct" className="space-y-3 mt-4">
          {filteredDirectThreads.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No direct conversations</h3>
                <p className="text-slate-500 text-center">
                  {searchQuery ? "Try adjusting your search" : "Start a conversation with a trade from the Trades page"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDirectThreads.map((thread) => {
                const profile = profiles.find(p => p.id === thread.trade_profile_id);
                const displayName = getTradeDisplayName(profile);
                const hasUnread = thread.unread_count_gc > 0;

                return (
                  <Card
                    key={thread.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectDirectThread(thread)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold truncate ${hasUnread ? "text-slate-900" : "text-slate-700"}`}>
                              {displayName}
                            </h3>
                            {hasUnread && (
                              <Badge className="bg-indigo-600 text-white">{thread.unread_count_gc}</Badge>
                            )}
                          </div>
                          {profile?.trade_category && (
                            <p className="text-sm text-slate-500 mb-1">{profile.trade_category}</p>
                          )}
                          {thread.last_message_preview ? (
                            <p className="text-sm text-slate-600 truncate">{thread.last_message_preview}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">No messages yet</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-3 mt-4">
          {filteredProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No projects found</h3>
                <p className="text-slate-500 text-center">
                  {searchQuery ? "Try adjusting your search" : "Create a project to start messaging"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const unreadCount = getProjectUnreadCount(project.id);

                return (
                  <Card
                    key={project.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectProject(project)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                            {unreadCount > 0 && (
                              <Badge className="bg-indigo-600 text-white">{unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate">{project.client}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}