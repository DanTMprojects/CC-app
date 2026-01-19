import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const PROTECTED_ROUTES = [
  "Dashboard",
  "Projects",
  "ProjectDetail",
  "Trades",
  "TradeProfile",
  "Messages",
  "ProjectThreads",
  "Thread",
  "DailyLogs",
  "Estimates",
  "Invoices",
  "Expenses",
  "TimeTracking",
  "Documents",
  "Tasks",
];

export default function OnboardingGate({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: myProfile, isLoading } = useQuery({
    queryKey: ["myProfile", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const profiles = await base44.entities.Profile.filter({ user_id: currentUser.email });
      return profiles[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (isLoading || !currentUser) return;

    const isProtectedRoute = PROTECTED_ROUTES.includes(currentPageName);
    const needsOnboarding = !myProfile || !myProfile.onboarding_complete;

    if (isProtectedRoute && needsOnboarding) {
      navigate(createPageUrl("Onboarding"));
    }
  }, [currentUser, myProfile, isLoading, currentPageName, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}