import { useState } from "react";
import { useDemo } from "../store/demoState";
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
  Map as MapIcon,
  LayoutGrid
} from "lucide-react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from "react-leaflet";
import L from "leaflet";
import { CAMPUS_NODE_LAYOUT } from "../store/demoState";

// Create custom SVG Leaflet pin icons
const createCustomPin = (color: string, label: string) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1.5px solid white; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
        <span>${label}</span>
      </div>
    `,
    iconSize: [80, 28],
    iconAnchor: [40, 14],
  });
};

export default function CampusMap() {
  const { buildings, incidents, assemblyPoints, campusEdges, selectedIncidentId, setSelectedIncidentId } = useDemo();

  const [viewMode, setViewMode] = useState<"gis" | "schematic">("schematic");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>("B1");

  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showOccupancy, setShowOccupancy] = useState(true);
  const [showAssembly, setShowAssembly] = useState(true);
  const [showStaffZones, setShowStaffZones] = useState(true);

  // Schematic Zoom
  const [zoom, setZoom] = useState(1);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];
  const buildingIncidents = incidents.filter(
    (i) =>
      i.buildingId === selectedBuildingId &&
      !["resolved", "closed"].includes(i.status),
  );

  const activeIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status));

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.7));
  const handleResetZoom = () => setZoom(1);

  const getOccupancyColor = (occ: number, cap: number) => {
    const ratio = occ / (cap || 1);
    if (ratio > 0.85) return "#DC2626";
    if (ratio > 0.65) return "#F59E0B";
    if (ratio > 0.4) return "#3978F6";
    return "#10B981";
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

        {/* View Mode & Layer Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher: Schematic Blueprint vs GIS Satellite */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
            <button
              onClick={() => setViewMode("schematic")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                viewMode === "schematic"
                  ? "bg-white text-brand-700 shadow-xs border border-brand-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={13} />
              <span>Schematic Blueprint</span>
            </button>
            <button
              onClick={() => setViewMode("gis")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                viewMode === "gis"
                  ? "bg-white text-brand-700 shadow-xs border border-brand-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon size={13} />
              <span>Satellite GIS</span>
            </button>
          </div>

          {/* Layer Toggles */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
            <button
              onClick={() => setShowIncidents(!showIncidents)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                showIncidents
                  ? "bg-white text-critical shadow-xs border border-critical/30"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Flame size={12} className={showIncidents ? "text-critical" : "text-slate-400"} />
              <span>Hazards</span>
            </button>
            <button
              onClick={() => setShowOccupancy(!showOccupancy)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                showOccupancy
                  ? "bg-white text-brand-600 shadow-xs border border-brand-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={12} className={showOccupancy ? "text-brand-600" : "text-slate-400"} />
              <span>Occupancy</span>
            </button>
            <button
              onClick={() => setShowAssembly(!showAssembly)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                showAssembly
                  ? "bg-white text-emerald-600 shadow-xs border border-emerald-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CheckCircle2 size={12} className={showAssembly ? "text-emerald-600" : "text-slate-400"} />
              <span>Assembly</span>
            </button>
            <button
              onClick={() => setShowStaffZones(!showStaffZones)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                showStaffZones
                  ? "bg-white text-indigo-600 shadow-xs border border-indigo-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield size={12} className={showStaffZones ? "text-indigo-600" : "text-slate-400"} />
              <span>Zones</span>
            </button>
          </div>

          {/* Schematic Zoom */}
          {viewMode === "schematic" && (
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                title="Reset View"
              >
                <Maximize size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Map Canvas / GIS Container */}
        <div className="lg:col-span-3 light-card overflow-hidden relative flex flex-col bg-slate-50 border border-slate-200">
          {/* Map Info Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">Sasurie Main Campus GeoGrid</span>
            <span className="text-[10px] text-slate-500 font-mono">11.1085° N, 77.3411° E</span>
          </div>

          {/* Scale Legend */}
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-500" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-500" />
              <span>Caution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-500" />
              <span>Evacuating</span>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <div className="font-mono text-[10px] text-slate-400">Scale: 1:2500</div>
          </div>

          {/* VIEW 1: Interactive GIS Satellite Map (Leaflet) */}
          {viewMode === "gis" && (
            <div className="w-full h-full relative z-10">
              <MapContainer
                center={[11.1085, 77.3411]}
                zoom={16}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Staff Duty Zones */}
                {showStaffZones && (
                  <>
                    <Polygon
                      positions={[
                        [11.1095, 77.3375],
                        [11.1118, 77.3375],
                        [11.1118, 77.3410],
                        [11.1095, 77.3410],
                      ]}
                      pathOptions={{
                        color: "#10B981",
                        fillColor: "#10B981",
                        fillOpacity: 0.12,
                        dashArray: "6,6",
                      }}
                    />
                    <Polygon
                      positions={[
                        [11.1065, 77.3415],
                        [11.1115, 77.3415],
                        [11.1115, 77.3445],
                        [11.1065, 77.3445],
                      ]}
                      pathOptions={{
                        color: "#3978F6",
                        fillColor: "#3978F6",
                        fillOpacity: 0.1,
                        dashArray: "6,6",
                      }}
                    />
                  </>
                )}

                {/* Hazard Incident Circles */}
                {showIncidents &&
                  activeIncidents.map((inc) => {
                    const b = buildings.find((bld) => bld.id === inc.buildingId);
                    const lat = b?.lat || 11.1085;
                    const lng = b?.lng || 77.3411;

                    return (
                      <Circle
                        key={`circle-${inc.id}`}
                        center={[lat, lng]}
                        radius={inc.severity === "critical" ? 75 : 45}
                        pathOptions={{
                          color: "#DC2626",
                          fillColor: "#DC2626",
                          fillOpacity: 0.2,
                          dashArray: "4,4",
                        }}
                      />
                    );
                  })}

                {/* Building Markers */}
                {buildings.map((b) => {
                  const bIncidents = incidents.filter(
                    (i) => i.buildingId === b.id && !["resolved", "closed"].includes(i.status)
                  );
                  const isCritical = bIncidents.some((i) => i.severity === "critical");
                  const pinColor = isCritical ? "#DC2626" : b.status === "evacuating" ? "#EF4444" : "#1D4ED8";
                  const lat = b.lat || 11.1085;
                  const lng = b.lng || 77.3411;

                  return (
                    <Marker
                      key={`leaflet-${b.id}`}
                      position={[lat, lng]}
                      icon={createCustomPin(pinColor, b.name)}
                      eventHandlers={{
                        click: () => {
                          setSelectedBuildingId(b.id);
                          if (bIncidents.length > 0) setSelectedIncidentId(bIncidents[0].id);
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 text-slate-800">
                          <div className="font-bold text-xs">{b.name}</div>
                          <div className="text-[11px] text-slate-600">
                            Occupancy: {b.occupancy} / {b.capacity}
                          </div>
                          {bIncidents.length > 0 && (
                            <div className="text-[11px] font-bold text-red-600">
                              Active Hazards: {bIncidents.length}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* VIEW 2: Schematic Blueprint Vector Map (Zero Overlap Guaranteed) */}
          {viewMode === "schematic" && (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="relative w-[920px] h-[560px] bg-white rounded-xl border border-slate-200 shadow-xs pattern-grid"
              >
                <svg viewBox="0 0 920 560" className="w-full h-full select-none">
                  <defs>
                    <pattern id="campusGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" strokeWidth="1" />
                    </pattern>
                    <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                    </radialGradient>
                    <filter id="mapShadow" x="-5%" y="-5%" width="110%" height="115%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.05" />
                    </filter>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#campusGrid)" rx="10" />

                  {/* Staff Duty Zones (Bounded Perimeters) */}
                  {showStaffZones && (
                    <g className="transition-opacity duration-300">
                      {/* Zone West */}
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
                        ZONE WEST • Academic Labs & Emergency Station
                      </text>

                      {/* Zone East */}
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
                        ZONE EAST • Residential Hostels, Dining & Fleet Base
                      </text>
                    </g>
                  )}

                  {/* Campus Walkway Network */}
                  {campusEdges &&
                    campusEdges.map((edge) => {
                      const srcPos = CAMPUS_NODE_LAYOUT[edge.source] || { cx: 100, cy: 100 };
                      const tgtPos = CAMPUS_NODE_LAYOUT[edge.target] || { cx: 200, cy: 200 };

                      return (
                        <line
                          key={`map-edge-${edge.id}`}
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

                  {/* Campus Assembly Points */}
                  {showAssembly &&
                    assemblyPoints.map((ap) => {
                      const layout = CAMPUS_NODE_LAYOUT[ap.id] || {
                        x: ap.coordinates.x,
                        y: ap.coordinates.y,
                        width: 180,
                        height: 65,
                      };

                      return (
                        <g
                          key={`map-ap-${ap.id}`}
                          transform={`translate(${layout.x}, ${layout.y})`}
                          className="cursor-pointer"
                          filter="url(#mapShadow)"
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
                            Designated Safe Assembly Zone
                          </text>
                        </g>
                      );
                    })}

                  {/* Buildings Rendered via Absolute Guaranteed Grid */}
                  {buildings.map((b) => {
                    const layout = CAMPUS_NODE_LAYOUT[b.id] || {
                      x: 480,
                      y: 160,
                      width: 180,
                      height: 85,
                    };
                    const isSelected = b.id === selectedBuildingId;
                    const bIncidents = incidents.filter(
                      (i) => i.buildingId === b.id && !["resolved", "closed"].includes(i.status)
                    );
                    const isEvacuating = b.status === "evacuating";

                    const fill = isSelected
                      ? "#EFF6FF"
                      : isEvacuating
                      ? "#FEF2F2"
                      : "#FFFFFF";

                    const stroke = isSelected
                      ? "#2563EB"
                      : isEvacuating
                      ? "#DC2626"
                      : "#CBD5E1";

                    return (
                      <g
                        key={`bld-${b.id}`}
                        onClick={() => {
                          setSelectedBuildingId(b.id);
                          if (bIncidents.length > 0) setSelectedIncidentId(bIncidents[0].id);
                        }}
                        className="cursor-pointer group"
                        filter="url(#mapShadow)"
                      >
                        {/* Hazard Radius Circle behind building if active */}
                        {showIncidents && bIncidents.length > 0 && (
                          <circle
                            cx={layout.x + layout.width / 2}
                            cy={layout.y + layout.height / 2}
                            r="75"
                            fill="url(#hazardGlow)"
                            stroke="#DC2626"
                            strokeWidth="1.5"
                            strokeDasharray="4,3"
                            className="animate-pulse"
                          />
                        )}

                        {/* Building Card Rectangle */}
                        <rect
                          x={layout.x}
                          y={layout.y}
                          width={layout.width}
                          height={layout.height}
                          rx="10"
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={isSelected ? "2.5" : "1.5"}
                          className="transition-all duration-150"
                        />

                        {/* Building Code & Type Tag */}
                        <text
                          x={layout.x + 12}
                          y={layout.y + 18}
                          fill="#64748B"
                          fontSize="9"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          {(b.code || b.id).toUpperCase()} • {b.type}
                        </text>

                        {/* Building Name */}
                        <text
                          x={layout.x + 12}
                          y={layout.y + 36}
                          fill="#0F172A"
                          fontSize="12"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          {b.name}
                        </text>

                        {/* Occupancy Indicator Bar */}
                        {showOccupancy && (
                          <g>
                            <rect
                              x={layout.x + 12}
                              y={layout.y + layout.height - 20}
                              width={layout.width - 24}
                              height="5"
                              rx="2.5"
                              fill="#E2E8F0"
                            />
                            <rect
                              x={layout.x + 12}
                              y={layout.y + layout.height - 20}
                              width={Math.min(
                                (layout.width - 24) * ((b.occupancy || 0) / (b.capacity || 100)),
                                layout.width - 24
                              )}
                              height="5"
                              rx="2.5"
                              fill={getOccupancyColor(b.occupancy || 0, b.capacity || 100)}
                            />
                            <text
                              x={layout.x + 12}
                              y={layout.y + layout.height - 25}
                              fill="#64748B"
                              fontSize="8.5"
                              fontWeight="600"
                              fontFamily="sans-serif"
                            >
                              Occupancy: {b.occupancy} / {b.capacity} ({Math.round(((b.occupancy || 0) / (b.capacity || 100)) * 100)}%)
                            </text>
                          </g>
                        )}

                        {/* Active Hazard Warning Badge */}
                        {showIncidents && bIncidents.length > 0 && (
                          <g transform={`translate(${layout.x + layout.width - 24}, ${layout.y + 8})`}>
                            <circle cx="8" cy="8" r="9" fill="#DC2626" className="animate-ping opacity-60" />
                            <circle cx="8" cy="8" r="9" fill="#DC2626" />
                            <text
                              x="8"
                              y="12"
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="10"
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
            </div>
          )}
        </div>

        {/* Building Inspector Sidebar */}
        <div className="lg:col-span-1 space-y-4 flex flex-col overflow-y-auto">
          {selectedBuilding ? (
            <div className="light-card p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {selectedBuilding.code || selectedBuilding.id}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {selectedBuilding.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedBuildingId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                >
                  <X size={15} />
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
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Type</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedBuilding.type}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Occupancy</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedBuilding.occupancy} / {selectedBuilding.capacity}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Evacuation</div>
                  <div className="text-xs font-bold text-brand-600 mt-0.5">
                    {selectedBuilding.evacuationTime || "3.5 min"}
                  </div>
                </div>
              </div>

              {/* Active Hazards in this building */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Facility Incident Reports</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                    {buildingIncidents.length}
                  </span>
                </h3>

                {buildingIncidents.length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Facility normal. No hazards reported.</span>
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
                            Inspect <ArrowRight size={11} />
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
                  to={`/report-emergency?building=${selectedBuilding.id}`}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span>Report Incident Here</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="light-card p-6 text-center space-y-3">
              <MapPin size={32} className="mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Select a Facility</h3>
              <p className="text-xs text-slate-500">
                Click any building card on the blueprint or GIS map to inspect floor layouts, occupancy levels, and active hazards.
              </p>
            </div>
          )}

          {/* Facility Roster List */}
          <div className="light-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Campus Facilities ({buildings.length})
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
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
                  <span className="text-[10px] font-mono text-slate-400">{bld.code || bld.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
