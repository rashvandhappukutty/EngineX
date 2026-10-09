import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "../store/demoState";
import { SeverityBadge, StatusBadge, AIProviderBadge } from "../components/common/Badge";
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  Users,
  Navigation,
  RefreshCw,
  Cpu,
  HelpCircle,
  CheckCircle2,
  Send,
  Building as BuildingIcon
} from "lucide-react";

export default function Recommendations() {
  const {
    incidents,
    buildings,
    refreshAIAnalysis,
    selectedIncidentId,
    setSelectedIncidentId,
    addAuditLog
  } = useDemo();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [naturalQuery, setNaturalQuery] = useState("");
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  );

  const currentIncident =
    incidents.find((i) => i.id === selectedIncidentId) ||
    activeIncidents[0] ||
    incidents[0];

  const currentBuilding = buildings.find((b) => b.id === currentIncident?.buildingId);

  const handleRefreshCurrent = async () => {
    if (!currentIncident) return;
    setIsRefreshing(true);
    try {
      await refreshAIAnalysis(currentIncident.id);
      addAuditLog({
        action: "ai_analysis_refreshed",
        details: `Re-ran AI situation assessment for incident ${currentIncident.id}`,
        incidentId: currentIncident.id
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setNaturalQuery(promptText);
    executePrompt(promptText);
  };

  const executePrompt = async (promptText: string) => {
    if (!promptText.trim() || !currentIncident) return;
    setIsQuerying(true);
    setQueryResponse(null);

    const loc = currentBuilding ? currentBuilding.name : currentIncident.locationDetails;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: currentIncident.id,
          prompt: promptText,
          context: {
            title: currentIncident.title,
            description: currentIncident.description,
            location: loc,
            severity: currentIncident.severity,
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQueryResponse(data.summary || data.explanation || JSON.stringify(data));
      } else {
        setQueryResponse(
          `Analysis for "${promptText}": For ${currentIncident.title} at ${loc}, ensure standard protocol tier for ${currentIncident.severity} severity is active. Coordinate with on-duty teams and verify containment boundaries.`
        );
      }
    } catch {
      setQueryResponse(
        `Analysis for "${promptText}": Context for ${currentIncident.id} (${currentIncident.title}) indicates ${currentIncident.severity} threat at ${loc}. Primary recommendation is to restrict access corridors and dispatch tier-1 personnel.`
      );
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ai-600 bg-ai-50 px-2.5 py-0.5 rounded-md border border-ai-200 flex items-center gap-1.5">
              <Sparkles size={12} className="text-ai-600" />
              EngineX AI Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">Cognitive Threat & Resource Evaluator</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Situation Analysis & Recommendations
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time multi-agent crisis evaluation synthesized from building telemetry, responder logs, and hazard boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshCurrent}
            disabled={isRefreshing || !currentIncident}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Evaluating Incident..." : "Re-evaluate Context"}</span>
          </button>
        </div>
      </div>

      {/* Safety Notice & Dual Engine Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-xs">
          <AlertCircle size={17} className="mt-0.5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-semibold text-amber-950">Deterministic Safety Floor Active:</strong>{" "}
            AI outputs are decision-support suggestions for incident commanders. In accordance with EngineX safety directives, critical life-safety decisions require manual operator confirmation.
          </div>
        </div>

        <div className="light-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-ai-50 text-ai-600 border border-ai-200">
              <Cpu size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Inference Engine</div>
              <div className="text-xs font-bold text-slate-900">
                Google Gemini 2.5 Flash / Safety Core
              </div>
            </div>
          </div>
          <AIProviderBadge provider="gemini" />
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incident Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Incident Context ({incidents.length})
            </h2>
            <span className="text-[11px] text-slate-500">{activeIncidents.length} Active</span>
          </div>

          <div className="space-y-2">
            {incidents.map((inc) => {
              const isSelected = inc.id === currentIncident?.id;
              const bld = buildings.find((b) => b.id === inc.buildingId);
              const loc = bld ? bld.name : inc.locationDetails;

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
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{inc.description}</p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <BuildingIcon size={12} className="text-slate-400" />
                      {loc}
                    </span>
                    <StatusBadge status={inc.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep AI Situation Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {currentIncident ? (
            <div className="space-y-6">
              {/* Natural Query Interactive Assistant */}
              <div className="ai-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-ai-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ai-900">
                      Contextual AI Query Bar
                    </h3>
                  </div>
                  <span className="text-[10px] text-ai-700 font-medium">Focused on {currentIncident.id}</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={naturalQuery}
                    onChange={(e) => setNaturalQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && executePrompt(naturalQuery)}
                    placeholder="Ask EngineX about affected zones, responder matches, or evacuation hazards..."
                    className="flex-1 bg-white border border-ai-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                  />
                  <button
                    onClick={() => executePrompt(naturalQuery)}
                    disabled={isQuerying || !naturalQuery.trim()}
                    className="px-4 py-2 bg-ai-600 hover:bg-ai-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                  >
                    {isQuerying ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Query</span>
                  </button>
                </div>

                {/* Prompt Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold self-center mr-1">Sample Queries:</span>
                  {[
                    "Analyze this incident.",
                    "Which areas may be affected?",
                    "Find available qualified responders.",
                    "Explain the recommended team assignment.",
                    "Find candidate routes avoiding confirmed hazards."
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleQuickPrompt(chip)}
                      className="px-2.5 py-1 rounded-md text-[11px] bg-white hover:bg-ai-50 text-slate-700 hover:text-ai-700 border border-ai-100 transition shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Query Result Box */}
                {queryResponse && (
                  <div className="p-3.5 bg-white rounded-lg border border-ai-200 text-xs text-slate-800 space-y-1.5 mt-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[10px] font-bold text-ai-700 uppercase">
                      <span>EngineX Response</span>
                      <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <p className="leading-relaxed">{queryResponse}</p>
                  </div>
                )}
              </div>

              {/* AI Situation Summary Card */}
              <div className="light-card p-6 space-y-5">
                <div className="flex flex-wrap justify-between items-center gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {currentIncident.id}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {currentIncident.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Location: {currentBuilding ? currentBuilding.name : currentIncident.locationDetails} • {new Date(currentIncident.reportedTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={currentIncident.severity} />
                    <StatusBadge status={currentIncident.status} />
                  </div>
                </div>

                {/* Situation Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-600" />
                    AI Incident Situation Summary
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    {currentIncident.aiAnalysis?.summary || currentIncident.description}
                  </div>
                </div>

                {/* Facts vs AI Inferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Verified Facts */}
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2.5">
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Verified Operational Facts
                    </h4>
                    <ul className="text-xs text-emerald-900 space-y-1.5 list-disc list-inside">
                      <li>Building: <span className="font-semibold">{currentBuilding?.name || currentIncident.locationDetails}</span></li>
                      <li>Reported Severity: <span className="font-semibold uppercase">{currentIncident.severity}</span></li>
                      <li>Current Status: <span className="font-semibold capitalize">{currentIncident.status}</span></li>
                      <li>Occupancy Level: <span className="font-semibold">{currentBuilding?.occupancy || 0}</span> occupants</li>
                    </ul>
                  </div>

                  {/* AI Inferences */}
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2.5">
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-indigo-600" />
                      AI Inferred Dynamics
                    </h4>
                    <ul className="text-xs text-indigo-900 space-y-1.5 list-disc list-inside">
                      <li>Category: <span className="font-semibold capitalize">{currentIncident.type}</span></li>
                      <li>Containment Corridor: <span className="font-semibold">Perimeter 50m Radius</span></li>
                      <li>Priority Level: <span className="font-semibold text-critical">Immediate Dispatch Tier-1</span></li>
                      <li>Recommended Safe Zone: <span className="font-semibold">Assembly Point 1 (West Field)</span></li>
                    </ul>
                  </div>
                </div>

                {/* Suggested Action Priorities */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Recommended Operator Next Actions
                  </h3>
                  <div className="space-y-2">
                    {[
                      "Seal HVAC dampers and ventilation ducts connected to hazard quadrant",
                      "Dispatch primary HazMat response squad with class-B containment gear",
                      "Broadcast automated audible evacuation siren to East and North wings",
                      "Establish 50-meter safety perimeter at Main Gate and North Courtyard"
                    ].map((action: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-800 font-medium">{action}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 bg-slate-100 px-2 py-0.5 rounded">
                          Advisory
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Information Checklist */}
                <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <HelpCircle size={15} className="text-amber-600" />
                    Missing Information Requiring Verification
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Exact chemical SDS identification, secondary sprinkler water pressure confirmation, and head-count tally from East Wing stairwell 2.
                  </p>
                </div>

                {/* Quick Workflow Navigation Buttons */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    to={`/dispatch?incident=${currentIncident.id}`}
                    className="p-3 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg text-brand-800 text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Users size={14} className="text-brand-600" />
                    <span>Assign Response Fleet</span>
                  </Link>

                  <Link
                    to={`/evacuation?building=${currentIncident.buildingId || ""}`}
                    className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Navigation size={14} className="text-slate-600" />
                    <span>Plan Evacuation Corridor</span>
                  </Link>

                  <Link
                    to={`/incidents/${currentIncident.id}`}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <ShieldAlert size={14} className="text-slate-600" />
                    <span>Full Incident Dossier</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="light-card p-12 text-center text-slate-500">
              <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Incident Selected</h3>
              <p className="text-xs text-slate-500 mt-1">Select an incident from the left queue to inspect AI threat analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
