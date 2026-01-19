import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, FolderKanban } from "lucide-react";
import { sendMessage, markThreadAsRead, getTradeDisplayName } from "@/components/messages/threadUtils";
import { isGCForProject, isAnnouncementThread, isDirectThread, moveThreadToProject } from "@/components/utils/threadRules";
import { ensureProjectTradeLink } from "@/components/messages/threadUtils";
import MoveToProjectModal from "@/components/messages/MoveToProjectModal";
import { format } from "date-fns";

export default function Thread() {
  const [threadId, setThreadId] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tid = urlParams.get("threadId");
    const pid = urlParams.get("projectId");
    if (tid) setThreadId(tid);
    if (pid) setProjectId(pid);
  }, []);

  const { data: thread } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      if (!threadId) return null;
      const threads = await base44.entities.ProjectThread.list();
      return threads.find((t) => t.id === threadId);
    },
    enabled: !!threadId,
  });

  const { data: project } = useQuery({
    queryKey: ["project", thread?.project_id],
    queryFn: async () => {
      if (!thread?.project_id) return null;
      const projects = await base44.entities.Project.list();
      return projects.find((p) => p.id === thread.project_id);
    },
    enabled: !!thread?.project_id,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", thread?.trade_profile_id],
    queryFn: async () => {
      if (!thread?.trade_profile_id) return null;
      const profiles = await base44.entities.Profile.list();
      return profiles.find((p) => p.id === thread.trade_profile_id);
    },
    enabled: !!thread?.trade_profile_id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const msgs = await base44.entities.ProjectMessage.filter({ thread_id: threadId });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!threadId,
  });

  useEffect(() => {
    if (threadId && thread?.unread_count_gc > 0) {
      markThreadAsRead(threadId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["threads"] });
        queryClient.invalidateQueries({ queryKey: ["allThreads"] });
      });
    }
  }, [threadId, thread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !threadId || !currentUser || sending) return;

    setSending(true);
    try {
      await sendMessage(threadId, "gc", currentUser.email, messageText.trim());
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["allThreads"] });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (projectId) {
      navigate(`${createPageUrl("ProjectThreads")}?projectId=${projectId}`);
    } else {
      navigate(createPageUrl("Messages"));
    }
  };

  const handleMoveToProject = async (selectedProject) => {
    if (!thread || !currentUser) return;

    try {
      // Ensure trade is linked to project
      await ensureProjectTradeLink(selectedProject.id, thread.trade_profile_id, currentUser.email);

      // Move thread to project
      await moveThreadToProject(thread.id, selectedProject.id, thread.trade_profile_id);

      // Navigate to project threads
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["allThreads"] });
      navigate(`${createPageUrl("ProjectThreads")}?projectId=${selectedProject.id}`);
    } catch (error) {
      console.error("Error moving thread to project:", error);
    }
  };

  if (!threadId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No thread selected</p>
      </div>
    );
  }

  const isAnnouncement = thread && isAnnouncementThread(thread);
  const isDirect = thread && isDirectThread(thread);
  const isGC = project && currentUser && isGCForProject(project, currentUser);
  const canSendMessage = isAnnouncement ? isGC : true;
  const displayName = isAnnouncement ? "Announcements" : getTradeDisplayName(profile);

  return (
    <div className="flex flex-col h-screen pb-20 lg:pb-8">
      {/* Header */}
      <div className="border-b border-slate-200 p-4 bg-white">
        <Button variant="ghost" onClick={handleBack} className="mb-2 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{displayName}</p>
              {!isAnnouncement && profile?.trade_category && (
                <p className="text-sm text-slate-500">{profile.trade_category}</p>
              )}
              {isDirect && (
                <p className="text-xs text-slate-400">Direct conversation</p>
              )}
            </div>
          </div>
          {isDirect && (
            <Button
              onClick={() => setMoveModalOpen(true)}
              variant="outline"
              size="sm"
            >
              <FolderKanban className="w-4 h-4 mr-2" />
              Move to Project
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isGCMessage = message.sender_role === "gc";
              return (
                <div
                  key={message.id}
                  className={`flex ${isGCMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      isGCMessage
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isGCMessage ? "text-indigo-200" : "text-slate-500"
                      }`}
                    >
                      {format(new Date(message.created_date), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-slate-200 p-4 bg-white">
        {canSendMessage ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-700 self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center py-4 text-slate-500 text-sm">
            Only GC can post announcements
          </div>
        )}
      </div>

      {/* Move to Project Modal */}
      <MoveToProjectModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        onSelectProject={handleMoveToProject}
      />
    </div>
  );
}