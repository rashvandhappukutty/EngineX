import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "../store/demoState";
import {
  AlertTriangle,
  Users,
  ArrowRight,
  Sparkles,
  Building2,
  MapPin,
  Flame,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SeverityBadge, StatusBadge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";
import { getAIStatus, type AIStatusResponse } from "../services/api";

export default function Dashboard() {
  const { incidents, responders, buildings, setSelectedIncidentId } = useDemo();
  const navigate = useNavigate();

  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const status = await getAIStatus();
      setAiStatus(status);
    }
    loadStatus();
  }, []);

  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  );
  const criticalCount = activeIncidents.filter((i) => i.severity === "critical").length;
  const availableResponders = responders.filter((r) => r.status === "available").length;

  const severityBreakdown = [
    { name: "Critical", value: incidents.filter((i) => i.severity === "critical").length, color: "#DC2626" },
    { name: "High", value: incidents.filter((i) => i.severity === "high").length, color: "#F97316" },
    { name: "Medium", value: incidents.filter((i) => i.severity === "medium").length, color: "#F59E0B" },
    { name: "Low", value: incidents.filter((i) => i.severity === "low").length, color: "#10B981" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Hero Welcome Header */}
      <div className="light-card p-6 border-l-4 border-l-blue-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Campus Operations Center
            </span>
            <span className="text-xs text-slate-500">Real-time Situational Awareness</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campus Crisis Intelligence Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Coordinating campus safety through automated natural-language triage, dynamic building evacuations, and qualified response-team allocation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/command-center"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Open Command Center</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Emergencies"
          value={activeIncidents.length}
          subtitle={`${criticalCount} require immediate response`}
          icon={AlertTriangle}
          variant="blue"
          onClick={() => navigate("/incidents")}
        />
        <StatCard
          title="Critical Threats"
          value={criticalCount}
          subtitle="Enforced life-safety floor"
          icon={Flame}
          variant="red"
          onClick={() => navigate("/incidents?filter=critical")}
        />
        <StatCard
          title="Available Personnel"
          value={`${availableResponders}/${responders.length}`}
          subtitle="Active responders ready"
          icon={Users}
          variant="green"
          onClick={() => navigate("/dispatch")}
        />
        <StatCard
          title="Total Buildings"
          value={buildings.length}
          subtitle="Monitored facility sectors"
          icon={Building2}
          variant="purple"
          onClick={() => navigate("/campus-map")}
        />
      </div>

      {/* Main Grid: Active Incidents List + Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Stream (2 cols) */}
        <div className="lg:col-span-2 light-card p-5">
          <div className="flex items-center justify-between border-b border-[#E5EAF1] pb-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Active Incident Stream
            </h2>
            <Link
              to="/incidents"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View full list</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {activeIncidents.map((inc) => {
              const b = buildings.find((x) => x.id === inc.buildingId);
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncidentId(inc.id);
                    navigate(`/incidents/${inc.id}`);
                  }}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {inc.id}
                      </span>
                      <SeverityBadge severity={inc.severity} size="sm" />
                      <StatusBadge status={inc.status} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{inc.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {b?.name || "Campus Ground"} — {inc.locationDetails}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(inc.reportedTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity & AI Engine Telemetry (1 col) */}
        <div className="space-y-6">
          {/* AI Status Card */}
          <div className="ai-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                EngineX AI Engine
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dual-mode emergency intelligence evaluates incident summaries, extracts threat factors, and matches response units with verified human oversight.
            </p>
            <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Model Provider:</span>
              <span className="font-semibold text-indigo-700">
                {aiStatus?.nlu_provider === "gemini" ? "Google Gemini 2.5 Flash" : "Deterministic Engine"}
              </span>
            </div>
          </div>

          {/* Severity Breakdown Pie Chart */}
          <div className="light-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Incident Severity Breakdown
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              {severityBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}:</span>
                  <span className="font-bold text-slate-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
