
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Receipt,
  Clock,
  DollarSign,
  Users,
  FileArchive,
  ClipboardList,
  Menu,
  X,
  ChevronDown,
  Building2,
  LogOut,
  Hammer,
  MessageSquare,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import OnboardingGate from "@/components/auth/OnboardingGate";

const primaryNavItems = [
  { name: "Projects", icon: FolderKanban, page: "Projects" },
  { name: "Trades", icon: Hammer, page: "Trades" },
  { name: "Messages", icon: MessageSquare, page: "Messages" },
];

const secondaryNavItems = [
  { name: "Daily Logs", icon: ClipboardList, page: "DailyLogs" },
  { name: "Estimates", icon: FileText, page: "Estimates" },
  { name: "Invoices", icon: Receipt, page: "Invoices" },
  { name: "Expenses", icon: DollarSign, page: "Expenses" },
  { name: "Time Tracking", icon: Clock, page: "TimeTracking" },
  { name: "Documents", icon: FileArchive, page: "Documents" },
  { name: "Tasks", icon: ClipboardList, page: "Tasks" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-7 h-7 text-indigo-600" />
          <span className="font-bold text-lg text-slate-900">Trade Talk</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <span className="font-bold text-xl text-slate-900">Trade Talk</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 mt-14 lg:mt-0">
            <ul className="space-y-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <li key={item.page}>
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="my-4 border-t border-slate-200" />

            <ul className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <li key={item.page}>
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section */}
          <div className="border-t border-slate-100">
            <Link
              to={createPageUrl("MyProfile")}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-7 py-3 text-sm font-medium transition-all ${
                currentPageName === "MyProfile"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <UserCircle className={`w-5 h-5 ${currentPageName === "MyProfile" ? "text-indigo-600" : "text-slate-400"}`} />
              My Profile
            </Link>
            <div className="px-4 py-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-slate-900"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          <OnboardingGate currentPageName={currentPageName}>
            {children}
          </OnboardingGate>
        </div>
      </main>
    </div>
  );
}
