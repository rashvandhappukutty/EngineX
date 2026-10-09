import { useState } from "react";
import { useDemo, type Resource } from "../store/demoState";
import { StatCard } from "../components/common/StatCard";
import {
  Box,
  Search,
  Wrench,
  Package,
  Layers,
  ArrowUpRight,
  MapPin,
  CheckCircle2
} from "lucide-react";

export default function Resources() {
  const { resources, updateResource, addAuditLog } = useDemo();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = Array.from(new Set(resources.map((r) => r.type)));

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || r.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totals = {
    registered: resources.reduce((acc, r) => acc + r.totalQuantity, 0),
    available: resources.reduce((acc, r) => acc + r.availableQuantity, 0),
    assigned: resources.reduce((acc, r) => acc + r.assignedQuantity, 0),
    maintenance: resources.reduce((acc, r) => acc + r.maintenanceQuantity, 0),
  };

  const handleAssign = (resource: Resource) => {
    if (resource.availableQuantity <= 0) return;
    updateResource(resource.id, {
      availableQuantity: resource.availableQuantity - 1,
      assignedQuantity: resource.assignedQuantity + 1,
    });
    addAuditLog({
      action: "resource_allocated",
      details: `Allocated 1 unit of ${resource.name} (${resource.id})`,
    });
  };

  const handleReturn = (resource: Resource) => {
    if (resource.assignedQuantity <= 0) return;
    updateResource(resource.id, {
      availableQuantity: resource.availableQuantity + 1,
      assignedQuantity: resource.assignedQuantity - 1,
    });
    addAuditLog({
      action: "resource_returned",
      details: `Returned 1 unit of ${resource.name} (${resource.id}) to storage`,
    });
  };

  const handleMaintenance = (resource: Resource) => {
    if (resource.availableQuantity <= 0) return;
    updateResource(resource.id, {
      availableQuantity: resource.availableQuantity - 1,
      maintenanceQuantity: resource.maintenanceQuantity + 1,
      condition: "fair",
    });
    addAuditLog({
      action: "resource_maintenance_flagged",
      details: `Flagged 1 unit of ${resource.name} (${resource.id}) for maintenance`,
    });
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1.5">
              <Package size={12} className="text-brand-600" />
              Logistics & Hardware
            </span>
            <span className="text-xs text-slate-500 font-medium">Campus Emergency Equipment & Medical Stocks</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Emergency Resource & Equipment Inventory
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time stock levels, maintenance states, and staging allocations for fire, medical, HazMat, and communication assets.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 font-mono">
          <Layers size={14} className="text-brand-600" />
          <span>Tracked Stock Units: <strong className="text-slate-900">{totals.registered}</strong></span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered"
          value={totals.registered}
          icon={Layers}
          accent="blue"
          subtitle="Campus emergency inventory"
        />
        <StatCard
          title="Available Stock"
          value={totals.available}
          icon={CheckCircle2}
          accent="green"
          subtitle="Ready for immediate deployment"
        />
        <StatCard
          title="Active Deployments"
          value={totals.assigned}
          icon={ArrowUpRight}
          accent="amber"
          subtitle="Assigned to active scenes"
        />
        <StatCard
          title="In Maintenance"
          value={totals.maintenance}
          icon={Wrench}
          accent="red"
          subtitle="Undergoing test or repair"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="light-card p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment, ID, or depot location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition shrink-0 ${
              categoryFilter === "all"
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Types ({resources.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition shrink-0 ${
                categoryFilter === cat
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Inventory Table */}
      <div className="light-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Equipment & Spec</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Storage Depot</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Stock Availability</th>
                <th className="py-3 px-4 text-right">Quick Allocation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Box size={36} className="mx-auto mb-2 text-slate-300" />
                    No equipment matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  const availPct = Math.round((res.availableQuantity / res.totalQuantity) * 100);

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{res.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{res.id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                          {res.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          {res.location}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            res.condition === "good"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : res.condition === "fair"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {res.condition}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                            <span>{res.availableQuantity} / {res.totalQuantity} avail</span>
                            <span>{availPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                availPct < 25 ? "bg-red-500" : availPct < 60 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${availPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAssign(res)}
                            disabled={res.availableQuantity <= 0}
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded text-[11px] transition disabled:opacity-40 border border-brand-200"
                            title="Deploy 1 unit to scene"
                          >
                            + Deploy
                          </button>
                          <button
                            onClick={() => handleReturn(res)}
                            disabled={res.assignedQuantity <= 0}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition disabled:opacity-40 border border-slate-200"
                            title="Return 1 deployed unit"
                          >
                            - Return
                          </button>
                          <button
                            onClick={() => handleMaintenance(res)}
                            disabled={res.availableQuantity <= 0}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition disabled:opacity-40"
                            title="Send to maintenance"
                          >
                            <Wrench size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
