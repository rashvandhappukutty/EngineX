import { useState } from "react";
import {
  useDemo,
  type Incident,
  type Responder,
  type DispatchStatus,
} from "../store/demoState";
import { MapPin, ShieldAlert, Truck, CheckCircle, Filter } from "lucide-react";

export default function Dispatch() {
  const { incidents, responders, updateIncident, updateResponder, addNote } =
    useDemo();

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );
  const [teamFilter, setTeamFilter] = useState("all");

  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status),
  );
  const selectedIncident = activeIncidents.find(
    (i) => i.id === selectedIncidentId,
  );

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
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            AVAILABLE
          </span>
        );
      case "assigned":
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            ASSIGNED
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
            DISPATCHED
          </span>
        );
      case "acknowledged":
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            ACKNOWLEDGED
          </span>
        );
      case "on_scene":
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
            ON SCENE
          </span>
        );
      case "unavailable":
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            UNAVAILABLE
          </span>
        );
      default:
        return null;
    }
  };

  const calculateSuitability = (responder: Responder, incident: Incident) => {
    if (responder.status !== "available")
      return { suitable: false, reason: "Team is not currently available." };

    let matchScore = 0;
    const isSpecializationMatch =
      incident.type === responder.specialization ||
      responder.specialization === "General" ||
      (incident.type === "Security Threat" &&
        responder.specialization === "Security");

    if (isSpecializationMatch) matchScore += 50;
    if (
      incident.severity === "critical" &&
      responder.skills.includes("Paramedic")
    )
      matchScore += 20;

    if (matchScore > 0) {
      return {
        suitable: true,
        reason:
          "Strong skill match for incident type. Team is available and ready to deploy.",
        score: matchScore,
      };
    }

    return {
      suitable: true,
      reason:
        "Team is available but may lack primary specialization for this incident.",
      score: 10,
    };
  };

  const handleAssign = (responderId: string) => {
    if (!selectedIncident) return;

    updateResponder(responderId, {
      status: "assigned",
      currentIncidentId: selectedIncident.id,
    });
    updateIncident(selectedIncident.id, {
      assignedTeamId: responderId,
      status: "assigned",
    });
    addNote(
      selectedIncident.id,
      `Assigned to ${responders.find((r) => r.id === responderId)?.name}`,
    );
    setSelectedIncidentId(null);
  };

  const handleUpdateStatus = (
    responderId: string,
    newStatus: DispatchStatus,
    incidentId?: string,
  ) => {
    updateResponder(responderId, { status: newStatus });
    if (incidentId) {
      addNote(
        incidentId,
        `Team status updated to: ${newStatus.replace("_", " ").toUpperCase()}`,
      );
      if (newStatus === "completed") {
        updateResponder(responderId, {
          currentIncidentId: undefined,
          status: "available",
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Response Dispatch
          </h1>
          <p className="text-slate-500 mt-1">
            Assign teams to active incidents and track deployment.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 h-[calc(100vh-12rem)] min-h-[500px]">
        {/* Left Panel: Active Incidents */}
        <div className="w-full lg:w-1/3 bg-panel border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Active Incidents</h2>
            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeIncidents.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {activeIncidents.length === 0 ? (
              <div className="text-center text-slate-500 italic py-8">
                No active incidents require dispatch.
              </div>
            ) : (
              activeIncidents.map((inc) => {
                const isSelected = selectedIncidentId === inc.id;
                const isAssigned = !!inc.assignedTeamId;

                return (
                  <div
                    key={inc.id}
                    onClick={() =>
                      setSelectedIncidentId(isSelected ? null : inc.id)
                    }
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary ring-1 ring-primary bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                        {inc.title}
                      </h3>
                      {isAssigned && (
                        <CheckCircle
                          size={16}
                          className="text-blue-500 flex-shrink-0"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span
                        className={`px-1.5 rounded font-semibold border ${
                          inc.severity === "critical"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : inc.severity === "high"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {inc.severity.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span>{inc.type}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin size={12} />
                      <span className="line-clamp-1">
                        {inc.locationDetails}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Responders & Assignment */}
        <div className="w-full lg:w-2/3 bg-panel border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedIncident ? (
            // Assignment View
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border bg-blue-50 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                    <ShieldAlert size={18} />
                    Assign Team for {selectedIncident.id}
                  </h2>
                  <p className="text-sm text-blue-800 mt-1">
                    {selectedIncident.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIncidentId(null)}
                  className="text-blue-700 hover:text-blue-900 text-sm font-medium underline"
                >
                  Cancel Assignment
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Eligible Responders
                </h3>

                {responders.map((responder) => {
                  const suitability = calculateSuitability(
                    responder,
                    selectedIncident,
                  );

                  return (
                    <div
                      key={responder.id}
                      className={`border rounded-lg p-4 bg-white shadow-sm ${suitability.suitable ? "border-blue-200" : "border-slate-200 opacity-70"}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-900">
                              {responder.name}
                            </h4>
                            {getStatusBadge(responder.status)}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{responder.specialization}</span>
                            <span>•</span>
                            <span>Base: {responder.baseLocation}</span>
                          </div>
                        </div>

                        {suitability.suitable ? (
                          <button
                            onClick={() => handleAssign(responder.id)}
                            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
                          >
                            Assign Team
                          </button>
                        ) : (
                          <div className="text-xs font-semibold text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded whitespace-nowrap">
                            Unavailable
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-3 rounded text-sm border border-slate-100">
                        <div className="font-semibold text-slate-700 mb-1">
                          Suitability Analysis
                        </div>
                        <p className="text-slate-600">{suitability.reason}</p>
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {responder.skills.map((s) => (
                            <span
                              key={s}
                              className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Directory View
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border bg-white flex justify-between items-center">
                <h2 className="font-semibold text-slate-800">
                  Responder Directory
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <Filter size={16} className="text-slate-400" />
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="border-none bg-transparent font-medium text-slate-700 focus:outline-none focus:ring-0"
                  >
                    <option value="all">All Teams</option>
                    <option value="available">Available Only</option>
                    <option value="active">Active Dispatch</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {filteredResponders.map((responder) => {
                  const activeIncident = incidents.find(
                    (i) => i.id === responder.currentIncidentId,
                  );

                  return (
                    <div
                      key={responder.id}
                      className="border border-slate-200 bg-white rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900">
                            {responder.name}
                          </h4>
                          {getStatusBadge(responder.status)}
                        </div>
                        <div className="text-sm text-slate-600 mb-2">
                          {responder.specialization} • Contact:{" "}
                          {responder.contactNumber}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {responder.skills.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="md:w-64 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                        {responder.currentIncidentId ? (
                          <>
                            <div className="text-xs font-semibold text-slate-500 uppercase">
                              Current Assignment
                            </div>
                            <div className="text-sm font-medium text-slate-900 line-clamp-1">
                              {activeIncident?.title ||
                                responder.currentIncidentId}
                            </div>

                            <select
                              value={responder.status}
                              onChange={(e) =>
                                handleUpdateStatus(
                                  responder.id,
                                  e.target.value as DispatchStatus,
                                  responder.currentIncidentId,
                                )
                              }
                              className="mt-1 block w-full text-sm border-slate-300 rounded focus:ring-primary focus:border-primary border p-1"
                            >
                              <option value="assigned">Assigned</option>
                              <option value="dispatched">Dispatched</option>
                              <option value="acknowledged">Acknowledged</option>
                              <option value="on_scene">On Scene</option>
                              <option value="completed">
                                Completed / Return
                              </option>
                            </select>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-2">
                            <Truck size={24} className="mb-1 opacity-50" />
                            <span className="text-xs font-medium">
                              Ready for dispatch
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
