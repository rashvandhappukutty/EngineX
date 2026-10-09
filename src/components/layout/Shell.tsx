import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  Users,
  Box,
  Bell,
  BarChart2,
  Settings,
  Navigation,
  UserCog,
  Siren,
} from "lucide-react";
import { useDemo } from "../../store/demoState";

export default function Shell() {
  const { currentUser, logout } = useDemo();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["administrator", "coordinator"],
    },
    {
      name: "Incidents",
      path: "/incidents",
      icon: AlertTriangle,
      roles: ["administrator", "coordinator", "security", "responder"],
    },
    {
      name: "Campus Map",
      path: "/campus-map",
      icon: Map,
      roles: ["administrator", "coordinator", "security"],
    },
    {
      name: "Dispatch",
      path: "/dispatch",
      icon: Users,
      roles: ["administrator", "coordinator", "security"],
    },
    {
      name: "Evacuation",
      path: "/evacuation",
      icon: Navigation,
      roles: ["administrator", "coordinator", "security"],
    },
    {
      name: "Resources",
      path: "/resources",
      icon: Box,
      roles: ["administrator", "coordinator", "responder"],
    },
    {
      name: "Alerts",
      path: "/alerts",
      icon: Bell,
      roles: ["administrator", "coordinator", "security", "responder"],
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart2,
      roles: ["administrator", "coordinator"],
    },
    { name: "Users", path: "/users", icon: UserCog, roles: ["administrator"] },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["administrator"],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role),
  );

  return (
    <div className="flex h-screen bg-background text-text font-sans">
      {/* Sidebar - Deep Gradient */}
      <aside className="w-64 bg-sidebar-gradient text-sidebarText border-r border-white/5 flex flex-col transition-all shadow-xl z-30">
        <div className="p-6 flex items-center gap-3 border-b border-white/10 relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary/40 blur-lg rounded-full"></div>
          
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-white shadow-glow">
            EX
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">EngineX</h1>
            <p className="text-xs text-secondary font-medium uppercase tracking-wider">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative group overflow-hidden ${
                  isActive
                    ? "text-white bg-white/10 shadow-[inset_4px_0_0_0_#4F46E5]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors duration-200 ${isActive ? "text-primary" : "text-slate-400 group-hover:text-primary/70"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 mt-auto relative">
          <Link
            to="/report-emergency"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-critical to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-critical/20 transition-all active:scale-95"
          >
            <Siren size={18} />
            Report Emergency
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
        {/* Decorative background blob */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

        <header className="h-16 border-b border-white/40 bg-white/70 backdrop-blur-md flex items-center justify-between px-6 shadow-sm z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-lg text-gray-800 tracking-tight">Central Campus</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 rounded-full border border-amber-300 shadow-sm uppercase tracking-wider">
              DEMO MODE
            </span>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Bell
                size={20}
                className="text-slate-500 cursor-pointer hover:text-slate-700"
              />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-critical rounded-full border-2 border-panel"></span>
            </div>
            <div className="h-8 w-px bg-border"></div>
            <div className="flex items-center gap-3 relative group">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{currentUser.name}</div>
                <div className="text-xs text-muted capitalize">
                  {currentUser.role}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-border flex items-center justify-center text-slate-600 font-bold cursor-pointer hover:bg-slate-300">
                {currentUser.name.charAt(0)}
              </div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 hidden group-hover:block z-50">
                <div className="p-2">
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
