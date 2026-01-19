import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, UserPlus, MessageSquare, Mail, Phone, MapPin } from "lucide-react";
import { TRADE_CATEGORIES } from "@/components/config/tradeTaxonomy";
import InviteTradeModal from "@/components/trades/InviteTradeModal";
import { getLinkedTrades } from "@/components/utils/rolodexUtils";
import { findOrCreateDirectThread } from "@/components/utils/threadRules";
import { seedDemoTrades } from "@/components/utils/demoSeed";

const categoryColors = {
  electrician: "bg-amber-100 text-amber-700",
  plumber: "bg-blue-100 text-blue-700",
  hvac: "bg-cyan-100 text-cyan-700",
  painter: "bg-purple-100 text-purple-700",
  drywall: "bg-slate-100 text-slate-700",
  flooring: "bg-orange-100 text-orange-700",
  roofer: "bg-red-100 text-red-700",
  landscaper: "bg-green-100 text-green-700",
};

export default function Trades() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["linkedTrades", myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return [];
      
      // Get rolodex links for this GC
      const links = await base44.entities.RolodexLink.filter({
        gc_profile_id: myProfile.id,
      });

      if (links.length === 0) return [];

      // Get all trade profiles
      const allProfiles = await base44.entities.Profile.list("-created_date");
      const linkedTradeIds = links.map((link) => link.trade_profile_id);

      return allProfiles.filter(
        (profile) => profile.role === "trade" && linkedTradeIds.includes(profile.id)
      );
    },
    enabled: !!myProfile?.id,
  });

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || profile.trade_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleViewProfile = (profile) => {
    navigate(`${createPageUrl("TradeProfile")}?id=${profile.id}`);
  };

  const handleMessage = async (profile, e) => {
    e.stopPropagation();
    try {
      const thread = await findOrCreateDirectThread(profile.id);
      navigate(`${createPageUrl("Thread")}?threadId=${thread.id}`);
    } catch (error) {
      console.error("Error creating direct thread:", error);
    }
  };

  const handleAddDemoTrades = async () => {
    if (!myProfile?.id) return;

    setSeedingDemo(true);
    try {
      await seedDemoTrades(myProfile.id);
      queryClient.invalidateQueries({ queryKey: ["linkedTrades"] });
      queryClient.invalidateQueries({ queryKey: ["tradeProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["allThreads"] });
    } catch (error) {
      console.error("Error seeding demo trades:", error);
    } finally {
      setSeedingDemo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Trade Directory</h1>
          <p className="text-slate-500 mt-1">Browse and invite trades</p>
        </div>
        <div className="flex gap-2">
          {myProfile?.role === "gc" && (
            <Button 
              onClick={handleAddDemoTrades} 
              variant="outline"
              disabled={seedingDemo}
            >
              {seedingDemo ? "Adding..." : "Add Demo Trades"}
            </Button>
          )}
          <Button onClick={() => setInviteModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Trade
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TRADE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trades Grid */}
      {filteredProfiles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No trades found</h3>
            <p className="text-slate-500 text-center mb-4">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Invite trades to join your network"}
            </p>
            <Button onClick={() => setInviteModalOpen(true)} variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Trade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-lg">
                        {profile.company_name?.charAt(0).toUpperCase() || profile.owner_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{profile.company_name || profile.owner_name}</h3>
                      {profile.owner_name && profile.company_name && (
                        <p className="text-sm text-slate-500">{profile.owner_name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {profile.trade_category && (
                  <Badge className={`${categoryColors[profile.trade_category] || "bg-slate-100 text-slate-700"} mb-3`}>
                    {TRADE_CATEGORIES.find(c => c.value === profile.trade_category)?.label || profile.trade_category}
                  </Badge>
                )}

                {profile.trade_tags && profile.trade_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {profile.trade_tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {profile.trade_tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.trade_tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.business_address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{profile.business_address}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={(e) => handleMessage(profile, e)}
                    className="flex-1"
                    variant="outline"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    onClick={() => handleViewProfile(profile)}
                    className="flex-1"
                    variant="outline"
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <InviteTradeModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
    </div>
  );
}