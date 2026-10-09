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
import { CAMPUS_NODE_LAYOUT } from "../store/demoState";

export default function CommandCenter() {
  const {
    incidents,
    buildings,
    responders,
    resources,
    assemblyPoints,
    campusEdges,
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
              <svg viewBox="0 0 920 560" className="w-[95%] h-[95%] select-none overflow-visible">
                <defs>
                  <pattern id="cmdGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" strokeWidth="1" />
                  </pattern>
                  <radialGradient id="cmdHazardGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                  </radialGradient>
                </defs>

                <rect width="100%" height="100%" fill="url(#cmdGrid)" rx="10" />

                {/* Staff Duty Zones (Subtle bounded perimeter markers) */}
                {showZones && (
                  <g className="transition-opacity duration-300">
                    {/* Zone West Outline */}
                    <rect
                      x="25"
                      y="25"
                      width="425"
                      height="510"
                      fill="#10B981"
                      fillOpacity="0.03"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      rx="12"
                    />
                    <text x="38" y="525" fill="#059669" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                      ZONE WEST • Academic Labs & Emergency Staging
                    </text>

                    {/* Zone East Outline */}
                    <rect
                      x="465"
                      y="25"
                      width="430"
                      height="510"
                      fill="#3978F6"
                      fillOpacity="0.03"
                      stroke="#3978F6"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      rx="12"
                    />
                    <text x="478" y="525" fill="#2563EB" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                      ZONE EAST • Residential Hostels, Dining & Fleet Logistics
                    </text>
                  </g>
                )}

                {/* Campus Walkways */}
                {campusEdges &&
                  campusEdges.map((edge) => {
                    const srcPos = CAMPUS_NODE_LAYOUT[edge.source] || { cx: 100, cy: 100 };
                    const tgtPos = CAMPUS_NODE_LAYOUT[edge.target] || { cx: 200, cy: 200 };

                    return (
                      <line
                        key={`cmd-edge-${edge.id}`}
                        x1={srcPos.cx}
                        y1={srcPos.cy}
                        x2={tgtPos.cx}
                        y2={tgtPos.cy}
                        stroke={edge.blocked ? "#DC2626" : "#E2E8F0"}
                        strokeWidth={edge.blocked ? "2.5" : "2"}
                        strokeDasharray={edge.blocked ? "4,4" : "none"}
                        strokeLinecap="round"
                      />
                    );
                  })}

                {/* Evacuation Highlight Route */}
                {showRoutes && selectedIncident && (
                  <path
                    d={`M 130 302.5 L 130 427.5 L 130 192.5`}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="8,4"
                    className="animate-pulse"
                  />
                )}

                {/* Assembly Points */}
                {assemblyPoints.map((ap) => {
                  const layout = CAMPUS_NODE_LAYOUT[ap.id] || {
                    x: ap.coordinates.x,
                    y: ap.coordinates.y,
                    width: 180,
                    height: 65,
                  };

                  return (
                    <g
                      key={`cmd-${ap.id}`}
                      transform={`translate(${layout.x}, ${layout.y})`}
                      className="cursor-pointer"
                    >
                      <rect
                        x="0"
                        y="0"
                        width={layout.width}
                        height={layout.height}
                        rx="10"
                        fill="#ECFDF5"
                        stroke="#10B981"
                        strokeWidth="1.5"
                      />
                      <circle cx="24" cy={layout.height / 2} r="12" fill="#10B981" />
                      <text
                        x="24"
                        y={layout.height / 2 + 4}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {ap.id}
                      </text>
                      <text
                        x="44"
                        y={layout.height / 2 - 3}
                        fill="#065F46"
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {ap.name.length > 18 ? `${ap.name.slice(0, 17)}…` : ap.name}
                      </text>
                      <text
                        x="44"
                        y={layout.height / 2 + 13}
                        fill="#059669"
                        fontSize="9"
                        fontWeight="500"
                        fontFamily="sans-serif"
                      >
                        Designated Assembly Safe Zone
                      </text>
                    </g>
                  );
                })}

                {/* Buildings */}
                {buildings.map((b) => {
                  const layout = CAMPUS_NODE_LAYOUT[b.id] || {
                    x: 480,
                    y: 160,
                    width: 180,
                    height: 85,
                  };
                  const isSelected = selectedBuilding?.id === b.id;
                  const bIncidents = activeIncidents.filter((i) => i.buildingId === b.id);
                  const hasIncident = bIncidents.length > 0;
                  const isCritical = bIncidents.some((i) => i.severity === "critical");

                  const fill = isSelected
                    ? "#EFF6FF"
                    : isCritical
                    ? "#FEF2F2"
                    : hasIncident
                    ? "#FFF7ED"
                    : "#FFFFFF";

                  const stroke = isSelected
                    ? "#2563EB"
                    : isCritical
                    ? "#DC2626"
                    : hasIncident
                    ? "#F97316"
                    : "#CBD5E1";

                  const strokeWidth = isSelected ? "2.5" : hasIncident ? "2" : "1.5";

                  return (
                    <g
                      key={`cmd-bld-${b.id}`}
                      transform={`translate(${layout.x}, ${layout.y})`}
                      className="cursor-pointer group"
                      onClick={() => {
                        const incInB = activeIncidents.find((i) => i.buildingId === b.id);
                        if (incInB) setSelectedIncidentId(incInB.id);
                      }}
                    >
                      {/* Active Hazard Background Halo */}
                      {hasIncident && (
                        <circle
                          cx={layout.width / 2}
                          cy={layout.height / 2}
                          r="65"
                          fill="url(#cmdHazardGlow)"
                          stroke="#DC2626"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          className="animate-pulse"
                        />
                      )}

                      {/* Building Footprint Card */}
                      <rect
                        x="0"
                        y="0"
                        width={layout.width}
                        height={layout.height}
                        rx="10"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        className="transition-all duration-150"
                      />

                      {/* Code & Type */}
                      <text
                        x="12"
                        y="18"
                        fill={isCritical ? "#DC2626" : isSelected ? "#2563EB" : "#64748B"}
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {(b.code || b.id).toUpperCase()} • {b.type}
                      </text>

                      {/* Building Name */}
                      <text
                        x="12"
                        y="36"
                        fontSize="12"
                        fill={isSelected ? "#1E40AF" : isCritical ? "#991B1B" : "#0F172A"}
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {b.name}
                      </text>

                      {/* Occupancy Indicator Bar */}
                      <rect
                        x="12"
                        y={layout.height - 20}
                        width={layout.width - 24}
                        height="5"
                        rx="2.5"
                        fill="#E2E8F0"
                      />
                      <rect
                        x="12"
                        y={layout.height - 20}
                        width={Math.min(
                          (layout.width - 24) * ((b.occupancy || 0) / (b.capacity || 100)),
                          layout.width - 24
                        )}
                        height="5"
                        rx="2.5"
                        fill={isCritical ? "#DC2626" : isSelected ? "#2563EB" : "#10B981"}
                      />
                      <text
                        x="12"
                        y={layout.height - 25}
                        fontSize="8.5"
                        fill="#64748B"
                        fontWeight="600"
                        fontFamily="sans-serif"
                      >
                        {b.occupancy} / {b.capacity} Occupants
                      </text>

                      {/* Hazard Beacon Ping */}
                      {hasIncident && (
                        <g transform={`translate(${layout.width - 24}, 8)`}>
                          <circle cx="8" cy="8" r="9" fill={isCritical ? "#DC2626" : "#F97316"} className="animate-ping opacity-60" />
                          <circle cx="8" cy="8" r="9" fill={isCritical ? "#DC2626" : "#F97316"} />
                          <text x="8" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
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
