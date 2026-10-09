import { useState } from "react";
import { useDemo, type Building } from "../store/demoState";
import { SeverityBadge, StatusBadge } from "../components/common/Badge";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
  Users,
  Flame,
  CheckCircle2,
  Shield,
  MapPin,
  Compass,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function CampusMap() {
  const { buildings, incidents, selectedIncidentId, setSelectedIncidentId } = useDemo();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>("BLD-001");

  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showOccupancy, setShowOccupancy] = useState(true);
  const [showAssembly, setShowAssembly] = useState(true);
  const [showStaffZones, setShowStaffZones] = useState(true);
  const [showHazardRadius] = useState(true);

  // Zoom
  const [zoom, setZoom] = useState(1);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const buildingIncidents = incidents.filter(
    (i) =>
      i.buildingId === selectedBuildingId &&
      !["resolved", "closed"].includes(i.status),
  );

  const activeIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status));

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.7));
  const handleResetZoom = () => setZoom(1);

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const ratio = occupancy / capacity;
    if (ratio > 0.85) return "#DC2626";
    if (ratio > 0.65) return "#F59E0B";
    if (ratio > 0.4) return "#3978F6";
    return "#10B981";
  };

  const getBuildingFill = (b: Building, isSelected: boolean) => {
    if (isSelected) return "#EEF2FF";
    if (b.status === "evacuating") return "#FEF2F2";
    if (b.status === "locked_down") return "#FFFBEB";
    return "#FFFFFF";
  };

  const getBuildingStroke = (b: Building, isSelected: boolean) => {
    if (isSelected) return "#3978F6";
    if (b.status === "evacuating") return "#DC2626";
    if (b.status === "locked_down") return "#F59E0B";
    return "#CBD5E1";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-full space-y-4">
      {/* Header Bar */}
      <div className="light-card p-4 flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">
              GIS Spatial Operations
            </span>
            <span className="text-xs text-slate-500 font-medium">Interactive Facility & Hazard Map</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Live Campus Map & Facilities
          </h1>
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
            <button
              onClick={() => setShowIncidents(!showIncidents)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                showIncidents
                  ? "bg-white text-critical shadow-xs border border-critical/30"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flame size={13} className={showIncidents ? "text-critical" : "text-slate-400"} />
              <span>Hazards</span>
            </button>
            <button
              onClick={() => setShowOccupancy(!showOccupancy)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                showOccupancy
                  ? "bg-white text-brand-600 shadow-xs border border-brand-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={13} className={showOccupancy ? "text-brand-600" : "text-slate-400"} />
              <span>Occupancy</span>
            </button>
            <button
              onClick={() => setShowAssembly(!showAssembly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                showAssembly
                  ? "bg-white text-emerald-600 shadow-xs border border-emerald-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 size={13} className={showAssembly ? "text-emerald-600" : "text-slate-400"} />
              <span>Assembly Points</span>
            </button>
            <button
              onClick={() => setShowStaffZones(!showStaffZones)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                showStaffZones
                  ? "bg-white text-indigo-600 shadow-xs border border-indigo-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Shield size={13} className={showStaffZones ? "text-indigo-600" : "text-slate-400"} />
              <span>Staff Zones</span>
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
              title="Recenter Map"
            >
              <Maximize size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Map Canvas */}
        <div className="lg:col-span-3 light-card overflow-hidden relative flex flex-col bg-slate-50 border border-slate-200">
          {/* Map Status Bar */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">Sasurie Main Campus GeoGrid</span>
            <span className="text-[10px] text-slate-500 font-mono">11.1085° N, 77.3411° E</span>
          </div>

          {/* Scale & Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm p-2.5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
              <span>Caution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-500" />
              <span>Evacuating</span>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <div className="font-mono text-[10px] text-slate-400">Scale: 1:2500</div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="relative w-[900px] h-[600px] bg-white rounded-xl border border-slate-200 shadow-xs pattern-grid"
            >
              <svg
                viewBox="0 0 900 600"
                className="w-full h-full select-none"
              >
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#F1F5F9" strokeWidth="1" />
                  </pattern>
                  <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                  </radialGradient>
                </defs>

                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Campus Perimeter Road & Walkways */}
                <path
                  d="M 50 50 L 850 50 L 850 550 L 50 550 Z"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  strokeDasharray="4,4"
                />
                {/* Main Walkway Spine */}
                <path
                  d="M 450 60 L 450 540 M 60 300 L 840 300"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="10"
                />

                {/* Staff Duty Zones */}
                {showStaffZones && (
                  <g className="transition-opacity duration-300">
                    <rect
                      x="70"
                      y="70"
                      width="350"
                      height="210"
                      fill="#10B981"
                      fillOpacity="0.05"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      rx="8"
                    />
                    <text x="85" y="95" fill="#059669" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                      ZONE NORTH (Medical & Security Patrol)
                    </text>

                    <rect
                      x="470"
                      y="70"
                      width="360"
                      height="460"
                      fill="#3978F6"
                      fillOpacity="0.04"
                      stroke="#3978F6"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      rx="8"
                    />
                    <text x="485" y="95" fill="#2563EB" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                      ZONE EAST (HazMat & Technical Fleet)
                    </text>
                  </g>
                )}

                {/* Hazard Radiuses */}
                {showHazardRadius && (
                  <g>
                    {activeIncidents.map((inc) => {
                      const b = buildings.find((bld) => bld.id === inc.buildingId);
                      if (!b) return null;
                      return (
                        <g key={`hazard-${inc.id}`}>
                          <circle
                            cx={b.coordinates.x + b.width / 2}
                            cy={b.coordinates.y + b.height / 2}
                            r={inc.severity === "critical" ? 85 : 55}
                            fill="url(#hazardGlow)"
                            stroke="#DC2626"
                            strokeWidth="1.5"
                            strokeDasharray="4,3"
                            className="animate-pulse"
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Campus Buildings */}
                {buildings.map((b) => {
                  const isSelected = b.id === selectedBuildingId;
                  const stroke = getBuildingStroke(b, isSelected);
                  const fill = getBuildingFill(b, isSelected);
                  const bIncidents = incidents.filter(
                    (i) => i.buildingId === b.id && !["resolved", "closed"].includes(i.status)
                  );

                  return (
                    <g
                      key={b.id}
                      onClick={() => {
                        setSelectedBuildingId(b.id);
                        if (bIncidents.length > 0) {
                          setSelectedIncidentId(bIncidents[0].id);
                        }
                      }}
                      className="cursor-pointer transition-transform duration-150 group"
                    >
                      {/* Building Footprint */}
                      <rect
                        x={b.coordinates.x}
                        y={b.coordinates.y}
                        width={b.width}
                        height={b.height}
                        rx="8"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isSelected ? "3" : "1.5"}
                        className="transition-all duration-200 shadow-sm"
                      />

                      {/* Header label */}
                      <text
                        x={b.coordinates.x + 12}
                        y={b.coordinates.y + 24}
                        fill="#0F172A"
                        fontSize="13"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {b.name}
                      </text>

                      {/* Subtitle / Code */}
                      <text
                        x={b.coordinates.x + 12}
                        y={b.coordinates.y + 40}
                        fill="#64748B"
                        fontSize="10"
                        fontWeight="500"
                        fontFamily="sans-serif"
                      >
                        {b.code} • {b.floors} Floors
                      </text>

                      {/* Occupancy Indicator */}
                      {showOccupancy && (
                        <g>
                          <rect
                            x={b.coordinates.x + 12}
                            y={b.coordinates.y + b.height - 24}
                            width={b.width - 24}
                            height="6"
                            rx="3"
                            fill="#E2E8F0"
                          />
                          <rect
                            x={b.coordinates.x + 12}
                            y={b.coordinates.y + b.height - 24}
                            width={Math.min(
                              (b.width - 24) * ((b.currentOccupancy || b.occupancy || 0) / (b.maxCapacity || b.capacity || 100)),
                              b.width - 24
                            )}
                            height="6"
                            rx="3"
                            fill={getOccupancyColor(b.currentOccupancy || b.occupancy || 0, b.maxCapacity || b.capacity || 100)}
                          />
                          <text
                            x={b.coordinates.x + 12}
                            y={b.coordinates.y + b.height - 30}
                            fill="#64748B"
                            fontSize="9"
                            fontWeight="600"
                          >
                            Occupancy: {b.currentOccupancy || b.occupancy || 0} / {b.maxCapacity || b.capacity || 100} ({Math.round(((b.currentOccupancy || b.occupancy || 0) / (b.maxCapacity || b.capacity || 100)) * 100)}%)
                          </text>
                        </g>
                      )}

                      {/* Hazard Pin */}
                      {showIncidents && bIncidents.length > 0 && (
                        <g transform={`translate(${b.coordinates.x + b.width - 28}, ${b.coordinates.y + 10})`}>
                          <circle cx="10" cy="10" r="12" fill="#DC2626" className="animate-ping opacity-75" />
                          <circle cx="10" cy="10" r="12" fill="#DC2626" />
                          <text
                            x="10"
                            y="14"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="11"
                            fontWeight="bold"
                          >
                            !
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Assembly Points */}
                {showAssembly && (
                  <g>
                    {/* Assembly Point 1 */}
                    <g transform="translate(180, 520)" className="cursor-pointer">
                      <circle cx="0" cy="0" r="18" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2" />
                      <circle cx="0" cy="0" r="10" fill="#10B981" />
                      <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                        AP1
                      </text>
                      <text x="0" y="28" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="700">
                        West Athletic Field
                      </text>
                    </g>

                    {/* Assembly Point 2 */}
                    <g transform="translate(700, 520)" className="cursor-pointer">
                      <circle cx="0" cy="0" r="18" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2" />
                      <circle cx="0" cy="0" r="10" fill="#10B981" />
                      <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                        AP2
                      </text>
                      <text x="0" y="28" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="700">
                        East Quad Green
                      </text>
                    </g>

                    {/* Assembly Point 3 */}
                    <g transform="translate(450, 40)" className="cursor-pointer">
                      <circle cx="0" cy="0" r="18" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2" />
                      <circle cx="0" cy="0" r="10" fill="#10B981" />
                      <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                        AP3
                      </text>
                      <text x="0" y="28" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="700">
                        North Gate Plaza
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Building Inspector Sidebar */}
        <div className="lg:col-span-1 space-y-4 flex flex-col overflow-y-auto">
          {selectedBuilding ? (
            <div className="light-card p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {selectedBuilding.code}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedBuilding.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedBuildingId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Status</div>
                  <div className="text-xs font-bold text-slate-800 capitalize mt-0.5">
                    {selectedBuilding.status.replace("_", " ")}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Floors</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedBuilding.floors} Levels
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Occupancy</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedBuilding.currentOccupancy} / {selectedBuilding.maxCapacity}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Evac Time</div>
                  <div className="text-xs font-bold text-brand-600 mt-0.5">
                    {selectedBuilding.evacuationTime}
                  </div>
                </div>
              </div>

              {/* Active Hazards in this building */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Active Incident Reports</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                    {buildingIncidents.length}
                  </span>
                </h3>

                {buildingIncidents.length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>No active incidents reported in this facility.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {buildingIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => setSelectedIncidentId(inc.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedIncidentId === inc.id
                            ? "bg-brand-50 border-brand-300 shadow-xs"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] font-bold text-slate-700">
                            {inc.id}
                          </span>
                          <SeverityBadge severity={inc.severity} />
                        </div>
                        <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {inc.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {inc.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                          <StatusBadge status={inc.status} />
                          <Link
                            to={`/incidents/${inc.id}`}
                            className="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1"
                          >
                            Inspect Dossier <ArrowRight size={11} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  to={`/evacuation?building=${selectedBuilding.id}`}
                  className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Compass size={14} />
                  <span>Plan Evacuation Corridor</span>
                </Link>
                <Link
                  to={`/report?building=${selectedBuilding.id}`}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span>Report An Incident Here</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="light-card p-6 text-center space-y-3">
              <MapPin size={32} className="mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Select a Building</h3>
              <p className="text-xs text-slate-500">
                Click on any facility footprint on the campus map to inspect floor layouts, occupancy levels, and active hazards.
              </p>
            </div>
          )}

          {/* Quick Facility Index */}
          <div className="light-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Facility Index ({buildings.length})
            </h3>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {buildings.map((bld) => (
                <button
                  key={bld.id}
                  onClick={() => setSelectedBuildingId(bld.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    selectedBuildingId === bld.id
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{bld.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{bld.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
