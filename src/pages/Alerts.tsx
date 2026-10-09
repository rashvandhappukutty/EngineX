import { useState } from "react";
import { useDemo } from "../store/demoState";
import type { Severity } from "../store/demoState";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Filter,
  Info,
} from "lucide-react";

export default function Alerts() {
  const { alerts, markAlertRead, markAllAlertsRead } = useDemo();

  const [tab, setTab] = useState<"unread" | "read" | "all">("unread");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredAlerts = alerts.filter((a) => {
    if (tab === "unread" && a.read) return false;
    if (tab === "read" && !a.read) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="text-red-600" size={20} />;
      case "high":
        return <ShieldAlert className="text-orange-500" size={20} />;
      case "medium":
        return <Activity className="text-amber-500" size={20} />;
      case "low":
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Bell className="text-slate-500" size={20} />;
    }
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Live Alerts
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time activity feed and system notifications.
          </p>
        </div>
        <button
          onClick={markAllAlertsRead}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
        >
          <CheckCircle2 size={18} /> Mark All Read
        </button>
      </div>

      <div className="bg-panel border border-border rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-slate-50">
          <div className="flex gap-2">
            {[
              {
                id: "unread",
                label: `Unread (${alerts.filter((a) => !a.read).length})`,
              },
              { id: "read", label: "Read" },
              { id: "all", label: "All Alerts" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === t.id
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Filter size={16} className="text-slate-400" />
            <select
              className="px-3 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
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

        {/* Alerts Feed */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`relative overflow-hidden flex items-start gap-4 p-4 border rounded-lg shadow-sm transition-all ${
                  alert.read
                    ? "bg-white border-slate-200 opacity-75"
                    : "bg-white border-primary ring-1 ring-primary/20"
                }`}
              >
                {!alert.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                )}

                <div
                  className={`mt-1 p-2 rounded-full ${alert.read ? "bg-slate-100" : "bg-blue-50"}`}
                >
                  {getSeverityIcon(alert.severity)}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                    <h3
                      className={`font-bold ${alert.read ? "text-slate-700" : "text-slate-900"}`}
                    >
                      {alert.title}
                    </h3>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(alert.time).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSeverityBadge(alert.severity)}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Source: {alert.source}
                    </span>
                    {alert.incidentId && (
                      <Link
                        to={`/incidents/${alert.incidentId}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View {alert.incidentId}
                      </Link>
                    )}
                  </div>
                </div>

                {!alert.read && (
                  <button
                    onClick={() => markAlertRead(alert.id)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Mark as Read"
                  >
                    <Check size={20} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bell size={48} className="text-slate-200 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">
                No alerts found
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                You're all caught up with the notifications feed.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 font-medium">
        SIMULATED DATA DEMO • NOT CONNECTED TO LIVE SMS OR PUSH NOTIFICATIONS
      </div>
    </div>
  );
}
