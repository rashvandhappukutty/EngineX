import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDemo } from "../../store/demoState";
import type { IncidentStatus } from "../../store/demoState";
import { SeverityBadge, StatusBadge, ThreatScoreBadge } from "../../components/common/Badge";
import {
  ArrowLeft,
  ShieldAlert,
  MessageSquare,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Navigation,
  FileText,
  Send,
  Radio,
} from "lucide-react";

export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    incidents,
    buildings,
    responders,
    updateIncident,
    updateResponder,
    addNote,
    currentUser,
    refreshAIAnalysis,
    setSelectedIncidentId,
  } = useDemo();

  const incident = incidents.find((i) => i.id === id);
  const building = buildings.find((b) => b.id === incident?.buildingId);
  const assignedTeam = responders.find(
    (r) => r.id === incident?.assignedTeamId
  );

  const [noteText, setNoteText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Incident Record Not Found
        </h2>
        <p className="text-slate-500 text-xs max-w-sm mb-5">
          Incident <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{id}</code> does not exist in the current session.
        </p>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Return to Incident Queue</span>
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (newStatus === "resolved" || newStatus === "closed") {
      if (
        !window.confirm(
          `Are you sure you want to mark this incident as ${newStatus}?`
        )
      )
        return;
    }
    updateIncident(incident.id, { status: newStatus });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote(incident.id, `[${currentUser?.name || "Coordinator"}] ${noteText}`);
    setNoteText("");
  };

  const handleRefreshAI = async () => {
    setIsAnalyzing(true);
    try {
      await refreshAIAnalysis(incident.id);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAssignRecommendedTeam = (teamName: string) => {
    const matchedResponder = responders.find(
      (r) => r.name.toLowerCase() === teamName.toLowerCase()
    );
    if (matchedResponder) {
      updateIncident(incident.id, {
        assignedTeamId: matchedResponder.id,
        status: "assigned",
      });
      updateResponder(matchedResponder.id, {
        status: "assigned",
        currentIncidentId: incident.id,
      });
      addNote(
        incident.id,
        `[Coordinator Action] Deployed recommended unit '${matchedResponder.name}' via AI match protocol.`
      );
    } else {
      navigate("/dispatch");
    }
  };

  const ai = incident.aiAnalysis;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Dossier Header */}
      <div className="light-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              onClick={() => navigate("/incidents")}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="Back to queue"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                  {incident.id}
                </span>
                <SeverityBadge severity={incident.severity} size="sm" />
                <StatusBadge status={incident.status} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {incident.title}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="capitalize">{incident.type}</span>
                <span>•</span>
                <span>
                  Reported {new Date(incident.reportedTime).toLocaleDateString()} at{" "}
                  {new Date(incident.reportedTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefreshAI}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isAnalyzing ? "animate-spin" : ""} />
              <span>{isAnalyzing ? "Evaluating..." : "Re-evaluate with AI"}</span>
            </button>

            <select
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="reported">Status: Reported</option>
              <option value="assigned">Status: Assigned</option>
              <option value="acknowledged">Status: Acknowledged</option>
              <option value="in_progress">Status: In Progress</option>
              <option value="resolved">Status: Resolved</option>
              <option value="closed">Status: Closed</option>
            </select>

            <button
              onClick={() => {
                setSelectedIncidentId(incident.id);
                navigate("/dispatch");
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              <Radio size={13} />
              <span>Fleet Dispatch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): AI Intelligence + Incident Structured Data + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Intelligence Dossier */}
          <div className="ai-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    EngineX AI Incident Intelligence
                  </h2>
                  <p className="text-[10px] text-indigo-600 font-medium">
                    Provider: {ai?.uncertainty?.model_provider === "gemini" ? "Google Gemini 2.5 Flash" : "Deterministic Safety Engine"}
                  </p>
                </div>
              </div>

              {ai?.risk_assessment && (
                <ThreatScoreBadge score={ai.risk_assessment.risk_score} />
              )}
            </div>

            {ai?.requires_human_review && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-amber-800 text-xs">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <strong className="font-semibold">Coordinator Review Required:</strong>{" "}
                  Life-safety priority floor or elevated risk detected. Automated external dispatch is blocked until commander verification.
                </div>
              </div>
            )}

            {ai ? (
              <div className="space-y-3.5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Situation Assessment & Extracted Facts
                  </div>
                  <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-xs">
                    {ai.risk_assessment?.reasoning_summary || ai.summary || incident.description}
                  </div>
                </div>

                {ai.risk_assessment?.risk_factors && ai.risk_assessment.risk_factors.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Evaluated Risk Drivers
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ai.risk_assessment.risk_factors.map((factor, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] text-slate-700 font-medium"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Resource Match */}
                {ai.resource_recommendations && ai.resource_recommendations.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-0.5">
                        Matched Response Unit ({ai.resource_recommendations[0].match_score}% Confidence)
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {ai.resource_recommendations[0].team_name || ai.resource_recommendations[0].name}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {ai.resource_recommendations[0].rationale}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAssignRecommendedTeam(
                          ai.resource_recommendations[0].team_name ||
                            ai.resource_recommendations[0].name ||
                            ""
                        )
                      }
                      className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs whitespace-nowrap shrink-0 transition-colors"
                    >
                      Deploy Matched Unit
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs mb-2">No AI intelligence generated for this report yet.</p>
                <button
                  onClick={handleRefreshAI}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold"
                >
                  Run EngineX AI Evaluation
                </button>
              </div>
            )}
          </div>

          {/* Structured Telemetry Details */}
          <div className="light-card p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-[#E5EAF1] pb-2 flex items-center gap-1.5">
              <FileText size={15} className="text-blue-600" />
              Incident Dossier Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-500">
                  <MapPin size={15} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Location & Facility
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {building?.name || "Campus Ground"}
                  </div>
                  <div className="text-[11px] text-slate-500">{incident.locationDetails}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-500">
                  <Clock size={15} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Report Timestamp
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {new Date(incident.reportedTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(incident.reportedTime).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-500">
                  <Users size={15} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Reporter & Casualties
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {incident.reporterName}{" "}
                    {incident.reporterContact && `(${incident.reporterContact})`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Est. Affected: <span className="font-semibold text-slate-800">{incident.peopleAffected || "0"} persons</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-500">
                  <ShieldAlert size={15} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Assigned Response Unit
                  </div>
                  {assignedTeam ? (
                    <>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {assignedTeam.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {assignedTeam.specialization} ({assignedTeam.status})
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-amber-600 font-medium mt-0.5">
                      No response unit assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Situation Description
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>
          </div>

          {/* Internal Command Response Notes */}
          <div className="light-card flex flex-col">
            <div className="p-4 border-b border-[#E5EAF1] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <MessageSquare size={15} className="text-blue-600" />
                <span>Command Response Notes ({incident.notes.length})</span>
              </div>
            </div>

            <div className="p-4 max-h-56 overflow-y-auto space-y-2.5 bg-slate-50 custom-scrollbar">
              {incident.notes.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6 italic">
                  No coordinator response notes recorded yet.
                </div>
              ) : (
                incident.notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-xs"
                  >
                    {note}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#E5EAF1] bg-white flex gap-2 items-center">
              <input
                type="text"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                placeholder="Add internal command note or status update..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1"
              >
                <Send size={12} />
                <span>Log Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): AI Checklist & Evacuation Guidance & Timeline */}
        <div className="space-y-6">
          {/* AI Recommended Actions */}
          <div className="light-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5EAF1] pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={15} className="text-indigo-600" />
                <span>Action Checklist</span>
              </h3>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Recommended
              </span>
            </div>

            <ul className="space-y-2">
              {ai?.recommended_actions && ai.recommended_actions.length > 0 ? (
                ai.recommended_actions.map((act, idx) => {
                  const title = typeof act === "string" ? act : act.action;
                  const desc = typeof act === "object" ? act.description : null;
                  const priority = typeof act === "object" ? act.priority : null;
                  return (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-semibold text-slate-800">{title}</span>
                        {priority && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                            {priority}
                          </span>
                        )}
                      </div>
                      {desc && <p className="text-[11px] text-slate-500 mt-1">{desc}</p>}
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-slate-400 italic text-center py-3">
                  Follow standard emergency operating procedure.
                </li>
              )}
            </ul>
          </div>

          {/* AI Evacuation Guidance */}
          {ai?.evacuation_recommendation && (
            <div className="light-card p-4 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 pb-2 border-b border-[#E5EAF1] flex items-center gap-1.5">
                <Navigation size={15} className="text-blue-600" />
                <span>Evacuation Guidance</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {ai.evacuation_recommendation.status.replace(/_/g, " ")}
                  </span>
                </div>
                {ai.evacuation_recommendation.safe_zone && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Assembly Zone:</span>
                    <span className="font-bold text-emerald-700">
                      {ai.evacuation_recommendation.safe_zone}
                    </span>
                  </div>
                )}
                {ai.evacuation_recommendation.accessibility_verified !== undefined && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Accessibility:</span>
                    <span
                      className={`font-semibold ${
                        ai.evacuation_recommendation.accessibility_verified
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {ai.evacuation_recommendation.accessibility_verified
                        ? "Verified Accessible"
                        : "Verification Required"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="light-card p-4 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 pb-2 border-b border-[#E5EAF1]">
              Activity History
            </h3>
            <div className="relative border-l border-slate-200 ml-2 space-y-3.5">
              {incident.timeline.map((event) => (
                <div key={event.id} className="relative pl-4">
                  <span className="absolute -left-[4px] top-1.5 w-2 h-2 rounded-full bg-blue-600" />
                  <div className="text-[10px] font-mono text-slate-400">
                    {new Date(event.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-xs text-slate-700 font-medium leading-snug mt-0.5">
                    {event.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
