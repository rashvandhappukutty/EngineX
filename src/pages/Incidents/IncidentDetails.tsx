import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDemo } from "../../store/demoState";
import type { IncidentStatus, Severity } from "../../store/demoState";
import {
  ArrowLeft,
  ShieldAlert,
  MessageSquare,
  MapPin,
  Clock,
  Users,
  Activity,
  CheckCircle,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Navigation,
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
  } = useDemo();

  const incident = incidents.find((i) => i.id === id);
  const building = buildings.find((b) => b.id === incident?.buildingId);
  const assignedTeam = responders.find(
    (r) => r.id === incident?.assignedTeamId,
  );

  const [noteText, setNoteText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold mb-2">Incident Not Found</h2>
        <p className="text-slate-500 mb-4">
          The incident you are looking for does not exist or has been removed.
        </p>
        <Link to="/incidents" className="text-primary hover:underline">
          Back to Incidents
        </Link>
      </div>
    );
  }

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

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (newStatus === "resolved" || newStatus === "closed") {
      if (
        !window.confirm(
          `Are you sure you want to mark this incident as ${newStatus}?`,
        )
      )
        return;
    }
    updateIncident(incident.id, { status: newStatus });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote(incident.id, `[${currentUser?.name}] ${noteText}`);
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
      (r) => r.name.toLowerCase() === teamName.toLowerCase(),
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
        `[Coordinator Action] Assigned recommended team '${matchedResponder.name}' based on CampusOne AI match.`,
      );
    } else {
      navigate("/dispatch");
    }
  };

  const ai = incident.aiAnalysis;

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/incidents")}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-md shadow-sm transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {incident.title}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityColors(incident.severity)}`}
              >
                {incident.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {incident.id}
              </span>
              <span>•</span>
              <span>{incident.type}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAI}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3 py-2 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
            <span>{isAnalyzing ? "AI Analyzing..." : "Re-analyze with AI"}</span>
          </button>

          <select
            value={incident.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as IncidentStatus)
            }
            className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="reported">Reported</option>
            <option value="assigned">Assigned</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button
            onClick={() => navigate("/dispatch")}
            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
          >
            Dispatch Center
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & AI Intelligence */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Intelligence Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-lg border border-indigo-500/20 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-300">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    CampusOne AI Crisis Intelligence
                  </h2>
                  <p className="text-xs text-indigo-200">
                    Active Model: {ai?.uncertainty?.model_provider === "gemini" ? "Google Gemini NLU" : "CampusOne Deterministic Safety Engine"}
                  </p>
                </div>
              </div>

              {ai?.risk_assessment && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-indigo-300 uppercase font-semibold">
                      Risk Score
                    </div>
                    <div className="text-xl font-black text-white">
                      {ai.risk_assessment.risk_score}
                      <span className="text-xs text-indigo-300 font-normal">/100</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                      ai.risk_assessment.priority.toLowerCase() === "critical"
                        ? "bg-red-500/30 text-red-200 border border-red-400/40"
                        : ai.risk_assessment.priority.toLowerCase() === "high"
                          ? "bg-orange-500/30 text-orange-200 border border-orange-400/40"
                          : "bg-amber-500/30 text-amber-200 border border-amber-400/40"
                    }`}
                  >
                    {ai.risk_assessment.priority}
                  </span>
                </div>
              )}
            </div>

            {ai?.requires_human_review && (
              <div className="mb-4 bg-amber-500/20 border border-amber-400/40 rounded-lg p-3 flex items-start gap-2.5 text-amber-200 text-xs">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-300" />
                <div>
                  <strong className="text-white font-semibold">
                    Mandatory Coordinator Review Required:
                  </strong>{" "}
                  Life-safety priority floor or elevated risk detected. Automated external dispatch is blocked per safety policies until coordinator verification.
                </div>
              </div>
            )}

            {ai ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1">
                    AI Situation Assessment
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                    {ai.risk_assessment?.reasoning_summary || ai.summary || incident.description}
                  </p>
                </div>

                {ai.risk_assessment?.risk_factors && ai.risk_assessment.risk_factors.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5">
                      Evaluated Threat Factors
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ai.risk_assessment.risk_factors.map((factor, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-white/10 text-xs text-indigo-100 border border-white/10"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Resource Recommendation */}
                {ai.resource_recommendations && ai.resource_recommendations.length > 0 && (
                  <div className="bg-white/10 rounded-lg p-3.5 border border-white/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center justify-between">
                      <span>Matched Response Unit</span>
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        {ai.resource_recommendations[0].match_score}% Match Score
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {ai.resource_recommendations[0].team_name || ai.resource_recommendations[0].name}
                        </div>
                        <div className="text-xs text-slate-300">
                          {ai.resource_recommendations[0].rationale}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleAssignRecommendedTeam(
                            ai.resource_recommendations[0].team_name ||
                              ai.resource_recommendations[0].name ||
                              "",
                          )
                        }
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-md shadow transition-colors whitespace-nowrap shrink-0"
                      >
                        Deploy Unit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <p className="text-sm mb-3">No AI intelligence generated for this report yet.</p>
                <button
                  onClick={handleRefreshAI}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  Run CampusOne AI Analysis
                </button>
              </div>
            )}
          </div>

          {/* Standard Incident Details */}
          <div className="bg-panel border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold border-b border-border pb-3 mb-4">
              Incident Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Location
                  </div>
                  <div className="font-medium text-slate-900">
                    {building?.name || "Unknown Building"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {incident.locationDetails}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Reported
                  </div>
                  <div className="font-medium text-slate-900">
                    {new Date(incident.reportedTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(incident.reportedTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <Users size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Reporter & Impact
                  </div>
                  <div className="font-medium text-slate-900">
                    {incident.reporterName}{" "}
                    {incident.reporterContact &&
                      `(${incident.reporterContact})`}
                  </div>
                  <div className="text-sm text-slate-600">
                    Est. Affected: {incident.peopleAffected || "Unknown"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Team
                  </div>
                  {assignedTeam ? (
                    <>
                      <div className="font-medium text-slate-900">
                        {assignedTeam.name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {assignedTeam.specialization} ({assignedTeam.status})
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500 italic mt-1">
                      No team assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </div>
              <p className="text-slate-800 bg-slate-50 p-4 rounded-md border border-slate-100 whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-panel border border-border rounded-lg shadow-sm flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-2 font-semibold">
              <MessageSquare size={18} className="text-slate-500" />
              Internal Response Notes
            </div>
            <div className="p-4 flex-1 max-h-64 overflow-y-auto space-y-4 bg-slate-50">
              {incident.notes.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4 italic">
                  No notes added yet.
                </div>
              ) : (
                incident.notes.map((note, __idx) => (
                  <div
                    key={__idx}
                    className="bg-white p-3 rounded border border-slate-200 text-sm shadow-sm"
                  >
                    {note}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border bg-white flex gap-3 items-start">
              <textarea
                className="flex-1 border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                placeholder="Type internal coordinator note here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors whitespace-nowrap"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Action Checklist, Evacuation & Timeline */}
        <div className="space-y-6">
          {/* AI Recommended Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-600" />
                <span>AI Recommended Actions</span>
              </h3>
              <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">
                LIVE
              </span>
            </div>

            <ul className="space-y-2.5">
              {ai?.recommended_actions && ai.recommended_actions.length > 0 ? (
                ai.recommended_actions.map((act, idx) => {
                  const title = typeof act === "string" ? act : act.action;
                  const desc = typeof act === "object" ? act.description : null;
                  const priority = typeof act === "object" ? act.priority : null;
                  return (
                    <li
                      key={idx}
                      className="bg-white p-3 rounded-md border border-blue-100 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-blue-950">
                          {title}
                        </span>
                        {priority && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                            {priority}
                          </span>
                        )}
                      </div>
                      {desc && (
                        <p className="text-xs text-slate-600 mt-1 leading-normal">
                          {desc}
                        </p>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-blue-700 italic">
                  No automated actions specified. Follow standard operating protocols.
                </li>
              )}
            </ul>
          </div>

          {/* AI Evacuation Recommendation */}
          {ai?.evacuation_recommendation && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Navigation size={18} className="text-primary" />
                <span>Evacuation & Route Guidance</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="font-bold capitalize text-slate-900">
                    {ai.evacuation_recommendation.status.replace(/_/g, " ")}
                  </span>
                </div>
                {ai.evacuation_recommendation.safe_zone && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Assembly Point:</span>
                    <span className="font-bold text-emerald-700">
                      {ai.evacuation_recommendation.safe_zone}
                    </span>
                  </div>
                )}
                {ai.evacuation_recommendation.accessibility_verified !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Accessibility:</span>
                    <span
                      className={`font-bold ${
                        ai.evacuation_recommendation.accessibility_verified
                          ? "text-emerald-700"
                          : "text-amber-600"
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
          <div className="bg-panel border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Activity size={18} className="text-slate-500" />
                Activity Timeline
              </div>
            </div>
            <div className="p-5">
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {incident.timeline.map((event) => (
                  <div key={event.id} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></span>
                    <div className="text-xs text-slate-500 mb-1">
                      {new Date(event.time).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-800 font-medium leading-snug">
                      {event.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
