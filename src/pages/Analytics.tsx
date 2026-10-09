import { useState, useMemo } from "react";
import { useDemo } from "../store/demoState";
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
  LineChart,
  Line,
} from "recharts";
import { Filter, Download, Printer } from "lucide-react";

export default function Analytics() {
  const { incidents, buildings, resources } = useDemo();

  // Filters
  const [timeRange, setTimeRange] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Derive filtered dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter !== "all" && inc.severity !== severityFilter)
        return false;
      if (typeFilter !== "all" && inc.type !== typeFilter) return false;
      if (buildingFilter !== "all" && inc.buildingId !== buildingFilter)
        return false;

      const isResolved = ["resolved", "closed"].includes(inc.status);
      if (statusFilter === "active" && isResolved) return false;
      if (statusFilter === "resolved" && !isResolved) return false;

      const reportedTime = new Date(inc.reportedTime).getTime();
      const now = Date.now();

      if (timeRange === "24h" && now - reportedTime > 24 * 60 * 60 * 1000)
        return false;
      if (timeRange === "7d" && now - reportedTime > 7 * 24 * 60 * 60 * 1000)
        return false;
      if (timeRange === "30d" && now - reportedTime > 30 * 24 * 60 * 60 * 1000)
        return false;

      return true;
    });
  }, [
    incidents,
    timeRange,
    severityFilter,
    typeFilter,
    buildingFilter,
    statusFilter,
  ]);

  // Derived Metrics
  const totalIncidents = filteredIncidents.length;
  const activeIncidents = filteredIncidents.filter(
    (i) => !["resolved", "closed"].includes(i.status),
  ).length;
  const resolvedIncidents = filteredIncidents.filter((i) =>
    ["resolved", "closed"].includes(i.status),
  ).length;
  const unassignedIncidents = filteredIncidents.filter(
    (i) => !i.assignedTeamId && !["resolved", "closed"].includes(i.status),
  ).length;

  const resolutionRate =
    totalIncidents > 0
      ? Math.round((resolvedIncidents / totalIncidents) * 100)
      : 0;

  // Calculate Average Response Times based on timeline events
  const calculateAverageTimes = () => {
    let ackTimes: number[] = [];
    let resTimes: number[] = [];

    filteredIncidents.forEach((inc) => {
      const start = new Date(inc.reportedTime).getTime();

      // Ack Time
      const ackEvent = inc.timeline.find(
        (t) =>
          t.message.includes("acknowledged") || t.message.includes("assigned"),
      );
      if (ackEvent) {
        ackTimes.push(
          (new Date(ackEvent.time).getTime() - start) / (1000 * 60),
        ); // in minutes
      }

      // Resolution Time
      const resEvent = inc.timeline.find(
        (t) => t.message.includes("resolved") || t.message.includes("closed"),
      );
      if (resEvent) {
        resTimes.push(
          (new Date(resEvent.time).getTime() - start) / (1000 * 60),
        );
      }
    });

    const avgAck =
      ackTimes.length > 0
        ? (ackTimes.reduce((a, b) => a + b, 0) / ackTimes.length).toFixed(1)
        : "N/A";
    const avgRes =
      resTimes.length > 0
        ? (resTimes.reduce((a, b) => a + b, 0) / resTimes.length).toFixed(1)
        : "N/A";

    return { avgAck, avgRes };
  };

  const { avgAck, avgRes } = calculateAverageTimes();

  // Resource Utilization
  const totalResourceCapacity = resources.reduce(
    (acc, r) => acc + r.totalQuantity,
    0,
  );
  const usedResourceCapacity = resources.reduce(
    (acc, r) => acc + r.assignedQuantity + r.maintenanceQuantity,
    0,
  );
  const resourceUtilization =
    totalResourceCapacity > 0
      ? Math.round((usedResourceCapacity / totalResourceCapacity) * 100)
      : 0;

  // Chart Data Preparation

  // 1. Incidents by Type
  const typeMap: Record<string, number> = {};
  filteredIncidents.forEach((i) => {
    typeMap[i.type] = (typeMap[i.type] || 0) + 1;
  });

  // 2. Incidents by Severity
  const severityMap: Record<string, number> = {};
  filteredIncidents.forEach((i) => {
    severityMap[i.severity] = (severityMap[i.severity] || 0) + 1;
  });
  const severityData = Object.keys(severityMap).map((k) => ({
    name: k.toUpperCase(),
    value: severityMap[k],
  }));

  const COLORS = {
    CRITICAL: "#EF4444", // red
    HIGH: "#F97316", // orange
    MEDIUM: "#F59E0B", // amber
    LOW: "#3B82F6", // blue
  };

  // 3. Incidents by Building
  const buildingMap: Record<string, number> = {};
  filteredIncidents.forEach((i) => {
    if (i.buildingId) {
      const b = buildings.find((b) => b.id === i.buildingId);
      const bName = b ? b.name : "Unknown";
      buildingMap[bName] = (buildingMap[bName] || 0) + 1;
    }
  });
  const buildingData = Object.keys(buildingMap)
    .map((k) => ({ name: k, count: buildingMap[k] }))
    .sort((a, b) => b.count - a.count);

  // 4. Status Distribution
  const statusMap: Record<string, number> = {};
  filteredIncidents.forEach((i) => {
    statusMap[i.status] = (statusMap[i.status] || 0) + 1;
  });
  const statusData = Object.keys(statusMap).map((k) => ({
    name: k.toUpperCase(),
    value: statusMap[k],
  }));

  // 5. Over time mock (simple day grouping)
  const timeMap: Record<string, number> = {};
  filteredIncidents.forEach((i) => {
    const date = new Date(i.reportedTime).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    timeMap[date] = (timeMap[date] || 0) + 1;
  });
  const timeData = Object.keys(timeMap).map((k) => ({
    date: k,
    incidents: timeMap[k],
  }));

  // CSV Export
  const exportCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Type",
      "Severity",
      "Status",
      "Reported Time",
      "Building",
    ];
    const rows = filteredIncidents.map((i) => [
      i.id,
      `"${i.title}"`,
      i.type,
      i.severity,
      i.status,
      i.reportedTime,
      `"${buildings.find((b) => b.id === i.buildingId)?.name || "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "enginex_incident_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 font-bold border border-red-200">
            CRITICAL
          </span>
        );
      case "high":
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700 font-bold border border-orange-200">
            HIGH
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 font-bold border border-amber-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Analytics & Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Operational metrics and historical incident data.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white border border-slate-800 px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
          >
            <Printer size={18} /> Print Report
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-panel border border-border rounded-lg shadow-sm p-4 flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Filter size={16} /> Filters:
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="all">All Time</option>
          <option value="30d">Last 30 Days</option>
          <option value="7d">Last 7 Days</option>
          <option value="24h">Last 24 Hours</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="all">All Types</option>
          <option value="Fire">Fire</option>
          <option value="Medical Emergency">Medical</option>
          <option value="Security Threat">Security</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active/Unresolved</option>
          <option value="resolved">Resolved/Closed</option>
        </select>
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="all">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-panel border border-border rounded-lg shadow-sm p-3 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Total Incidents
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1">
            {totalIncidents}
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-3 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Active
          </span>
          <span className="text-2xl font-bold text-red-600 mt-1">
            {activeIncidents}
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-3 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Resolution Rate
          </span>
          <span className="text-2xl font-bold text-green-600 mt-1">
            {resolutionRate}%
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-3 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Unassigned
          </span>
          <span className="text-2xl font-bold text-orange-600 mt-1">
            {unassignedIncidents}
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-3 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Avg Ack Time
          </span>
          <span className="text-2xl font-bold text-slate-700 mt-1">
            {avgAck}
            <span className="text-xs font-normal ml-1 text-slate-400">m</span>
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-3 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Avg Res Time
          </span>
          <span className="text-2xl font-bold text-slate-700 mt-1">
            {avgRes}
            <span className="text-xs font-normal ml-1 text-slate-400">m</span>
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-3 flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Resource Util
          </span>
          <span className="text-2xl font-bold text-blue-600 mt-1">
            {resourceUtilization}%
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:block print:space-y-6">
        {/* Severity Distribution */}
        <div className="bg-panel border border-border rounded-lg shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">
            Incidents by Severity
          </h3>
          <div className="h-48 w-full">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
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
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">
                No data
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-panel border border-border rounded-lg shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">
            Incidents by Status
          </h3>
          <div className="h-48 w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                  >
                    {statusData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ["#3B82F6", "#10B981", "#F59E0B", "#64748B"][
                            index % 4
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">
                No data
              </div>
            )}
          </div>
        </div>

        {/* Incidents Over Time */}
        <div className="bg-panel border border-border rounded-lg shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Incident Volume</h3>
          <div className="h-48 w-full">
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="incidents"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">
                No data
              </div>
            )}
          </div>
        </div>

        {/* Building Distribution */}
        <div className="bg-panel border border-border rounded-lg shadow-sm p-5 md:col-span-3">
          <h3 className="font-semibold text-slate-800 mb-4">
            Incidents by Location
          </h3>
          <div className="h-48 w-full">
            {buildingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={buildingData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-15}
                    textAnchor="end"
                    height={40}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip cursor={{ fill: "#F1F5F9" }} />
                  <Bar
                    dataKey="count"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">
                No data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Reports Table */}
      <div className="bg-panel border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50">
          <h2 className="font-semibold text-slate-800">
            Incident History Report
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold">Incident ID</th>
                <th className="px-6 py-3 font-semibold">Type & Severity</th>
                <th className="px-6 py-3 font-semibold">Location</th>
                <th className="px-6 py-3 font-semibold">Reported</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-900">
                      {inc.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {inc.type}
                      </div>
                      <div className="mt-1">
                        {getSeverityBadge(inc.severity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {buildings.find((b) => b.id === inc.buildingId)?.name ||
                        "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {new Date(inc.reportedTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                          ["resolved", "closed"].includes(inc.status)
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}
                      >
                        {inc.status.toUpperCase().replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/incidents/${inc.id}`}
                        className="text-primary hover:underline font-semibold text-xs"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500 italic"
                  >
                    No incidents match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-border text-[10px] text-slate-400 text-center uppercase tracking-widest">
          SIMULATED ANALYTICS DEMO • NOT ACTUAL OPERATIONAL DATA
        </div>
      </div>
    </div>
  );
}
