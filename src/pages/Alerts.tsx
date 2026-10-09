import { useState } from "react";
import { useDemo } from "../store/demoState";
import type { Severity } from "../store/demoState";
import { Link } from "react-router-dom";
import { SeverityBadge } from "../components/common/Badge";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Filter,
  Info,
  ExternalLink,
  Clock,
  Radio,
  History,
} from "lucide-react";

export default function Alerts() {
  const { alerts, markAlertRead, markAllAlertsRead, auditLogs } = useDemo();

  const [tab, setTab] = useState<"alerts" | "audit">("alerts");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    if (unreadOnly && a.read) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="text-critical" size={17} />;
      case "high":
        return <ShieldAlert className="text-amber-500" size={17} />;
      case "medium":
        return <Activity className="text-brand-500" size={17} />;
      default:
        return <Info className="text-slate-400" size={17} />;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1.5">
              <Radio size={12} className="text-brand-600" />
              Operational Stream
            </span>
            <span className="text-xs text-slate-500 font-medium">Campus Notification & Incident Timeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Activity Timeline & Broadcast Alerts
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time feed of mass notifications, operator verifications, AI assessments, and resource dispatch logs.
          </p>
        </div>

        {tab === "alerts" && (
          <button
            onClick={markAllAlertsRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
          >
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Acknowledge All</span>
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab("alerts")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
            tab === "alerts"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Bell size={14} />
          <span>Broadcast Alerts ({alerts.filter((a) => !a.read).length} unread)</span>
        </button>

        <button
          onClick={() => setTab("audit")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
            tab === "audit"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <History size={14} />
          <span>Operational Audit Trail ({auditLogs.length} events)</span>
        </button>
      </div>

      {/* Tab 1: Broadcast Alerts */}
      {tab === "alerts" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="light-card p-3 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  unreadOnly
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {unreadOnly ? "Showing Unacknowledged" : "Show All Alerts"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
              </select>
            </div>
          </div>

          {/* Alerts Feed */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="light-card p-12 text-center text-slate-400">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">All Alerts Acknowledged</h3>
                <p className="text-xs text-slate-500 mt-1">No outstanding broadcast alerts match your filter.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`light-card p-4 transition-all flex items-start justify-between gap-4 ${
                    !alert.read ? "border-l-4 border-l-brand-600 bg-brand-50/15" : "opacity-85"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                      {getSeverityIcon(alert.severity)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{alert.title}</span>
                        <SeverityBadge severity={alert.severity} />
                        {!alert.read && (
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.2 rounded">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{alert.message || alert.title}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          {new Date(alert.timestamp || alert.time || Date.now()).toLocaleTimeString()}
                        </span>
                        {alert.incidentId && (
                          <Link
                            to={`/incidents/${alert.incidentId}`}
                            className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>Incident {alert.incidentId}</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!alert.read && (
                    <button
                      onClick={() => markAlertRead(alert.id)}
                      className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition shadow-2xs"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Chronological Operational Audit Trail */}
      {tab === "audit" && (
        <div className="light-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Incident Command Event Log</h2>
              <p className="text-xs text-slate-500">Immutable ledger of state transitions, AI inferences, and resource deployments.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-700">
              {auditLogs.length} Logged Entries
            </span>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 py-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline Node Icon */}
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-brand-500 group-hover:scale-110 transition" />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 capitalize">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.incidentId && (
                      <Link
                        to={`/incidents/${log.incidentId}`}
                        className="text-[10px] font-mono font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.2 rounded hover:underline"
                      >
                        {log.incidentId}
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
