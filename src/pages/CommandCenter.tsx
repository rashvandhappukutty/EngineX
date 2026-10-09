import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "../store/demoState";
import {
  Users,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MapPin,
  AlertTriangle,
  Route,
  Send,
  ZoomIn,
  ZoomOut,
  Maximize,
  ShieldAlert,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { SeverityBadge, StatusBadge, ThreatScoreBadge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";

export default function CommandCenter() {
  const {
    incidents,
    buildings,
    responders,
    resources,
    assemblyPoints,
    selectedIncidentId,
    setSelectedIncidentId,
    refreshAIAnalysis,
    updateIncident,
    updateResponder,
    addNote,
  } = useDemo();

  const navigate = useNavigate();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showZones, setShowZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Derived metrics
  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  );
  const criticalIncidents = activeIncidents.filter(
    (i) => i.severity === "critical"
  );
  const availableResponders = responders.filter(
    (r) => r.status === "available"
  );
  const lowResources = resources.filter(
    (r) => r.availableQuantity / r.totalQuantity < 0.25
  );

  // Selected incident object
  const selectedIncident =
    incidents.find((i) => i.id === selectedIncidentId) ||
    activeIncidents[0] ||
    incidents[0];

  const selectedBuilding = buildings.find(
    (b) => b.id === selectedIncident?.buildingId
  );

  const ai = selectedIncident?.aiAnalysis;

  const handleRefreshAI = async () => {
    if (!selectedIncident) return;
    setIsAnalyzing(true);
    try {
      await refreshAIAnalysis(selectedIncident.id);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAsk = (promptText?: string) => {
    const q = promptText || aiQuestion;
    if (!q.trim() || !selectedIncident) return;

    if (q.toLowerCase().includes("medic") || q.toLowerCase().includes("responder")) {
      setAiResponse(
        `Available Units: Medical Team Alpha (Paramedic, EMT) stationed at Health Center. Proximity: ~120m.`
      );
    } else if (q.toLowerCase().includes("route") || q.toLowerCase().includes("evacuat")) {
      setAiResponse(
        `Safe Path: Egress via North Wing Exit avoiding central corridor, assemble at Assembly Point 1 (AP-1).`
      );
    } else if (q.toLowerCase().includes("risk") || q.toLowerCase().includes("threat")) {
      setAiResponse(
        `Threat Level: ${selectedIncident.severity.toUpperCase()} (${ai?.risk_assessment?.risk_score || 85}/100). Mandatory human verification enforced.`
      );
    } else {
      setAiResponse(
        `EngineX AI Assessment for ${selectedIncident.id}: ${ai?.summary || selectedIncident.description}. Recommended immediate dispatch and evacuation corridor isolation.`
      );
    }
    setAiQuestion("");
  };

  const handleAssignRecommendedTeam = (teamName: string) => {
    if (!selectedIncident) return;
    const matched = responders.find(
      (r) => r.name.toLowerCase() === teamName.toLowerCase()
    );
    if (matched) {
      updateIncident(selectedIncident.id, {
        assignedTeamId: matched.id,
        status: "assigned",
      });
      updateResponder(matched.id, {
        status: "assigned",
        currentIncidentId: selectedIncident.id,
      });
      addNote(
        selectedIncident.id,
        `[Command Action] Assigned response unit '${matched.name}' via AI recommendation match.`
      );
    } else {
      navigate("/dispatch");
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* 1. Header Overview & KPI Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Active Incidents"
          value={activeIncidents.length}
          subtitle="Real-time campus calls"
          icon={AlertTriangle}
          variant="blue"
          onClick={() => navigate("/incidents")}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalIncidents.length}
          subtitle="Life-safety priority"
          icon={Flame}
          variant="red"
          onClick={() => navigate("/incidents?filter=critical")}
        />
        <StatCard
          title="Available Responders"
          value={`${availableResponders.length}/${responders.length}`}
          subtitle="Units on standby"
          icon={Users}
          variant="green"
          onClick={() => navigate("/dispatch")}
        />
        <StatCard
          title="Resources Low"
          value={lowResources.length}
          subtitle="Supplies < 25% stock"
          icon={ShieldAlert}
          variant="orange"
          onClick={() => navigate("/resources")}
        />
        <StatCard
          title="Safe Corridors"
          value={assemblyPoints.length}
          subtitle="Verified assembly points"
          icon={Route}
          variant="purple"
          onClick={() => navigate("/evacuation")}
        />
      </div>

      {/* 2. Main Central Workspace: Interactive Campus Map (Left 60%) + AI Intelligence Panel (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (7 cols): Interactive Light Campus Schematic Map */}
        <div className="lg:col-span-7 light-card flex flex-col overflow-hidden min-h-[520px]">
          {/* Map Header Controls */}
          <div className="p-3.5 sm:px-4 border-b border-[#E5EAF1] bg-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Live Campus Spatial Operations
              </h2>
            </div>

            {/* Layer Toggles & Zoom */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-md text-xs font-medium border border-slate-200">
                <button
                  onClick={() => setShowZones(!showZones)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    showZones
                      ? "bg-white text-emerald-700 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Staff Zones
                </button>
                <button
                  onClick={() => setShowRoutes(!showRoutes)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    showRoutes
                      ? "bg-white text-blue-700 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Evacuation Paths
                </button>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
                  title="Reset view"
                >
                  <Maximize size={14} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="flex-1 relative overflow-hidden bg-slate-50 flex items-center justify-center pattern-grid p-4">
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] select-none overflow-visible">
                {/* Staff Duty Zones (Translucent Green Polygons) */}
                {showZones && (
                  <>
                    <polygon
                      points="10,10 40,10 40,45 10,45"
                      fill="#10B981"
                      fillOpacity="0.08"
                      stroke="#10B981"
                      strokeWidth="0.4"
                      strokeDasharray="1,1"
                    />
                    <text x="12" y="14" fontSize="1.6" fill="#059669" fontWeight="bold">
                      Zone North (Security Patrol)
                    </text>

                    <polygon
                      points="55,55 95,55 95,95 55,95"
                      fill="#10B981"
                      fillOpacity="0.08"
                      stroke="#10B981"
                      strokeWidth="0.4"
                      strokeDasharray="1,1"
                    />
                    <text x="58" y="59" fontSize="1.6" fill="#059669" fontWeight="bold">
                      Zone South (Medical / Staging)
                    </text>
                  </>
                )}

                {/* Campus Roads & Arterials */}
                <path
                  d="M 0 55 C 40 55, 60 45, 100 45"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.5"
                />
                <path
                  d="M 45 0 L 45 100"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.5"
                />

                {/* Evacuation Route Lines */}
                {showRoutes && (
                  <>
                    <path
                      d="M 25 30 L 45 50 L 20 85"
                      fill="none"
                      stroke="#3978F6"
                      strokeWidth="1.6"
                      strokeDasharray="2,1"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 75 35 L 45 50 L 85 80"
                      fill="none"
                      stroke="#3978F6"
                      strokeWidth="1.2"
                      strokeDasharray="1.5,1.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Assembly Points */}
                {assemblyPoints.map((ap) => (
                  <g key={ap.id}>
                    <circle
                      cx={ap.coordinates.x}
                      cy={ap.coordinates.y}
                      r="3.5"
                      fill="#ECFDF5"
                      stroke="#10B981"
                      strokeWidth="0.8"
                    />
                    <text
                      x={ap.coordinates.x}
                      y={ap.coordinates.y + 0.6}
                      fontSize="1.5"
                      textAnchor="middle"
                      fill="#047857"
                      fontWeight="bold"
                    >
                      {ap.name.replace("Assembly Point ", "AP-")}
                    </text>
                  </g>
                ))}

                {/* Buildings */}
                {buildings.map((b) => {
                  const isSelected = selectedBuilding?.id === b.id;
                  const hasIncident = activeIncidents.some(
                    (i) => i.buildingId === b.id
                  );
                  const isCritical = activeIncidents.some(
                    (i) => i.buildingId === b.id && i.severity === "critical"
                  );

                  return (
                    <g
                      key={b.id}
                      className="cursor-pointer group"
                      onClick={() => {
                        const incInB = activeIncidents.find((i) => i.buildingId === b.id);
                        if (incInB) setSelectedIncidentId(incInB.id);
                      }}
                    >
                      {/* Building Footprint */}
                      <rect
                        x={b.coordinates.x - b.width / 2}
                        y={b.coordinates.y - b.height / 2}
                        width={b.width}
                        height={b.height}
                        rx="1.5"
                        fill={
                          isCritical
                            ? "#FEF2F2"
                            : hasIncident
                            ? "#FFF7ED"
                            : isSelected
                            ? "#EFF6FF"
                            : "#FFFFFF"
                        }
                        stroke={
                          isCritical
                            ? "#DC2626"
                            : hasIncident
                            ? "#F97316"
                            : isSelected
                            ? "#3978F6"
                            : "#CBD5E1"
                        }
                        strokeWidth={isSelected ? "1.4" : "0.8"}
                        className="transition-all"
                      />

                      {/* Building Name */}
                      <text
                        x={b.coordinates.x}
                        y={b.coordinates.y - 0.2}
                        fontSize="1.9"
                        textAnchor="middle"
                        fill={isSelected ? "#1D4ED8" : "#334155"}
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {b.name}
                      </text>

                      {/* Occupancy Indicator */}
                      <text
                        x={b.coordinates.x}
                        y={b.coordinates.y + 2.2}
                        fontSize="1.2"
                        textAnchor="middle"
                        fill="#64748B"
                        className="pointer-events-none"
                      >
                        {b.occupancy} occ
                      </text>

                      {/* Hazard Beacon */}
                      {hasIncident && (
                        <g
                          transform={`translate(${b.coordinates.x + b.width / 2 - 1.2}, ${
                            b.coordinates.y - b.height / 2 + 1.2
                          })`}
                        >
                          <circle
                            cx="0"
                            cy="0"
                            r="1.8"
                            fill={isCritical ? "#DC2626" : "#F97316"}
                            className="animate-ping opacity-40"
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r="1.4"
                            fill={isCritical ? "#DC2626" : "#F97316"}
                            stroke="#FFFFFF"
                            strokeWidth="0.4"
                          />
                          <text
                            x="0"
                            y="0.4"
                            fontSize="1.2"
                            textAnchor="middle"
                            fill="white"
                            fontWeight="bold"
                          >
                            !
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 shadow-sm text-[11px] space-y-1">
              <div className="font-semibold text-slate-800 text-[10px] uppercase tracking-wider mb-1">
                Map Legend
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-red-600" />
                  <span className="text-slate-600">Critical Hazard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                  <span className="text-slate-600">Selected Facility</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 bg-emerald-100" />
                  <span className="text-slate-600">Assembly Safe Zone</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Contextual AI Intelligence & Decision Support Panel */}
        <div className="lg:col-span-5 ai-card flex flex-col overflow-hidden">
          {/* AI Header */}
          <div className="p-4 border-b border-indigo-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Sparkles size={15} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  EngineX AI Situation Analysis
                </h3>
                <p className="text-[10px] text-indigo-600 font-medium">
                  {ai?.uncertainty?.model_provider === "gemini"
                    ? "Verified Google Gemini 2.5 Flash"
                    : "Deterministic Safety Floor Engine"}
                </p>
              </div>
            </div>

            {selectedIncident && (
              <button
                onClick={handleRefreshAI}
                disabled={isAnalyzing}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} />
                <span>{isAnalyzing ? "Analyzing..." : "Re-evaluate"}</span>
              </button>
            )}
          </div>

          {/* AI Content Area */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            {selectedIncident ? (
              <>
                {/* Active Incident Context Ribbon */}
                <div className="flex items-start justify-between gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {selectedIncident.id}
                      </span>
                      <SeverityBadge severity={selectedIncident.severity} size="sm" />
                      <StatusBadge status={selectedIncident.status} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {selectedIncident.title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-slate-400" />
                      {selectedBuilding?.name || "Campus Ground"} — {selectedIncident.locationDetails}
                    </p>
                  </div>

                  {ai?.risk_assessment && (
                    <ThreatScoreBadge score={ai.risk_assessment.risk_score} />
                  )}
                </div>

                {/* AI Situation Summary */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Operational Situation Assessment
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-xs">
                    {ai?.risk_assessment?.reasoning_summary ||
                      ai?.summary ||
                      selectedIncident.description}
                  </div>
                </div>

                {/* Recommended Response Unit Matching */}
                {ai?.resource_recommendations && ai.resource_recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Recommended Response Fleet Match</span>
                      <span className="text-[10px] text-indigo-700 font-semibold">
                        {ai.resource_recommendations[0].match_score}% Confidence
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {ai.resource_recommendations[0].team_name ||
                            ai.resource_recommendations[0].name}
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
                        className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shrink-0 transition-colors"
                      >
                        Deploy Unit
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggested Action Checklist */}
                {ai?.recommended_actions && ai.recommended_actions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      AI Action Checklist
                    </div>
                    <div className="space-y-1.5">
                      {ai.recommended_actions.slice(0, 3).map((act, idx) => {
                        const title = typeof act === "string" ? act : act.action;
                        const desc = typeof act === "object" ? act.description : null;
                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                              <span>{title}</span>
                            </div>
                            {desc && <p className="text-[11px] text-slate-500 mt-0.5 ml-4.5">{desc}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Quick Response Box if user asked a question */}
                {aiResponse && (
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-[11px] text-indigo-700">
                      <Sparkles size={12} /> AI Inquiry Result
                    </div>
                    <p>{aiResponse}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <AlertTriangle size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">Select an incident to view AI triage</p>
              </div>
            )}
          </div>

          {/* Quick Natural Language Assistant Bar */}
          <div className="p-3 border-t border-indigo-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAsk()}
                placeholder="Ask AI about this incident (e.g. 'Find routes', 'Explain priority')..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              <button
                onClick={() => handleQuickAsk()}
                disabled={!aiQuestion.trim()}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-40"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lower Workspace: Live Incident Queue & Response Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Incident Queue (7 cols) */}
        <div className="lg:col-span-7 light-card p-4">
          <div className="flex items-center justify-between border-b border-[#E5EAF1] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Active Incident Triage Stream
              </h3>
              <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {activeIncidents.length} active
              </span>
            </div>
            <Link
              to="/incidents"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeIncidents.slice(0, 3).map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const b = buildings.find((x) => x.id === inc.buildingId);

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-300"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {inc.id}
                      </span>
                      <SeverityBadge severity={inc.severity} size="sm" />
                      <StatusBadge status={inc.status} />
                    </div>
                    <div className="text-xs font-bold text-slate-900">{inc.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{b?.name || "Campus Ground"}</span>
                      <span>•</span>
                      <span>{inc.locationDetails}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/incidents/${inc.id}`);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 shrink-0"
                  >
                    Open Dossier →
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Response Fleet Status (5 cols) */}
        <div className="lg:col-span-5 light-card p-4">
          <div className="flex items-center justify-between border-b border-[#E5EAF1] pb-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Response Units on Duty
            </h3>
            <Link
              to="/dispatch"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Dispatch center</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {responders.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{r.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {r.specialization} • Base: {r.baseLocation}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.status === "available"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
