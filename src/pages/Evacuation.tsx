import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDemo } from "../store/demoState";
import {
  Route as RouteIcon,
  AlertTriangle,
  Compass,
  CheckCircle2,
  MapPin,
  Lock,
  Unlock,
  Radio,
  Building as BuildingIcon
} from "lucide-react";

// Dijkstra implementation for evacuation routing
function calculatePath(
  startId: string,
  endId: string,
  edges: any[],
  nodes: any[],
  avoidHazards: boolean,
  incidents: any[],
) {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const queue = new Set(nodes.map((n) => n.id));

  // Determine hazardous nodes
  const hazardousNodes = new Set<string>();
  if (avoidHazards) {
    incidents.forEach((inc) => {
      if (
        (inc.severity === "high" || inc.severity === "critical") &&
        inc.buildingId
      ) {
        hazardousNodes.add(inc.buildingId);
      }
    });
  }

  nodes.forEach((n) => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
  });
  dist[startId] = 0;

  while (queue.size > 0) {
    let u: string | null = null;
    let minD = Infinity;
    queue.forEach((n) => {
      if (dist[n] < minD) {
        minD = dist[n];
        u = n;
      }
    });

    if (u === null) break;
    if (u === endId) break;

    queue.delete(u);

    const neighbors = edges.filter(
      (e) => !e.blocked && (e.source === u || e.target === u),
    );

    neighbors.forEach((e) => {
      const v = e.source === u ? e.target : e.source;
      if (!queue.has(v)) return;

      if (hazardousNodes.has(v) && v !== startId && v !== endId) {
        return;
      }

      const alt = dist[u!] + e.distance;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u!;
      }
    });
  }

  if (dist[endId] === Infinity) return null;

  const path = [];
  let curr: string | null = endId;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev[curr];
  }

  return { path, distance: dist[endId] };
}

export default function Evacuation() {
  const [searchParams] = useSearchParams();
  const initialBuilding = searchParams.get("building");

  const {
    buildings,
    assemblyPoints,
    campusEdges,
    toggleEdgeBlock,
    incidents,
    addAuditLog
  } = useDemo();

  const allNodes = useMemo(() => [...buildings, ...assemblyPoints], [buildings, assemblyPoints]);

  const [startNodeId, setStartNodeId] = useState<string>(
    initialBuilding || buildings[0]?.id || ""
  );
  const [endNodeId, setEndNodeId] = useState<string>(
    assemblyPoints[0]?.id || ""
  );
  const [avoidHazards, setAvoidHazards] = useState(true);
  const [isBroadcasted, setIsBroadcasted] = useState(false);

  // Compute primary shortest route
  const primaryRoute = useMemo(() => {
    return calculatePath(
      startNodeId,
      endNodeId,
      campusEdges,
      allNodes,
      avoidHazards,
      incidents,
    );
  }, [startNodeId, endNodeId, campusEdges, allNodes, avoidHazards, incidents]);

  const startNode = allNodes.find((n) => n.id === startNodeId);
  const endNode = allNodes.find((n) => n.id === endNodeId);

  // Estimated walk time (assume 80 meters/minute pace for emergency crowds)
  const estTimeMinutes = primaryRoute
    ? Math.max(1, Math.round(primaryRoute.distance / 75))
    : 0;

  const handleBroadcastCorridor = () => {
    setIsBroadcasted(true);
    addAuditLog({
      action: "evacuation_corridor_authorized",
      details: `Authorized evacuation corridor from ${startNode?.name} to ${endNode?.name} (${primaryRoute?.distance}m, ${estTimeMinutes} min)`,
    });
    setTimeout(() => setIsBroadcasted(false), 4000);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1.5">
              <Compass size={12} className="text-brand-600" />
              Dynamic Spatial Routing
            </span>
            <span className="text-xs text-slate-500 font-medium">Dijkstra Corridor & Graph Solver</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Campus Evacuation Corridor Planner
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Computes accessible, obstacle-free evacuation corridors around verified hazard zones and structural blockages.
          </p>
        </div>

        {primaryRoute && (
          <button
            onClick={handleBroadcastCorridor}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Radio size={14} className={isBroadcasted ? "animate-pulse" : ""} />
            <span>{isBroadcasted ? "Broadcast Dispatched!" : "Authorize Corridor Broadcast"}</span>
          </button>
        )}
      </div>

      {/* Corridor Controls & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Origin Selector */}
        <div className="light-card p-4 space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <BuildingIcon size={12} className="text-slate-400" />
            <span>Evacuation Origin</span>
          </label>
          <select
            value={startNodeId}
            onChange={(e) => setStartNodeId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code || b.id})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Assembly Point */}
        <div className="light-card p-4 space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <MapPin size={12} className="text-emerald-600" />
            <span>Target Assembly Point</span>
          </label>
          <select
            value={endNodeId}
            onChange={(e) => setEndNodeId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
          >
            {assemblyPoints.map((ap) => (
              <option key={ap.id} value={ap.id}>
                {ap.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Hazard Check */}
        <div className="light-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Hazard Avoidance</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {avoidHazards ? "Active (Safe Corridors)" : "Bypass (Direct Path)"}
            </div>
          </div>
          <button
            onClick={() => setAvoidHazards(!avoidHazards)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              avoidHazards
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {avoidHazards ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Route Stats Card */}
        <div className="light-card p-4 bg-brand-50/40 border-brand-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-brand-700">Calculated Transit</div>
            <div className="text-base font-black text-brand-900 mt-0.5 flex items-center gap-2">
              <span>{primaryRoute ? `${primaryRoute.distance} m` : "Blocked"}</span>
              {primaryRoute && <span className="text-xs font-semibold text-brand-600">~{estTimeMinutes} min</span>}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <RouteIcon size={18} />
          </div>
        </div>
      </div>

      {/* Main Graph Visualization & Corridor Turn-by-Turn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Campus Graph Canvas */}
        <div className="lg:col-span-8 light-card p-4 space-y-3 flex flex-col">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Campus Walkway Graph & Corridor Geometry</span>
            </div>
            <span className="text-[11px] text-slate-500">Click any edge line to toggle blockage</span>
          </div>

          <div className="relative w-full h-[520px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 900 550" className="w-full h-full select-none">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3978F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>

              {/* Walkway Edges */}
              {campusEdges.map((edge, idx) => {
                const src = allNodes.find((n) => n.id === edge.source);
                const tgt = allNodes.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;

                const srcX = (src as any).coordinates?.x || 100;
                const srcY = (src as any).coordinates?.y || 100;
                const tgtX = (tgt as any).coordinates?.x || 200;
                const tgtY = (tgt as any).coordinates?.y || 200;

                // Is edge part of computed path?
                const isPathEdge =
                  primaryRoute &&
                  primaryRoute.path.some((nodeId, i) => {
                    const nextId = primaryRoute.path[i + 1];
                    return (
                      (nodeId === edge.source && nextId === edge.target) ||
                      (nodeId === edge.target && nextId === edge.source)
                    );
                  });

                return (
                  <g
                    key={`edge-${idx}`}
                    onClick={() => toggleEdgeBlock(edge.id)}
                    className="cursor-pointer group"
                  >
                    <line
                      x1={srcX + 50}
                      y1={srcY + 30}
                      x2={tgtX + 50}
                      y2={tgtY + 30}
                      stroke={
                        edge.blocked
                          ? "#DC2626"
                          : isPathEdge
                          ? "#3978F6"
                          : "#CBD5E1"
                      }
                      strokeWidth={isPathEdge ? "6" : edge.blocked ? "3" : "2"}
                      strokeDasharray={edge.blocked ? "6,4" : isPathEdge ? "none" : "3,3"}
                      strokeLinecap="round"
                      className="transition-all duration-200"
                    />
                    {/* Distance label pill */}
                    <circle
                      cx={(srcX + tgtX) / 2 + 50}
                      cy={(srcY + tgtY) / 2 + 30}
                      r="12"
                      fill={edge.blocked ? "#FEE2E2" : "#FFFFFF"}
                      stroke={edge.blocked ? "#DC2626" : "#E2E8F0"}
                      strokeWidth="1"
                    />
                    <text
                      x={(srcX + tgtX) / 2 + 50}
                      y={(srcY + tgtY) / 2 + 34}
                      textAnchor="middle"
                      fill={edge.blocked ? "#DC2626" : "#64748B"}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {edge.blocked ? "X" : `${edge.distance}m`}
                    </text>
                  </g>
                );
              })}

              {/* Graph Nodes */}
              {allNodes.map((node) => {
                const isStart = node.id === startNodeId;
                const isEnd = node.id === endNodeId;
                const isInPath = primaryRoute?.path.includes(node.id);
                const isAssembly = node.id.startsWith("AP");
                const posX = (node as any).coordinates?.x || 100;
                const posY = (node as any).coordinates?.y || 100;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${posX}, ${posY})`}
                    onClick={() => {
                      if (isAssembly) setEndNodeId(node.id);
                      else setStartNodeId(node.id);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="100"
                      height="60"
                      rx="8"
                      fill={
                        isStart
                          ? "#EFF6FF"
                          : isEnd
                          ? "#ECFDF5"
                          : isInPath
                          ? "#F8FAFC"
                          : "#FFFFFF"
                      }
                      stroke={
                        isStart
                          ? "#3978F6"
                          : isEnd
                          ? "#10B981"
                          : isInPath
                          ? "#3978F6"
                          : "#CBD5E1"
                      }
                      strokeWidth={isStart || isEnd ? "2.5" : isInPath ? "2" : "1"}
                      className="transition-all duration-200"
                    />
                    <text
                      x="10"
                      y="22"
                      fill={isStart ? "#1D4ED8" : isEnd ? "#047857" : "#0F172A"}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {(node as any).code || node.name}
                    </text>
                    <text
                      x="10"
                      y="38"
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="sans-serif"
                    >
                      {isAssembly ? "Safe Zone" : `${(node as any).currentOccupancy || 0} Occupants`}
                    </text>
                    {isStart && (
                      <circle cx="85" cy="18" r="5" fill="#3978F6" />
                    )}
                    {isEnd && (
                      <circle cx="85" cy="18" r="5" fill="#10B981" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Step-by-Step Guidance & Path Restriction Manager */}
        <div className="lg:col-span-4 space-y-4">
          {/* Step-by-step corridor route */}
          <div className="light-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Evacuation Corridor Waypoints
              </h2>
              <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                {primaryRoute?.path.length || 0} Waypoints
              </span>
            </div>

            {primaryRoute ? (
              <div className="space-y-2">
                {primaryRoute.path.map((nodeId, idx) => {
                  const n = allNodes.find((item) => item.id === nodeId);
                  const isFirst = idx === 0;
                  const isLast = idx === primaryRoute.path.length - 1;

                  return (
                    <div
                      key={nodeId}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                        isFirst
                          ? "bg-blue-50/70 border-blue-200 text-blue-900 font-bold"
                          : isLast
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                            isFirst
                              ? "bg-blue-600 text-white"
                              : isLast
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div>{n?.name || nodeId}</div>
                          <div className="text-[10px] text-slate-500 font-normal font-mono">
                            {isFirst ? "Evacuation Origin" : isLast ? "Safe Assembly Target" : "Transit Node"}
                          </div>
                        </div>
                      </div>
                      {isLast && <CheckCircle2 size={16} className="text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-red-600" />
                  <span>No Direct Corridor Available</span>
                </div>
                <p className="text-[11px] text-red-700">
                  Walkways between the origin and safe zone are blocked or intersected by active hazard boundaries. Unblock corridors or select another assembly point.
                </p>
              </div>
            )}
          </div>

          {/* Corridor Obstacle & Restriction Toggles */}
          <div className="light-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Campus Walkway Blocks ({campusEdges.filter((e) => e.blocked).length} Restricted)
            </h3>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {campusEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-800">
                      {edge.source} ↔ {edge.target}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({edge.distance}m)</span>
                  </div>
                  <button
                    onClick={() => toggleEdgeBlock(edge.id)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                      edge.blocked
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {edge.blocked ? <Lock size={11} /> : <Unlock size={11} />}
                    <span>{edge.blocked ? "Blocked" : "Clear"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
