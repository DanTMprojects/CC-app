import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User } from "lucide-react";

export default function TradePickerModal({ open, onOpenChange, onSelectTrade }) {
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: trades = [] } = useQuery({
    queryKey: ["linkedTrades", myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return [];
      
      const links = await base44.entities.RolodexLink.filter({
        gc_profile_id: myProfile.id,
      });

      if (links.length === 0) return [];

      const allProfiles = await base44.entities.Profile.list();
      const linkedTradeIds = links.map((link) => link.trade_profile_id);

      return allProfiles.filter(
        (profile) => profile.role === "trade" && linkedTradeIds.includes(profile.id)
      );
    },
    enabled: !!myProfile?.id,
  });

  const filteredTrades = trades.filter((trade) =>
    trade.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.trade_category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Trade</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <User className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>No trades found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTrades.map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => {
                    onSelectTrade(trade);
                    onOpenChange(false);
                  }}
                  className="w-full p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {trade.company_name?.charAt(0).toUpperCase() || trade.owner_name?.charAt(0).toUpperCase() || "T"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {trade.company_name || trade.owner_name || trade.phone || "Trade"}
                        </p>
                        {trade.trade_category && (
                          <p className="text-sm text-slate-500">{trade.trade_category}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}