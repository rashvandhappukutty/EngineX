import { useState } from "react";
import { useDemo } from "../store/demoState";
import {
  Building,
  Database,
  RotateCcw,
  Cpu,
  Save,
  CheckCircle2,
  Sliders
} from "lucide-react";

export default function Settings() {
  const { resetDemoData, addAuditLog } = useDemo();
  const [activeTab, setActiveTab] = useState("campus");
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    addAuditLog({
      action: "settings_updated",
      details: "Updated operational system configuration and AI thresholds",
    });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    resetDemoData();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 3000);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1.5">
              <Sliders size={12} className="text-brand-600" />
              Configuration
            </span>
            <span className="text-xs text-slate-500 font-medium">Platform Parameters & AI Safety Thresholds</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System & Command Settings
          </h1>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-60 light-card p-2 overflow-hidden flex flex-col self-start space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab("campus")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition text-left ${
              activeTab === "campus"
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Building size={15} /> Campus Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition text-left ${
              activeTab === "ai"
                ? "bg-ai-50 text-ai-700 border border-ai-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Cpu size={15} /> AI Model & Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition text-left ${
              activeTab === "data"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Database size={15} /> Reset Telemetry Store
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 light-card flex flex-col">
          <form onSubmit={handleSave} className="h-full flex flex-col">
            <div className="p-6 flex-1 space-y-6">
              {/* Campus Profile Tab */}
              {activeTab === "campus" && (
                <div className="space-y-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Building size={16} className="text-brand-600" />
                    Campus Organization Profile
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Campus Institution Name
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
                        defaultValue="ENGINE X Central Smart Campus"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Installation Cluster ID
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-400 font-mono"
                        defaultValue="SASURIE-MAIN-NODE-01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Primary Emergency Dispatch Phone
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-400 font-mono"
                        defaultValue="+91 (0421) 222-1111"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Geographic Reference Datum
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-400 font-mono"
                        defaultValue="11.1085° N, 77.3411° E (WGS 84)"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Engine Parameters Tab */}
              {activeTab === "ai" && (
                <div className="space-y-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Cpu size={16} className="text-ai-600" />
                    AI Reasoning & Inference Thresholds
                  </h2>

                  <div className="p-4 bg-ai-50/60 rounded-xl border border-ai-200 text-xs text-ai-900 space-y-1">
                    <div className="font-bold">Dual-Tier AI Architecture Active</div>
                    <p className="text-[11px] text-ai-800">
                      High-level situation analysis is driven by Google Gemini 2.5 Flash via FastAPI backend, with autonomous safety fallback to the local deterministic rule engine.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Minimum Candidate Match Score Threshold
                      </label>
                      <input
                        type="number"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                        defaultValue="40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Evacuation Walking Speed Assumption (meters/min)
                      </label>
                      <input
                        type="number"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                        defaultValue="75"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Telemetry Store Tab */}
              {activeTab === "data" && (
                <div className="space-y-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-red-700 border-b border-red-100 pb-3 flex items-center gap-2">
                    <Database size={16} className="text-red-600" />
                    Reset Shared Telemetry Database
                  </h2>

                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-2">
                    <div className="font-bold">Caution: Reset Demonstration Data</div>
                    <p className="text-[11px] text-red-800">
                      This will reinitialize all campus building occupancy levels, active emergency reports, responder duty states, and walkway blockage graphs to the factory demonstration baseline.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 bg-critical hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2"
                  >
                    <RotateCcw size={14} />
                    <span>Re-initialize All Data Store</span>
                  </button>

                  {resetConfirm && (
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Data store restored to baseline successfully!</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Save Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
