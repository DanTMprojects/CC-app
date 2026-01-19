import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { sendMessage, markThreadAsRead } from "./threadUtils";
import { format } from "date-fns";

export default function ChatView({ thread, contact, currentUser }) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", thread?.id],
    queryFn: async () => {
      if (!thread?.id) return [];
      const msgs = await base44.entities.ProjectMessage.filter({ thread_id: thread.id });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!thread?.id,
  });

  // Mark as read when thread is opened
  useEffect(() => {
    if (thread?.id && thread.unread_count_gc > 0) {
      markThreadAsRead(thread.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["threads"] });
      });
    }
  }, [thread?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !thread?.id || sending) return;

    setSending(true);
    try {
      await sendMessage(thread.id, "gc", currentUser.email, messageText.trim());
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Select a thread to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-semibold">
              {contact?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{contact?.name}</p>
            <p className="text-sm text-slate-500">{contact?.role}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isGC = message.sender_role === "gc";
              return (
                <div
                  key={message.id}
                  className={`flex ${isGC ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isGC
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isGC ? "text-indigo-200" : "text-slate-500"
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
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}