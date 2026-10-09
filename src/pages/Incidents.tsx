import { useState } from "react";
import {
  useDemo,
  type IncidentStatus,
  type Severity,
} from "../store/demoState";
import { Link } from "react-router-dom";
import { Search, AlertCircle, MapPin, Clock, ChevronRight } from "lucide-react";

export default function Incidents() {
  const { incidents, buildings } = useDemo();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (activeTab === "new") matchesTab = incident.status === "reported";
    if (activeTab === "acknowledged")
      matchesTab = incident.status === "acknowledged";
    if (activeTab === "in_progress")
      matchesTab = incident.status === "in_progress";
    if (activeTab === "resolved")
      matchesTab = ["resolved", "closed"].includes(incident.status);

    const matchesSeverity =
      severityFilter === "all" || incident.severity === severityFilter;

    return matchesSearch && matchesTab && matchesSeverity;
  });

  const getSeverityColors = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    return status
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Incidents
          </h1>
          <p className="text-slate-500 mt-1">
            Manage and track all campus emergency incidents.
          </p>
        </div>
        <Link
          to="/report-emergency"
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
        >
          Report Emergency
        </Link>
      </div>

      <div className="bg-panel border border-border rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-slate-50">
          <div className="flex gap-2">
            {["all", "new", "acknowledged", "in_progress", "resolved"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tab === "all"
                    ? "All Incidents"
                    : tab
                        .replace("_", " ")
                        .replace(/\\b\\w/g, (l) => l.toUpperCase())}
                </button>
              ),
            )}
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search ID or Title..."
                className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-border z-10">
              <tr>
                <th className="px-6 py-3 font-semibold">Incident</th>
                <th className="px-6 py-3 font-semibold">Severity & Status</th>
                <th className="px-6 py-3 font-semibold">Location</th>
                <th className="px-6 py-3 font-semibold">Reported</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => {
                  const building = buildings.find(
                    (b) => b.id === incident.buildingId,
                  );
                  return (
                    <tr
                      key={incident.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {incident.title}
                        </div>
                        <div className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                          <span className="font-mono">{incident.id}</span>
                          <span>•</span>
                          <span>{incident.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColors(incident.severity)}`}
                          >
                            {incident.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            {getStatusLabel(incident.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-slate-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-slate-800">
                              {building?.name || "Unknown Location"}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {incident.locationDetails}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={14} className="text-slate-400" />
                          <span>
                            {new Date(incident.reportedTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(incident.reportedTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/incidents/${incident.id}`}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <ChevronRight size={20} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={40} className="text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-900">
                        No incidents found
                      </p>
                      <p className="text-sm">
                        Try adjusting your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
