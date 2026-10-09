import { useState, useMemo } from "react";
import { useDemo } from "../store/demoState";
import {
  ShieldAlert,
  Route,
  ChevronRight,
  XCircle,
} from "lucide-react";

// Simple Dijkstra implementation
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

      // If avoiding hazards, strictly prevent entering a hazardous node unless it's the start/end
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
  const { buildings, assemblyPoints, campusEdges, toggleEdgeBlock, incidents } =
    useDemo();

  const allNodes = [...buildings, ...assemblyPoints];

  const [startNodeId, setStartNodeId] = useState<string>(
    buildings[0]?.id || "",
  );
  const [endNodeId, setEndNodeId] = useState<string>(
    assemblyPoints[0]?.id || "",
  );
  const [avoidHazards, setAvoidHazards] = useState(true);

  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status),
  );

  const routeResult = useMemo(() => {
    if (!startNodeId || !endNodeId) return null;
    return calculatePath(
      startNodeId,
      endNodeId,
      campusEdges,
      allNodes,
      avoidHazards,
      activeIncidents,
    );
  }, [
    startNodeId,
    endNodeId,
    campusEdges,
    allNodes,
    avoidHazards,
    activeIncidents,
  ]);

  const alternativeResult = useMemo(() => {
    if (!startNodeId || !endNodeId || !routeResult) return null;

    // Calculate alternative by temporarily blocking the first edge of the primary route
    if (routeResult.path.length > 1) {
      const u = routeResult.path[0];
      const v = routeResult.path[1];
      const tempEdges = campusEdges.filter((e) => {
        if (
          (e.source === u && e.target === v) ||
          (e.source === v && e.target === u)
        )
          return false;
        return true;
      });
      const alt = calculatePath(
        startNodeId,
        endNodeId,
        tempEdges,
        allNodes,
        avoidHazards,
        activeIncidents,
      );
      // Only return if it actually found a different path
      if (alt && alt.path.join(",") !== routeResult.path.join(",")) return alt;
    }
    return null;
  }, [
    startNodeId,
    endNodeId,
    campusEdges,
    allNodes,
    avoidHazards,
    routeResult,
    activeIncidents,
  ]);

  const getPathEdges = (pathArray: string[]) => {
    const edgesInPath = new Set<string>();
    for (let i = 0; i < pathArray.length - 1; i++) {
      const u = pathArray[i];
      const v = pathArray[i + 1];
      const edge = campusEdges.find(
        (e) =>
          (e.source === u && e.target === v) ||
          (e.source === v && e.target === u),
      );
      if (edge) edgesInPath.add(edge.id);
    }
    return edgesInPath;
  };

  const primaryEdges = routeResult
    ? getPathEdges(routeResult.path)
    : new Set<string>();
  const altEdges = alternativeResult
    ? getPathEdges(alternativeResult.path)
    : new Set<string>();

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Evacuation & Routing
          </h1>
          <p className="text-slate-500 mt-1">
            Plan safe evacuation paths and manage dynamically blocked passages.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        {/* Left Panel: Route Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-panel border border-border rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Route size={18} /> Routing Setup
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Starting Location
                </label>
                <select
                  value={startNodeId}
                  onChange={(e) => setStartNodeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm"
                >
                  <optgroup label="Buildings">
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Destination
                </label>
                <select
                  value={endNodeId}
                  onChange={(e) => setEndNodeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm"
                >
                  <optgroup label="Assembly Points">
                    {assemblyPoints.map((ap) => (
                      <option key={ap.id} value={ap.id}>
                        {ap.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Buildings">
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="hazards"
                  checked={avoidHazards}
                  onChange={(e) => setAvoidHazards(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <label
                  htmlFor="hazards"
                  className="text-sm font-medium text-slate-700"
                >
                  Strictly avoid hazardous buildings
                </label>
              </div>
            </div>
          </div>

          {/* Route Results */}
          <div className="bg-panel border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-slate-50">
              <h2 className="font-semibold text-slate-800">Computed Routes</h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-50">
              {startNodeId === endNodeId ? (
                <div className="text-sm text-slate-500 italic p-4 text-center border border-slate-200 rounded-md bg-white">
                  Origin and destination are the same.
                </div>
              ) : !routeResult ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex flex-col items-center text-center">
                  <XCircle size={32} className="mb-2 opacity-80" />
                  <p className="font-bold mb-1">No Available Route</p>
                  <p className="text-sm">
                    All possible paths are blocked or restricted by hazards.
                    Personnel must shelter in place or wait for rescue.
                  </p>
                </div>
              ) : (
                <>
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                      RECOMMENDED
                    </div>
                    <div className="flex items-center justify-between mb-3 mt-1">
                      <h3 className="font-bold text-green-900">
                        Primary Route
                      </h3>
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        ~{routeResult.distance}m
                      </span>
                    </div>
                    <div className="text-sm text-green-800 mb-3 font-medium">
                      Estimated Travel Time:{" "}
                      {Math.ceil(routeResult.distance / 1.4 / 60)} min
                    </div>
                    <div className="bg-white rounded border border-green-100 p-2 max-h-32 overflow-y-auto">
                      {routeResult.path.map((nodeId, idx) => {
                        const node = allNodes.find((n) => n.id === nodeId);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-slate-700 py-1"
                          >
                            {idx > 0 && (
                              <ChevronRight
                                size={12}
                                className="text-slate-300"
                              />
                            )}
                            <span
                              className={
                                idx === 0 || idx === routeResult.path.length - 1
                                  ? "font-bold text-slate-900"
                                  : ""
                              }
                            >
                              {node?.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs text-green-700 flex gap-2 items-start">
                      <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
                      <span>
                        {avoidHazards
                          ? "Avoids known high-severity incident zones."
                          : "Proceeds regardless of hazards."}
                      </span>
                    </div>
                  </div>

                  {alternativeResult && (
                    <div className="border border-slate-200 bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-700">
                          Alternative Route
                        </h3>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          ~{alternativeResult.distance}m
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded border border-slate-100 p-2 max-h-32 overflow-y-auto">
                        {alternativeResult.path.map((nodeId, idx) => {
                          const node = allNodes.find((n) => n.id === nodeId);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-slate-700 py-1"
                            >
                              {idx > 0 && (
                                <ChevronRight
                                  size={12}
                                  className="text-slate-300"
                                />
                              )}
                              <span>{node?.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="text-[10px] text-slate-400 text-center uppercase tracking-widest pt-2">
                Simulated Demonstration Logic
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Map & Graph */}
        <div className="w-full lg:w-2/3 bg-panel border border-border rounded-lg shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-md shadow-sm text-xs">
            <h4 className="font-bold mb-2">Network Editor</h4>
            <p className="text-slate-500 mb-2 italic max-w-[200px]">
              Click any passage line to toggle blocked status.
            </p>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-1 bg-slate-300"></div> Passage (Clear)
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-1 bg-red-500"></div> Passage (Blocked)
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-1 bg-green-500 border border-green-700"></div>{" "}
              Primary Route
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-1 bg-blue-300 border border-blue-500 border-dashed"></div>{" "}
              Alternative
            </div>
          </div>

          <div className="flex-1 w-full h-full relative pattern-grid">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full overflow-visible p-8"
            >
              {/* Edges */}
              {campusEdges.map((edge) => {
                const s = allNodes.find((n) => n.id === edge.source);
                const t = allNodes.find((n) => n.id === edge.target);
                if (!s || !t) return null;

                // @ts-ignore
                const sx = s.coordinates ? s.coordinates.x : s.x; // Buildings vs Assembly logic in DemoState
                // @ts-ignore
                const sy = s.coordinates ? s.coordinates.y : s.y;
                // @ts-ignore
                const tx = t.coordinates ? t.coordinates.x : t.x;
                // @ts-ignore
                const ty = t.coordinates ? t.coordinates.y : t.y;

                const isPrimary = primaryEdges.has(edge.id);
                const isAlt = altEdges.has(edge.id);

                return (
                  <g
                    key={edge.id}
                    className="cursor-pointer"
                    onClick={() => toggleEdgeBlock(edge.id)}
                  >
                    {/* Hitbox */}
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke="transparent"
                      strokeWidth="6"
                    />

                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      className={`transition-all ${
                        edge.blocked
                          ? "stroke-red-500 stroke-[1.5] opacity-80"
                          : isPrimary
                            ? "stroke-green-500 stroke-[2] opacity-100"
                            : isAlt
                              ? "stroke-blue-400 stroke-[1.5] stroke-dashed opacity-80"
                              : "stroke-slate-300 stroke-[1] hover:stroke-slate-400"
                      }`}
                      strokeDasharray={isAlt && !isPrimary ? "2 1" : ""}
                    />
                    {edge.blocked && (
                      <circle
                        cx={(sx + tx) / 2}
                        cy={(sy + ty) / 2}
                        r="1.5"
                        fill="#EF4444"
                      />
                    )}
                    {edge.blocked && (
                      <text
                        x={(sx + tx) / 2}
                        y={(sy + ty) / 2 + 0.5}
                        fontSize="1.5"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        x
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes (Assembly Points & Buildings) */}
              {allNodes.map((node) => {
                // @ts-ignore
                const isAP = !!node.name.includes("Assembly");
                // @ts-ignore
                const cx = node.coordinates ? node.coordinates.x : node.x;
                // @ts-ignore
                const cy = node.coordinates ? node.coordinates.y : node.y;

                const isStart = node.id === startNodeId;
                const isEnd = node.id === endNodeId;

                const hasActiveIncident = incidents.some(
                  (i) =>
                    i.buildingId === node.id &&
                    (i.severity === "high" || i.severity === "critical") &&
                    !["resolved", "closed"].includes(i.status),
                );
                const isHazardous = avoidHazards && hasActiveIncident;

                return (
                  <g key={node.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isStart || isEnd ? 3 : isAP ? 2.5 : 2}
                      className={`${
                        isStart
                          ? "fill-blue-500 stroke-blue-700"
                          : isEnd
                            ? "fill-green-500 stroke-green-700"
                            : isAP
                              ? "fill-emerald-100 stroke-emerald-500"
                              : isHazardous
                                ? "fill-red-500 stroke-red-700 animate-pulse"
                                : "fill-slate-100 stroke-slate-400"
                      } stroke-[0.5]`}
                    />

                    {isHazardous && (
                      <text
                        x={cx}
                        y={cy + 0.5}
                        fontSize="1.5"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        !
                      </text>
                    )}

                    <text
                      x={cx}
                      y={cy + (isAP ? 4 : -3)}
                      fontSize="1.8"
                      textAnchor="middle"
                      fill="#334155"
                      fontWeight={isStart || isEnd ? "bold" : "normal"}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
