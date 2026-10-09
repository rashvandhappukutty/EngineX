import { useState, useMemo } from "react";
import { useDemo } from "../store/demoState";
import { StatCard } from "../components/common/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Filter,
  Download,
  TrendingUp,
  Activity,
  BarChart2,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function Analytics() {
  const { incidents, buildings } = useDemo();

  // Filters
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Derive filtered dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
      if (categoryFilter !== "all" && inc.category !== categoryFilter) return false;
      return true;
    });
  }, [incidents, severityFilter, categoryFilter]);

  // Derived Metrics
  const totalIncidents = filteredIncidents.length;
  const activeIncidents = filteredIncidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  ).length;
  const resolvedIncidents = filteredIncidents.filter((i) =>
    ["resolved", "closed"].includes(i.status)
  ).length;

  const resolutionRate =
    totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0;

  // Chart Data: Severity
  const severityMap: Record<string, number> = {};
  filteredIncidents.forEach((i) => {
    severityMap[i.severity] = (severityMap[i.severity] || 0) + 1;
  });
  const severityData = Object.keys(severityMap).map((k) => ({
    name: k.toUpperCase(),
    value: severityMap[k],
  }));

  const COLORS: Record<string, string> = {
    CRITICAL: "#DC2626",
    HIGH: "#F59E0B",
    MEDIUM: "#3978F6",
    LOW: "#10B981",
  };

  // Chart Data: Facility Distribution
  const facilityData = buildings.map((b) => ({
    name: b.code,
    fullName: b.name,
    incidents: incidents.filter((i) => i.buildingId === b.id).length,
    occupancy: b.currentOccupancy,
  }));

  // Export CSV
  const handleExportCSV = () => {
    const headers = "ID,Title,Severity,Category,Location,Status,ReportedAt\n";
    const rows = filteredIncidents
      .map(
        (i) =>
          `"${i.id}","${i.title}","${i.severity}","${i.category}","${i.location}","${i.status}","${i.reportedAt}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enginex-incident-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-brand-600" />
              Executive Analytics
            </span>
            <span className="text-xs text-slate-500 font-medium">Campus Safety Telemetry & KPI Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Safety Analytics & Crisis Reporting
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Synthesized operational performance metrics, facility incident densities, and crisis resolution velocity.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Download size={14} className="text-slate-600" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Incidents"
          value={totalIncidents}
          icon={Activity}
          accent="blue"
          subtitle="All reported crisis events"
        />
        <StatCard
          title="Active Emergencies"
          value={activeIncidents}
          icon={AlertTriangle}
          accent="red"
          subtitle="Currently requiring response"
        />
        <StatCard
          title="Resolved Cases"
          value={resolvedIncidents}
          icon={CheckCircle2}
          accent="green"
          subtitle="Successfully de-escalated"
        />
        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          icon={ShieldCheck}
          accent="indigo"
          subtitle="De-escalation performance"
        />
      </div>

      {/* Filter Row */}
      <div className="light-card p-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter size={14} className="text-slate-400" />
          <span>Filter Telemetry:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            <option value="fire">Fire & Smoke</option>
            <option value="medical">Medical Emergency</option>
            <option value="hazmat">Chemical / HazMat</option>
            <option value="security">Security Threat</option>
          </select>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incidents by Building */}
        <div className="light-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Incident Distribution by Facility</h2>
              <p className="text-xs text-slate-500">Number of logged emergencies per campus building</p>
            </div>
            <BarChart2 size={16} className="text-brand-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="incidents" fill="#3978F6" radius={[4, 4, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Severity Breakdown */}
        <div className="light-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Incident Severity Breakdown</h2>
              <p className="text-xs text-slate-500">Ratio of critical, high, medium, and low reports</p>
            </div>
            <PieIcon size={16} className="text-ai-600" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {severityData.length === 0 ? (
              <div className="text-xs text-slate-400">No incidents in selected range</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[entry.name] || "#3978F6"}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
