import { useState } from "react";
import { useDemo, type Building } from "../store/demoState";
import {
  Map as Box,
  ZoomIn,
  ZoomOut,
  Maximize,
  ShieldAlert,
  X,
  AlertTriangle,
  Users,
  Navigation,
} from "lucide-react";

export default function CampusMap() {
  const { buildings, incidents } = useDemo();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null,
  );

  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showOccupancy, setShowOccupancy] = useState(false);
  const [showResources, setShowResources] = useState(false);

  // Simple zoom/pan state (mock for UI)
  const [zoom, setZoom] = useState(1);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const buildingIncidents = incidents.filter(
    (i) =>
      i.buildingId === selectedBuildingId &&
      !["resolved", "closed"].includes(i.status),
  );

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const ratio = occupancy / capacity;
    if (ratio > 0.9) return "fill-red-500";
    if (ratio > 0.7) return "fill-orange-400";
    if (ratio > 0.4) return "fill-amber-300";
    return "fill-green-400";
  };

  const getBuildingBaseColor = (b: Building) => {
    if (b.status === "evacuating") return "fill-red-100 stroke-red-500";
    if (b.status === "locked_down") return "fill-orange-100 stroke-orange-500";
    return "fill-slate-100 stroke-slate-300 hover:fill-slate-200";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-full -m-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-white flex justify-between items-center z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campus Map
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Simulated spatial view of facilities and active incidents.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-2 ${showIncidents ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            <AlertTriangle
              size={14}
              className={showIncidents ? "text-red-500" : ""}
            />{" "}
            Incidents
          </button>
          <button
            onClick={() => setShowOccupancy(!showOccupancy)}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-2 ${showOccupancy ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users size={14} className={showOccupancy ? "text-blue-500" : ""} />{" "}
            Occupancy
          </button>
          <button
            onClick={() => setShowResources(!showResources)}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-2 ${showResources ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Box size={14} className={showResources ? "text-green-500" : ""} />{" "}
            Resources
          </button>
        </div>
      </div>

      {/* Main Map Workspace */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-50">
        {/* SVG Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center pattern-grid">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 bg-white p-1 rounded-md shadow-sm border border-slate-200">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded"
              title="Reset Zoom"
            >
              <Maximize size={18} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
          </div>

          {/* SVG Map */}
          <div
            className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-[80%] h-[80%] drop-shadow-sm overflow-visible"
            >
              {/* Ground elements / Roads (Mock) */}
              <path
                d="M 0 55 C 40 55, 60 45, 100 45"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="4"
              />
              <path
                d="M 45 0 L 45 100"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="3"
              />
              <circle cx="45" cy="50" r="4" fill="#E2E8F0" />

              {/* Assembly Points */}
              <circle
                cx="20"
                cy="85"
                r="3"
                fill="#D1FAE5"
                stroke="#10B981"
                strokeWidth="0.5"
                strokeDasharray="1,1"
              />
              <text
                x="20"
                y="85"
                fontSize="1.5"
                textAnchor="middle"
                fill="#065F46"
                dy="0.5"
              >
                AP-1
              </text>

              <circle
                cx="85"
                cy="80"
                r="3"
                fill="#D1FAE5"
                stroke="#10B981"
                strokeWidth="0.5"
                strokeDasharray="1,1"
              />
              <text
                x="85"
                y="80"
                fontSize="1.5"
                textAnchor="middle"
                fill="#065F46"
                dy="0.5"
              >
                AP-2
              </text>

              {/* Buildings */}
              {buildings.map((b) => {
                const isActive = selectedBuildingId === b.id;
                const hasIncident = incidents.some(
                  (i) =>
                    i.buildingId === b.id &&
                    !["resolved", "closed"].includes(i.status),
                );

                return (
                  <g
                    key={b.id}
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedBuildingId(b.id)}
                  >
                    <rect
                      x={b.coordinates.x - b.width / 2}
                      y={b.coordinates.y - b.height / 2}
                      width={b.width}
                      height={b.height}
                      rx="1"
                      className={`${getBuildingBaseColor(b)} ${isActive ? "stroke-primary stroke-[1.5]" : "stroke-[0.5]"} transition-colors`}
                    />

                    {/* Building Name label */}
                    <text
                      x={b.coordinates.x}
                      y={b.coordinates.y + 0.5}
                      fontSize="2"
                      textAnchor="middle"
                      fill="#475569"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {b.name}
                    </text>

                    {/* Occupancy Overlay */}
                    {showOccupancy && (
                      <circle
                        cx={b.coordinates.x + b.width / 2 - 1.5}
                        cy={b.coordinates.y - b.height / 2 + 1.5}
                        r="1.2"
                        className={getOccupancyColor(b.occupancy, b.capacity)}
                      />
                    )}

                    {/* Incident Indicator */}
                    {showIncidents && hasIncident && (
                      <g
                        transform={`translate(${b.coordinates.x - b.width / 2 + 1.5}, ${b.coordinates.y - b.height / 2 + 1.5})`}
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r="1.5"
                          fill="#EF4444"
                          className="animate-pulse"
                        />
                        <text
                          x="0"
                          y="0.5"
                          fontSize="1.5"
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

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-sm border border-slate-200 text-xs">
            <h4 className="font-bold mb-2 text-slate-800">Map Legend</h4>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-100 border border-slate-300"></div>{" "}
                Normal Building
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-500"></div>{" "}
                Evacuating
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>{" "}
                Active Incident
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-green-500 bg-green-100 border-dashed"></div>{" "}
                Assembly Point
              </div>
            </div>
          </div>
        </div>

        {/* Building Details Side Panel */}
        {selectedBuilding && (
          <div className="w-80 bg-white border-l border-border shadow-xl flex flex-col h-full z-20 overflow-y-auto animate-in slide-in-from-right-4">
            <div className="p-4 border-b border-border flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {selectedBuilding.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedBuilding.type} Facility
                </p>
              </div>
              <button
                onClick={() => setSelectedBuildingId(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Status & Occupancy */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Current Status
                </h4>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-bold border ${
                      selectedBuilding.status === "safe"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : selectedBuilding.status === "evacuating"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-orange-100 text-orange-700 border-orange-200"
                    }`}
                  >
                    {selectedBuilding.status.toUpperCase()}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">
                      Estimated Occupancy
                    </span>
                    <span className="font-bold">
                      {selectedBuilding.occupancy} / {selectedBuilding.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${selectedBuilding.occupancy / selectedBuilding.capacity > 0.8 ? "bg-red-500" : "bg-primary"}`}
                      style={{
                        width: `${Math.min((selectedBuilding.occupancy / selectedBuilding.capacity) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-right">
                    Updated 2 mins ago
                  </p>
                </div>
              </div>

              {/* Active Incidents */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  Active Incidents
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                    {buildingIncidents.length}
                  </span>
                </h4>

                {buildingIncidents.length > 0 ? (
                  <div className="space-y-3">
                    {buildingIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="border border-red-200 bg-red-50 rounded-md p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={14} className="text-red-500" />
                          <span className="font-semibold text-slate-900 text-sm">
                            {inc.title}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 ml-5">
                          {inc.locationDetails}
                        </div>
                        <div className="mt-2 ml-5">
                          <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                            {inc.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-200">
                    No active incidents reported.
                  </div>
                )}
              </div>

              {/* Safety Infrastructure */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Safety Info
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm border border-slate-200 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                    <Navigation size={16} className="text-green-600" />
                    <span className="font-medium">Primary Assembly: AP-1</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm border border-slate-200 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                    <ShieldAlert size={16} className="text-orange-500" />
                    <span className="font-medium">Fire Extinguishers: 12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
