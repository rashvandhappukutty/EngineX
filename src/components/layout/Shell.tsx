import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Sparkles,
  Map,
  Navigation,
  Users,
  Box,
  BarChart2,
  Bell,
  Settings,
  UserCog,
  Siren,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Server,
  PhoneCall,
  Search,
  Shield,
  Building2,
} from "lucide-react";
import { useDemo } from "../../store/demoState";
import { LiveClock } from "../common/LiveClock";
import { AIProviderBadge } from "../common/Badge";
import { getAIStatus, checkBackendHealth, type AIStatusResponse } from "../../services/api";

export default function Shell() {
  const { currentUser, logout, incidents, alerts } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [commandQuery, setCommandQuery] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  const activeIncidentsCount = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  ).length;

  const criticalIncidentsCount = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status) && i.severity === "critical"
  ).length;

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function checkStatus() {
      const health = await checkBackendHealth();
      setBackendOnline(health !== null && health.status !== "offline");
      const status = await getAIStatus();
      setAiStatus(status);
    }
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    {
      name: "Command Center",
      path: "/command-center",
      icon: LayoutDashboard,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeVariant: criticalIncidentsCount > 0 ? "critical" : "default",
      roles: ["administrator", "coordinator", "security"],
    },
    {
      name: "Live Campus Map",
      path: "/campus-map",
      icon: Map,
      roles: ["administrator", "coordinator", "security"],
    },
    {
      name: "Incident Management",
      path: "/incidents",
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      roles: ["administrator", "coordinator", "security", "responder"],
    },
    {
      name: "AI Situation Analysis",
      path: "/recommendations",
      icon: Sparkles,
      highlight: true,
      roles: ["administrator", "coordinator"],
    },
    {
      name: "Response Team Allocation",
      path: "/dispatch",
      icon: Users,
      roles: ["administrator", "coordinator", "security"],
    },
    {
      name: "Evacuation Planner",
      path: "/evacuation",
      icon: Navigation,
      roles: ["administrator", "coordinator", "security"],
    },
    {
      name: "Staff and Resources",
      path: "/resources",
      icon: Box,
      roles: ["administrator", "coordinator", "responder"],
    },
    {
      name: "Activity Timeline",
      path: "/alerts",
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
      badgeVariant: "warning",
      roles: ["administrator", "coordinator", "security", "responder"],
    },
    {
      name: "Analytics and Reports",
      path: "/analytics",
      icon: BarChart2,
      roles: ["administrator", "coordinator"],
    },
    {
      name: "Personnel Roster",
      path: "/users",
      icon: UserCog,
      roles: ["administrator"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["administrator"],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandQuery.trim()) return;
    navigate(`/recommendations?query=${encodeURIComponent(commandQuery)}`);
    setCommandQuery("");
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#172033] font-sans overflow-hidden">
      {/* Clean Linear-Style Left Sidebar */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-16" : "w-64"
        } bg-white border-r border-[#E5EAF1] flex flex-col transition-all duration-200 z-30 relative shrink-0 select-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E5EAF1]">
          <Link
            to="/command-center"
            className={`flex items-center gap-2.5 overflow-hidden ${
              isSidebarCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-sm shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1">
                  Engine<span className="text-blue-600">X</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Crisis Coordination
                </span>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed Expand Toggle */}
        {isSidebarCollapsed && (
          <div className="p-2 flex justify-center border-b border-[#E5EAF1]">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/command-center" &&
                item.path !== "/dashboard" &&
                location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                to={item.path}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-medium relative group ${
                  isActive
                    ? "text-blue-700 bg-blue-50/80 font-semibold border border-blue-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  size={17}
                  className={`shrink-0 ${
                    isActive
                      ? "text-blue-600"
                      : item.highlight
                      ? "text-indigo-500"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />

                {!isSidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}

                {!isSidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      item.badgeVariant === "critical"
                        ? "bg-red-100 text-red-700 font-mono"
                        : item.badgeVariant === "warning"
                        ? "bg-amber-100 text-amber-800 font-mono"
                        : "bg-slate-100 text-slate-600 font-mono"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Hotline & Campus Context */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-t border-[#E5EAF1] bg-slate-50/70 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                <PhoneCall size={12} /> Emergency EOC
              </span>
              <span className="text-slate-800 font-mono font-bold">x9911</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Main Smart Campus</span>
              <span className="text-emerald-600 font-medium">Normal Grid</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#E5EAF1] bg-white flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0 shrink-0">
          {/* Left: Campus Selector & Search Command Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Campus Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              <Building2 size={13} className="text-blue-600 shrink-0" />
              <span className="font-semibold">Central Campus</span>
            </div>

            {/* AI Command Bar Input */}
            <form onSubmit={handleCommandSubmit} className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Ask EngineX about your campus (e.g. 'Analyze active fire risk', 'Find available medics')..."
                className="w-full pl-8 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                ↵
              </kbd>
            </form>
          </div>

          {/* Right: Telemetry, AI Provider Status, Live Clock, Emergency Action & User Profile */}
          <div className="flex items-center gap-3 ml-3 shrink-0">
            {/* Live Clock */}
            <div className="hidden lg:block">
              <LiveClock />
            </div>

            {/* AI Provider Status Pill */}
            <div className="hidden xl:block">
              <AIProviderBadge
                provider={aiStatus?.nlu_provider}
                model={aiStatus?.gemini_model}
              />
            </div>

            {/* Backend Connectivity Status */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                backendOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
              title="FastAPI Backend :8000"
            >
              <Server size={12} className={backendOnline ? "text-emerald-600" : "text-red-600"} />
              <span>API Connected</span>
            </div>

            {/* Report Emergency Button */}
            <button
              onClick={() => navigate("/report-emergency")}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Siren size={14} />
              <span className="hidden sm:inline">Report Emergency</span>
            </button>

            {/* Notifications Bell */}
            <Link
              to="/alerts"
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Activity Feed & Alerts"
            >
              <Bell size={17} />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
              )}
            </Link>

            {/* User Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden 2xl:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize leading-tight">
                    {currentUser.role}
                  </div>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      Role: {currentUser.role}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Primary Viewport Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
