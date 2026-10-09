import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "../store/demoState";
import {
  Search,
  ChevronRight,
  Filter,
  Plus,
} from "lucide-react";
import { SeverityBadge, StatusBadge } from "../components/common/Badge";

export default function Incidents() {
  const { incidents, buildings, setSelectedIncidentId } = useDemo();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.locationDetails
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      incident.type.toLowerCase().includes(searchTerm.toLowerCase());

    const isResolved = ["resolved", "closed"].includes(incident.status);
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && !isResolved) ||
      (activeTab === "resolved" && isResolved);

    const matchesSeverity =
      severityFilter === "all" || incident.severity === severityFilter;

    return matchesSearch && matchesTab && matchesSeverity;
  });

  const activeCount = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
              Crisis Triage
            </span>
            <span className="text-xs text-slate-500">Incident Management Queue</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Campus Incident Queue
          </h1>
        </div>

        <button
          onClick={() => navigate("/report-emergency")}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Report New Incident</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="light-card overflow-hidden">
        {/* Toolbar & Filter Tabs */}
        <div className="p-4 border-b border-[#E5EAF1] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: "all", label: `All (${incidents.length})` },
              { id: "active", label: `Active (${activeCount})` },
              {
                id: "resolved",
                label: `Resolved (${incidents.length - activeCount})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Severity Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, title, or room..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter size={14} className="text-slate-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-[#E5EAF1] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Incident ID</th>
                <th className="px-5 py-3">Title & Classification</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Reported Time</th>
                <th className="px-5 py-3 text-center">Severity</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF1]">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => {
                  const b = buildings.find((x) => x.id === incident.buildingId);
                  return (
                    <tr
                      key={incident.id}
                      onClick={() => {
                        setSelectedIncidentId(incident.id);
                        navigate(`/incidents/${incident.id}`);
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {incident.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{incident.title}</div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {incident.type}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <div className="font-medium">{b?.name || "Campus Ground"}</div>
                        <div className="text-[11px] text-slate-400">
                          {incident.locationDetails}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(incident.reportedTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <SeverityBadge severity={incident.severity} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentId(incident.id);
                            navigate(`/incidents/${incident.id}`);
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <span>Dossier</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs italic">
                    No incidents match the selected filtering criteria.
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
