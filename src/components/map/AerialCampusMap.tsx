import { useEffect, useRef } from "react";
import L from "leaflet";
import { Plus, Minus, LocateFixed } from "lucide-react";
import { useDemo } from "../../store/demoState";
import "leaflet/dist/leaflet.css";

// Exact aerial satellite coordinate anchors on the 1536x1024 campus photo
export const AERIAL_BUILDING_COORDS: Record<
  string,
  {
    name: string;
    y: number; // In Leaflet CRS.Simple (0 = bottom, 1024 = top)
    x: number; // 0 = left, 1536 = right
    radius?: number;
    hazardType?: "critical" | "caution" | "zone";
    color?: string;
    defaultOccupancy?: number;
  }
> = {
  B3: {
    name: "Science Block A",
    y: 494,
    x: 250,
    radius: 140,
    hazardType: "critical",
    color: "#F43F5E",
    defaultOccupancy: 148,
  },
  B2: {
    name: "Engineering Block",
    y: 634,
    x: 580,
    radius: 80,
    hazardType: "caution",
    color: "#38BDF8",
    defaultOccupancy: 185,
  },
  B4: {
    name: "Central Library",
    y: 484,
    x: 800,
    radius: 90,
    hazardType: "caution",
    color: "#F59E0B",
    defaultOccupancy: 210,
  },
  B1: {
    name: "Administration",
    y: 734,
    x: 590,
    defaultOccupancy: 62,
  },
  B5: {
    name: "Student Residences",
    y: 864,
    x: 270,
    defaultOccupancy: 320,
  },
  B7: {
    name: "Campus Health Centre",
    y: 474,
    x: 1050,
    defaultOccupancy: 24,
  },
  B9: {
    name: "Athletic Arena & Track",
    y: 790,
    x: 1180,
    defaultOccupancy: 85,
  },
  B6: {
    name: "Humanities Complex",
    y: 710,
    x: 880,
    defaultOccupancy: 140,
  },
  B8: {
    name: "Auditorium",
    y: 310,
    x: 220,
    defaultOccupancy: 95,
  },
  B10: {
    name: "Main Security Gate",
    y: 130,
    x: 740,
    defaultOccupancy: 12,
  },
};

export const AERIAL_ASSEMBLY_COORDS: Record<string, { label: string; y: number; x: number }> = {
  AP1: { label: "A", y: 265, x: 575 },
  AP2: { label: "B", y: 265, x: 960 },
};

interface AerialCampusMapProps {
  selectedBuildingId?: string | null;
  onSelectBuilding?: (id: string) => void;
  showHazards?: boolean;
  showOccupancy?: boolean;
  showAssembly?: boolean;
  showZones?: boolean;
  showRoutes?: boolean;
  activeRouteNodes?: string[];
  className?: string;
  height?: string;
}

export default function AerialCampusMap({
  selectedBuildingId = "B3",
  onSelectBuilding,
  showHazards = true,
  showOccupancy = true,
  showAssembly = true,
  showZones = true,
  showRoutes = true,
  activeRouteNodes,
  className = "",
  height = "100%",
}: AerialCampusMapProps) {
  const { buildings, incidents, setSelectedIncidentId } = useDemo();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map with CRS.Simple on aerial photograph
  useEffect(() => {
    if (!containerRef.current) return;

    const m = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      zoomControl: false,
      minZoom: -1.5,
      maxZoom: 2,
      attributionControl: false,
    });

    // Add high-resolution campus aerial satellite image overlay
    L.imageOverlay("/campus-aerial.jpg", [
      [0, 0],
      [1024, 1536],
    ]).addTo(m);

    // Initial fit view with comfortable padding
    m.fitBounds([
      [0, 0],
      [1024, 1536],
    ]);

    mapRef.current = m;
    layerGroupRef.current = L.layerGroup().addTo(m);

    const resizeObserver = new ResizeObserver(() => m.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      m.remove();
      mapRef.current = null;
    };
  }, []);

  // Synchronize dynamic layers and markers
  useEffect(() => {
    const g = layerGroupRef.current;
    const m = mapRef.current;
    if (!g || !m) return;

    g.clearLayers();

    // 1. Hazard and Perimeter Exclusion Circles
    if (showHazards) {
      Object.entries(AERIAL_BUILDING_COORDS).forEach(([bId, meta]) => {
        if (!meta.radius) return;

        const isCritical = meta.hazardType === "critical";
        const isSelected = selectedBuildingId === bId;

        L.circle([meta.y, meta.x], {
          radius: meta.radius,
          color: meta.color || "#DC2626",
          fillColor: meta.color || "#DC2626",
          fillOpacity: isCritical ? 0.22 : 0.12,
          weight: isSelected ? 3 : 2,
          dashArray: isCritical ? undefined : "6, 6",
        })
          .addTo(g)
          .bindTooltip(
            `<div class="font-bold text-xs">${meta.name}</div><div class="text-[10px] text-slate-300">${isCritical ? "Active Hazard Exclusion Zone" : "Caution / Staging Perimeter"} (${meta.radius}m)</div>`,
            { className: "dark-tooltip", direction: "top" }
          );
      });
    }

    // 2. Optional Evacuation Corridor Route Line
    if (showRoutes && activeRouteNodes && activeRouteNodes.length > 1) {
      const routePoints: L.LatLngExpression[] = activeRouteNodes
        .map((nId) => {
          const b = AERIAL_BUILDING_COORDS[nId];
          if (b) return [b.y, b.x] as L.LatLngExpression;
          const ap = AERIAL_ASSEMBLY_COORDS[nId];
          if (ap) return [ap.y, ap.x] as L.LatLngExpression;
          return null;
        })
        .filter((p): p is L.LatLngExpression => p !== null);

      if (routePoints.length > 1) {
        L.polyline(routePoints, {
          color: "#00F0FF",
          weight: 5,
          opacity: 0.95,
          dashArray: "8, 6",
        })
          .addTo(g)
          .bindTooltip(
            `<b style="color: #00F0FF;">Primary Evacuation Corridor</b><br/><span style="font-size: 10px;">Clear of active hazard perimeters</span>`,
            { className: "dark-tooltip" }
          );

        routePoints.forEach((p, idx) => {
          L.circleMarker(p, {
            radius: idx === 0 || idx === routePoints.length - 1 ? 6 : 4,
            color: "#00F0FF",
            fillColor: "#0F172A",
            fillOpacity: 1,
            weight: 2,
          }).addTo(g);
        });
      }
    }

    // 3. Green Square Assembly Point Pins (A & B)
    if (showAssembly) {
      Object.entries(AERIAL_ASSEMBLY_COORDS).forEach(([_apId, ap]) => {
        const marker = L.marker([ap.y, ap.x], {
          icon: L.divIcon({
            className: "aerial-assembly-pin",
            html: `<span>${ap.label}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(g);

        marker.bindTooltip(
          `<div class="font-bold text-xs text-emerald-400">Assembly Point ${ap.label}</div><div class="text-[10px] text-slate-300">Designated Safe Muster Area</div>`,
          { className: "dark-tooltip", direction: "top" }
        );
      });
    }

    // 4. Dark Floating Pill Building Badges
    Object.entries(AERIAL_BUILDING_COORDS).forEach(([bId, meta]) => {
      const bData = buildings.find((b) => b.id === bId);
      const isSelected = selectedBuildingId === bId;
      const bIncidents = incidents.filter(
        (i) => i.buildingId === bId && !["resolved", "closed"].includes(i.status)
      );
      const hasActiveIncident = bIncidents.length > 0;
      const isCritical = bIncidents.some((i) => i.severity === "critical");

      const dotColor = isCritical
        ? "#F43F5E"
        : hasActiveIncident
        ? "#F59E0B"
        : "#10B981";

      const occupancyCount = meta.defaultOccupancy ?? (bData ? bData.occupancy : 120);
      const displayName = meta.name;

      const markerHtml = `
        <div class="aerial-building-marker ${isSelected ? "selected" : ""}">
          <span class="status-dot" style="background-color: ${dotColor};"></span>
          <span>${displayName}</span>
          ${showOccupancy ? `<span class="occupancy-tag">(${occupancyCount})</span>` : ""}
        </div>
      `;

      const marker = L.marker([meta.y, meta.x], {
        icon: L.divIcon({
          className: "custom-leaflet-aerial-badge",
          html: markerHtml,
          iconSize: [160, 28],
          iconAnchor: [80, 14],
        }),
      }).addTo(g);

      marker.on("click", () => {
        onSelectBuilding?.(bId);
        if (bIncidents.length > 0) {
          setSelectedIncidentId(bIncidents[0].id);
        }
      });

      marker.bindTooltip(
        `
        <div style="padding: 2px;">
          <div style="font-weight: 700; color: #38BDF8; font-size: 11px;">${displayName}</div>
          <div style="color: #94A3B8; font-size: 10px;">Code: ${(bData?.code || bId).toUpperCase()} • Occupancy: ${occupancyCount} / ${bData?.capacity || 500}</div>
          ${hasActiveIncident ? `<div style="color: #F87171; font-weight: 700; font-size: 10px; margin-top: 2px;">Active Incident: ${bIncidents[0].title}</div>` : ""}
        </div>
        `,
        { className: "dark-tooltip", direction: "top" }
      );
    });
  }, [
    buildings,
    incidents,
    selectedBuildingId,
    showHazards,
    showOccupancy,
    showAssembly,
    showZones,
    showRoutes,
    activeRouteNodes,
    onSelectBuilding,
    setSelectedIncidentId,
  ]);

  const handleRecenter = () => {
    mapRef.current?.fitBounds([
      [0, 0],
      [1024, 1536],
    ]);
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-xl border border-slate-700/60 bg-[#090E1B] aerial-map-canvas ${className}`}
      style={{ height }}
    >
      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="w-full h-full" style={{ height: "100%", width: "100%" }} />

      {/* Floating Tactical Bottom-Right Toolbar matching reference screenshot */}
      <div className="absolute bottom-5 right-5 z-[500] flex flex-col items-center gap-2.5">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-xl bg-[#09151E]/90 backdrop-blur-md border border-[#1A384D] text-[#38BDF8] flex items-center justify-center shadow-xl hover:bg-[#0E2333] hover:text-cyan-300 transition-all active:scale-95"
          title="Recenter Map View"
        >
          <LocateFixed size={18} />
        </button>

        <div className="flex flex-col bg-[#09151E]/90 backdrop-blur-md border border-[#1A384D] rounded-xl shadow-xl overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors border-b border-[#1A384D]"
            title="Zoom In"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Zoom Out"
          >
            <Minus size={18} />
          </button>
        </div>
      </div>

      {/* Live Campus Telemetry Badge in bottom-left */}
      <div className="absolute bottom-4 left-4 z-[500] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg flex items-center gap-2 text-[11px] text-slate-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold text-slate-200">EngineX High-Res Aerial GIS</span>
        <span className="text-[10px] text-slate-500 font-mono">1536 × 1024 Orthographic</span>
      </div>
    </div>
  );
}
