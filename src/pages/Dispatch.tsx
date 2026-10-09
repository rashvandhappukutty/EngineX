import { useState } from "react";
import {
  useDemo,
  type Incident,
  type Responder,
  type DispatchStatus,
} from "../store/demoState";
import { SeverityBadge, StatusBadge } from "../components/common/Badge";
import {
  MapPin,
  Sparkles,
  Phone,
  Users,
  Send,
  CheckCircle2,
  XCircle,
  UserCheck
} from "lucide-react";

export default function Dispatch() {
  const {
    incidents,
    responders,
    buildings,
    updateResponder,
    selectedIncidentId,
    setSelectedIncidentId,
    addAuditLog,
  } = useDemo();

  const [teamFilter, setTeamFilter] = useState("all");

  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status),
  );

  const selectedIncident =
    incidents.find((i) => i.id === selectedIncidentId) ||
    activeIncidents[0] ||
    incidents[0];

  const selectedBuilding = buildings.find((b) => b.id === selectedIncident?.buildingId);

  const filteredResponders = responders.filter((r) => {
    if (teamFilter === "available") return r.status === "available";
    if (teamFilter === "active")
      return ["assigned", "dispatched", "acknowledged", "on_scene"].includes(
        r.status,
      );
    return true;
  });

  const getStatusBadge = (status: DispatchStatus) => {
    switch (status) {
      case "available":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            AVAILABLE
          </span>
        );
      case "assigned":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ASSIGNED
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            DISPATCHED
          </span>
        );
      case "acknowledged":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ACKNOWLEDGED
          </span>
        );
      case "on_scene":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
            ON SCENE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">
            OFFLINE
          </span>
        );
    }
  };

  const calculateSuitability = (responder: Responder, incident: Incident) => {
    if (responder.status !== "available" && responder.currentIncidentId !== incident.id)
      return {
        suitable: false,
        reason: "Unit currently engaged on another assignment.",
        score: 0,
      };

    let matchScore = 20;
    const reasons: string[] = ["Base Availability (+20)"];

    const category = incident.type.toLowerCase();
    const spec = responder.specialization.toLowerCase();

    if (
      (category.includes("fire") && spec.includes("fire")) ||
      (category.includes("medical") && spec.includes("medical")) ||
      (category.includes("security") && spec.includes("security")) ||
      (category.includes("hazmat") && spec.includes("hazmat"))
    ) {
      matchScore += 50;
      reasons.push("Direct Category Qualification Match (+50)");
    }

    if (
      incident.severity === "critical" &&
      responder.skills.some((s) => s.toLowerCase().includes("paramedic") || s.toLowerCase().includes("triage"))
    ) {
      matchScore += 25;
      reasons.push("Critical Life-Safety Certified (+25)");
    }

    if (responder.skills.includes("Incident Command")) {
      matchScore += 15;
      reasons.push("Command Leadership (+15)");
    }

    return {
      suitable: true,
      reason: reasons.join(" • "),
      score: Math.min(100, matchScore),
    };
  };

  const handleAssign = (responderId: string) => {
    if (!selectedIncident) return;
    updateResponder(responderId, {
      status: "assigned",
      currentIncidentId: selectedIncident.id,
    });
    addAuditLog({
      action: "responder_assigned",
      details: `Assigned responder ${responderId} to incident ${selectedIncident.id}`,
      incidentId: selectedIncident.id
    });
  };

  const handleDispatch = (responderId: string) => {
    updateResponder(responderId, { status: "dispatched" });
    if (selectedIncident) {
      addAuditLog({
        action: "responder_dispatched",
        details: `Dispatched unit ${responderId} to scene for incident ${selectedIncident.id}`,
        incidentId: selectedIncident.id
      });
    }
  };

  const handleSetOnScene = (responderId: string) => {
    updateResponder(responderId, { status: "on_scene" });
    if (selectedIncident) {
      addAuditLog({
        action: "responder_on_scene",
        details: `Unit ${responderId} confirmed on scene at ${selectedBuilding?.name || selectedIncident.locationDetails}`,
        incidentId: selectedIncident.id
      });
    }
  };

  const handleRelease = (responderId: string) => {
    updateResponder(responderId, {
      status: "available",
      currentIncidentId: undefined,
    });
    if (selectedIncident) {
      addAuditLog({
        action: "responder_released",
        details: `Released responder ${responderId} back to available pool`,
        incidentId: selectedIncident.id
      });
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1.5">
              <Users size={12} className="text-brand-600" />
              Response Fleet Management
            </span>
            <span className="text-xs text-slate-500 font-medium">Intelligent Unit Allocation Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Response Team Allocation & Dispatch
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Match emergency responders based on certification, incident category, proximity, and operational availability.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
          {["all", "available", "active"].map((f) => (
            <button
              key={f}
              onClick={() => setTeamFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition ${
                teamFilter === f
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f} ({responders.filter((r) => {
                if (f === "available") return r.status === "available";
                if (f === "active") return r.status !== "available";
                return true;
              }).length})
            </button>
          ))}
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Incident Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Incident Queue ({activeIncidents.length})
            </h2>
            <span className="text-[11px] text-slate-500">Select target incident</span>
          </div>

          <div className="space-y-2">
            {activeIncidents.length === 0 ? (
              <div className="light-card p-6 text-center text-slate-500">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-800">No active incidents</p>
                <p className="text-[11px] text-slate-500 mt-0.5">All units standing by.</p>
              </div>
            ) : (
              activeIncidents.map((inc) => {
                const isSelected = inc.id === selectedIncident?.id;
                const assignedCount = responders.filter((r) => r.currentIncidentId === inc.id).length;
                const bld = buildings.find((b) => b.id === inc.buildingId);

                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`light-card p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-brand-500 border-brand-200 bg-brand-50/20 shadow-xs"
                        : "hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {inc.id}
                      </span>
                      <SeverityBadge severity={inc.severity} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{inc.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{bld?.name || inc.locationDetails}</p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-600 font-medium">
                        Units Assigned: <strong className="text-brand-700">{assignedCount}</strong>
                      </span>
                      <StatusBadge status={inc.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Responder Roster & Matching Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Responder Fleet Roster ({filteredResponders.length})
            </h2>
            {selectedIncident && (
              <span className="text-xs text-brand-600 font-semibold">
                Matching against: {selectedIncident.id} ({selectedIncident.type})
              </span>
            )}
          </div>

          <div className="space-y-3">
            {filteredResponders.map((resp) => {
              const match = selectedIncident
                ? calculateSuitability(resp, selectedIncident)
                : { suitable: true, reason: "Available", score: 50 };

              const isAssignedToCurrent = resp.currentIncidentId === selectedIncident?.id;

              return (
                <div
                  key={resp.id}
                  className={`light-card p-4 transition-all ${
                    isAssignedToCurrent
                      ? "border-brand-300 bg-blue-50/20 shadow-xs"
                      : "hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{resp.name}</h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {resp.id}
                        </span>
                        {getStatusBadge(resp.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{resp.specialization}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {resp.baseLocation}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" />
                          {resp.contactNumber}
                        </span>
                      </div>
                    </div>

                    {/* Suitability Score Pill */}
                    {selectedIncident && (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Match Score</div>
                        <div className="text-base font-black text-brand-600 flex items-center gap-1 justify-end">
                          <Sparkles size={14} className="text-brand-500" />
                          <span>{match.score}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Match Rationale / Skills */}
                  <div className="pt-3 flex flex-wrap justify-between items-center gap-2">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex flex-wrap gap-1">
                        {resp.skills.map((sk) => (
                          <span
                            key={sk}
                            className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                      {selectedIncident && (
                        <p className="text-[11px] text-slate-500 italic mt-1">
                          {match.reason}
                        </p>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {resp.status === "available" && (
                        <button
                          onClick={() => handleAssign(resp.id)}
                          disabled={!selectedIncident}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <UserCheck size={13} />
                          <span>Assign Unit</span>
                        </button>
                      )}

                      {resp.status === "assigned" && (
                        <button
                          onClick={() => handleDispatch(resp.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
                        >
                          <Send size={13} />
                          <span>Dispatch to Scene</span>
                        </button>
                      )}

                      {resp.status === "dispatched" && (
                        <button
                          onClick={() => handleSetOnScene(resp.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          <span>Confirm On-Scene</span>
                        </button>
                      )}

                      {resp.status !== "available" && (
                        <button
                          onClick={() => handleRelease(resp.id)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
                        >
                          <XCircle size={13} className="text-slate-400" />
                          <span>Release</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
