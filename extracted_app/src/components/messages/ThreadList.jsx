import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, Archive, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function ThreadList({
  threads,
  contacts,
  selectedThreadId,
  onSelectThread,
  onTogglePin,
  onToggleArchive,
}) {
  const getContactName = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact?.name || "Unknown";
  };

  const getContactRole = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact?.role || "other";
  };

  if (threads.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No message threads yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => {
        const isSelected = selectedThreadId === thread.id;
        const hasUnread = thread.unread_count_gc > 0;

        return (
          <div
            key={thread.id}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              isSelected
                ? "bg-indigo-50 border-2 border-indigo-200"
                : "border border-slate-200 hover:bg-slate-50"
            }`}
            onClick={() => onSelectThread(thread)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {thread.pinned && <Pin className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${hasUnread ? "text-slate-900" : "text-slate-700"}`}>
                    {getContactName(thread.contact_id)}
                  </p>
                  <p className="text-xs text-slate-500">{getContactRole(thread.contact_id)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <Badge className="bg-indigo-600 text-white">{thread.unread_count_gc}</Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(thread);
                      }}
                    >
                      <Pin className="w-4 h-4 mr-2" />
                      {thread.pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleArchive(thread);
                      }}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {thread.archived ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {thread.last_message_preview && (
              <p className="text-sm text-slate-600 truncate mb-1">{thread.last_message_preview}</p>
            )}
            {thread.last_message_at && (
              <p className="text-xs text-slate-400">
                {format(new Date(thread.last_message_at), "MMM d, h:mm a")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}