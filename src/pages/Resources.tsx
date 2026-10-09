import { useState } from "react";
import { useDemo, type Resource } from "../store/demoState";
import {
  Box,
  Search,
  Wrench,
  CheckCircle,
  Filter,
  AlertTriangle,
} from "lucide-react";

export default function Resources() {
  const { resources, updateResource } = useDemo();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = Array.from(new Set(resources.map((r) => r.type)));

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
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
    const qtyToAssign = 1; // Simplify for demo
    if (window.confirm(`Assign ${qtyToAssign} of ${resource.name}?`)) {
      updateResource(resource.id, {
        availableQuantity: resource.availableQuantity - qtyToAssign,
        assignedQuantity: resource.assignedQuantity + qtyToAssign,
      });
    }
  };

  const handleReturn = (resource: Resource) => {
    if (resource.assignedQuantity <= 0) return;
    const qtyToReturn = 1; // Simplify for demo
    if (window.confirm(`Return ${qtyToReturn} of ${resource.name}?`)) {
      updateResource(resource.id, {
        availableQuantity: resource.availableQuantity + qtyToReturn,
        assignedQuantity: resource.assignedQuantity - qtyToReturn,
      });
    }
  };

  const handleMaintenance = (resource: Resource) => {
    if (resource.availableQuantity <= 0) return;
    const qtyToMaint = 1; // Simplify for demo
    if (
      window.confirm(`Move ${qtyToMaint} of ${resource.name} to maintenance?`)
    ) {
      updateResource(resource.id, {
        availableQuantity: resource.availableQuantity - qtyToMaint,
        maintenanceQuantity: resource.maintenanceQuantity + qtyToMaint,
        condition: "fair",
      });
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Emergency Resources
          </h1>
          <p className="text-slate-500 mt-1">
            Manage and allocate campus emergency inventory.
          </p>
        </div>
        <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
          Add Resource
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-panel border border-border rounded-lg shadow-sm p-4 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 uppercase">
            Total Inventory
          </span>
          <span className="text-3xl font-bold text-slate-900 mt-1">
            {totals.registered}
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-4 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" /> Available
          </span>
          <span className="text-3xl font-bold text-green-600 mt-1">
            {totals.available}
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-4 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
            <Box size={16} className="text-blue-500" /> Assigned
          </span>
          <span className="text-3xl font-bold text-blue-600 mt-1">
            {totals.assigned}
          </span>
        </div>
        <div className="bg-panel border border-border rounded-lg shadow-sm p-4 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
            <Wrench size={16} className="text-orange-500" /> In Maintenance
          </span>
          <span className="text-3xl font-bold text-orange-600 mt-1">
            {totals.maintenance}
          </span>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-slate-50">
          <div className="flex gap-3">
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search inventory..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                className="pl-9 pr-8 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-border z-10">
              <tr>
                <th className="px-6 py-3 font-semibold">Resource Details</th>
                <th className="px-6 py-3 font-semibold">Location</th>
                <th className="px-6 py-3 font-semibold text-center">
                  Available
                </th>
                <th className="px-6 py-3 font-semibold text-center">
                  Assigned
                </th>
                <th className="px-6 py-3 font-semibold text-center">Maint.</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => {
                  const availabilityRatio =
                    resource.availableQuantity / resource.totalQuantity;
                  const isLow = availabilityRatio < 0.2;

                  return (
                    <tr
                      key={resource.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {resource.name}
                        </div>
                        <div className="text-slate-500 text-xs mt-1 flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1 rounded">
                            {resource.id}
                          </span>
                          <span>•</span>
                          <span>{resource.type}</span>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              resource.condition === "good"
                                ? "text-green-600"
                                : resource.condition === "fair"
                                  ? "text-orange-500"
                                  : "text-red-500"
                            }`}
                          >
                            {resource.condition.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {resource.location}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-lg font-bold ${isLow ? "text-red-600" : "text-slate-900"}`}
                          >
                            {resource.availableQuantity}
                          </span>
                          {isLow && (
                            <span className="text-[10px] uppercase font-bold text-red-500 flex items-center gap-1">
                              <AlertTriangle size={10} /> Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-blue-600">
                          {resource.assignedQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-orange-600">
                          {resource.maintenanceQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={resource.availableQuantity <= 0}
                            onClick={() => handleAssign(resource)}
                            className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 disabled:opacity-50 transition-colors"
                          >
                            Assign
                          </button>
                          <button
                            disabled={resource.assignedQuantity <= 0}
                            onClick={() => handleReturn(resource)}
                            className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded border border-green-200 disabled:opacity-50 transition-colors"
                          >
                            Return
                          </button>
                          <button
                            disabled={resource.availableQuantity <= 0}
                            onClick={() => handleMaintenance(resource)}
                            className="text-slate-400 hover:text-orange-500 p-1 rounded transition-colors"
                            title="Move to Maintenance"
                          >
                            <Wrench size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No resources match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
