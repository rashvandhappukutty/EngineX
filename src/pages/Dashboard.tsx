import { useState, useEffect } from "react";
import { useDemo } from "../store/demoState";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Activity,
  Box,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  Truck,
  Siren,
  Bell,
  Sparkles,
  Cpu,
  Server,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getAIStatus, checkBackendHealth, type AIStatusResponse } from "../services/api";

export default function Dashboard() {
  const { incidents, responders, resources, alerts, currentUser } = useDemo();
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  useEffect(() => {
    async function loadStatus() {
      const health = await checkBackendHealth();
      setBackendOnline(health !== null && health.status !== "offline");
      const status = await getAIStatus();
      setAiStatus(status);
    }
    loadStatus();
  }, []);

  // Metrics
  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status),
  );
  const criticalIncidents = activeIncidents.filter(
    (i) => i.severity === "critical",
  );

  const activeResponders = responders.filter((r) =>
    ["assigned", "dispatched", "acknowledged", "on_scene"].includes(r.status),
  );
  const availableResponders = responders.filter(
    (r) => r.status === "available",
  );

  const unreadAlerts = alerts.filter((a) => !a.read);

  const resourceAvailability =
    Math.round(
      (resources.reduce((acc, r) => acc + r.availableQuantity, 0) /
        resources.reduce((acc, r) => acc + r.totalQuantity, 0)) *
        100,
    ) || 0;

  // Chart Data
  const severityMap: Record<string, number> = {};
  activeIncidents.forEach((i) => {
    severityMap[i.severity] = (severityMap[i.severity] || 0) + 1;
  });
  const severityData = Object.keys(severityMap).map((k) => ({
    name: k.toUpperCase(),
    value: severityMap[k],
  }));

  const COLORS = {
    CRITICAL: "#EF4444",
    HIGH: "#F97316",
    MEDIUM: "#F59E0B",
    LOW: "#3B82F6",
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return (
          <span className="px-2 py-0.5 text-[10px] rounded bg-red-100 text-red-700 font-bold border border-red-200">
            CRITICAL
          </span>
        );
      case "high":
        return (
          <span className="px-2 py-0.5 text-[10px] rounded bg-orange-100 text-orange-700 font-bold border border-orange-200">
            HIGH
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 font-bold border border-amber-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
            LOW
          </span>
        );
    }
  };

  // Welcome back greeting
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-8 px-4 py-6 relative z-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 drop-shadow-sm">
            {greeting}, {currentUser?.name.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2 font-medium">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            System nominal. <span className="text-gray-700 font-semibold">{activeIncidents.length} active incidents</span> require your attention.
          </p>
        </div>
        <div className="flex gap-3">
          {currentUser?.role === "reporter" ? (
            <Link
              to="/report-emergency"
              className="bg-gradient-to-r from-critical to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Siren size={18} /> Report Emergency
            </Link>
          ) : (
            <Link
              to="/incidents"
              className="bg-gradient-to-r from-primary to-primaryHover text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              View All Incidents <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Backend & AI Engine Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 shadow-md border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-400/30">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                CampusOne AI Engine
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                OPERATIONAL
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Active Provider:{" "}
              {aiStatus?.nlu_provider === "gemini" && aiStatus.gemini_configured
                ? `Google Gemini NLU (${aiStatus.gemini_model || "gemini-2.5-flash"})`
                : "Deterministic CampusOne Safety Floor Engine"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
            <Server size={14} className={backendOnline ? "text-emerald-400" : "text-amber-400"} />
            <span className="text-slate-300">FastAPI Backend:</span>
            <span className="font-bold text-white">
              {backendOnline ? "Connected (Port 8000)" : "Connecting..."}
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
            <Cpu size={14} className="text-indigo-400" />
            <span className="text-slate-300">Decision Support:</span>
            <span className="font-bold text-white">Advisory (Human Review Enforced)</span>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <ShieldAlert size={80} className="text-red-500" />
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600"></div>
          <span className="text-sm font-bold text-red-600 uppercase flex items-center gap-2 tracking-wider">
            <AlertTriangle size={16} /> Critical Incidents
          </span>
          <span className="text-5xl font-black text-gray-900 mt-3 z-10 drop-shadow-sm">
            {criticalIncidents.length}
          </span>
          <div className="mt-auto pt-4 text-xs font-medium text-gray-500 z-10">
            {activeIncidents.length} total active incidents
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <Truck size={80} className="text-blue-500" />
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600"></div>
          <span className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2 tracking-wider">
            <Truck size={16} /> Active Dispatch
          </span>
          <span className="text-5xl font-black text-gray-900 mt-3 drop-shadow-sm">
            {activeResponders.length}
          </span>
          <div className="mt-auto pt-4 text-xs font-medium text-gray-500">
            {availableResponders.length} teams available for deployment
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <Box size={80} className="text-green-500" />
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-green-600"></div>
          <span className="text-sm font-bold text-green-600 uppercase flex items-center gap-2 tracking-wider">
            <Box size={16} /> Resource Levels
          </span>
          <span className="text-5xl font-black text-gray-900 mt-3 drop-shadow-sm">
            {resourceAvailability}%
          </span>
          <div className="mt-auto pt-4 text-xs font-medium text-gray-500">
            Overall campus stockpile availability
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <Bell size={80} className="text-orange-500" />
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-orange-600"></div>
          <span className="text-sm font-bold text-orange-600 uppercase flex items-center gap-2 tracking-wider">
            Unread Alerts
          </span>
          <span className="text-5xl font-black text-gray-900 mt-3 drop-shadow-sm">
            {unreadAlerts.length}
          </span>
          {unreadAlerts.length > 0 && (
            <Link
              to="/alerts"
              className="absolute top-6 right-6 text-xs font-bold text-primary hover:text-primaryHover bg-primary/10 px-3 py-1 rounded-full transition-colors"
            >
              View All
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Active Incidents List (Spans 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white/50 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-primary" /> Priority Incident Feed
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeIncidents.length > 0 ? (
              activeIncidents
                .sort((a, b) => {
                  const s = { critical: 4, high: 3, medium: 2, low: 1 };
                  return (s[b.severity] || 0) - (s[a.severity] || 0);
                })
                .map((inc) => (
                  <div
                    key={inc.id}
                    className="bg-white/80 border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:border-primary/30 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-base">
                          {inc.title}
                        </h3>
                        {getSeverityBadge(inc.severity)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {inc.locationDetails}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />{" "}
                          {new Date(inc.reportedTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {inc.assignedTeamId ? (
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                          <CheckCircle size={12} /> Assigned
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200 animate-pulse">
                          Unassigned
                        </span>
                      )}

                      <Link
                        to={`/incidents/${inc.id}`}
                        className="text-sm font-bold text-primary hover:text-white px-4 py-2 bg-primary/10 hover:bg-primary rounded-lg transition-all shadow-sm"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700">
                  All Clear
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  There are no active incidents at this time.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown / Overview Sidebar */}
        <div className="bg-white border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50">
            <h2 className="font-semibold text-slate-800">
              Active Threat Distribution
            </h2>
          </div>

          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            {severityData.length > 0 ? (
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[entry.name as keyof typeof COLORS] ||
                            COLORS.LOW
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm py-12">
                No active threats
              </div>
            )}

            <div className="w-full mt-4 space-y-2">
              {["critical", "high", "medium", "low"].map((sev) => {
                const count = activeIncidents.filter(
                  (i) => i.severity === sev,
                ).length;
                if (count === 0) return null;
                return (
                  <div
                    key={sev}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="capitalize text-slate-600 font-medium">
                      {sev} Priority
                    </span>
                    <span className="font-bold text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-border">
            <Link
              to="/analytics"
              className="w-full block text-center text-sm font-semibold text-primary hover:text-blue-700 transition-colors"
            >
              View Detailed Analytics &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
