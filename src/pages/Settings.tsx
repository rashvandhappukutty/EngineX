import { useState } from "react";
import { useDemo } from "../store/demoState";
import {
  Settings as SettingsIcon,
  Building,
  ShieldAlert,
  Users,
  Box,
  Bell,
  Database,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

export default function Settings() {
  const { resetDemoData } = useDemo();
  const [activeTab, setActiveTab] = useState("campus");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          System Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Configure campus profiles, response teams, and notification
          preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[600px]">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-white border border-border rounded-lg shadow-sm overflow-hidden flex flex-col self-start">
          <button
            onClick={() => setActiveTab("campus")}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border transition-colors ${activeTab === "campus" ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
          >
            <Building size={18} /> Campus Profile
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border transition-colors ${activeTab === "incidents" ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
          >
            <ShieldAlert size={18} /> Incident Categories
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border transition-colors ${activeTab === "teams" ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
          >
            <Users size={18} /> Response Teams
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border transition-colors ${activeTab === "resources" ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
          >
            <Box size={18} /> Resource Settings
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border transition-colors ${activeTab === "notifications" ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
          >
            <Bell size={18} /> Notifications
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "data" ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
          >
            <Database size={18} /> System Data
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-border rounded-lg shadow-sm">
          <form onSubmit={handleSave} className="h-full flex flex-col">
            <div className="p-6 border-b border-border flex-1">
              {/* Campus Profile Tab */}
              {activeTab === "campus" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                    Campus Profile
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Institution Name
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary"
                        defaultValue="NEXUS University"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Campus ID
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 cursor-not-allowed"
                        defaultValue="CMP-8842-NEX"
                        disabled
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Primary Emergency Contact Number
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary"
                        defaultValue="+1 (555) 019-9911"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Timezone
                      </label>
                      <select className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary">
                        <option>America/New_York</option>
                        <option>America/Chicago</option>
                        <option>America/Los_Angeles</option>
                        <option>UTC</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Data/Reset Tab */}
              {activeTab === "data" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                    Data Management
                  </h2>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                    <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                      <RotateCcw size={18} /> Reset Demo Data
                    </h3>
                    <p className="text-sm text-red-700 mb-4">
                      This will restore all incidents, responders, resources,
                      alerts, and map configurations to their original hackathon
                      prototype state. This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={resetDemoData}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold shadow-sm transition-colors text-sm"
                    >
                      Reset All Data
                    </button>
                  </div>
                </div>
              )}

              {/* Placeholder for other tabs to show it's a prototype */}
              {["incidents", "teams", "resources", "notifications"].includes(
                activeTab,
              ) && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <SettingsIcon size={48} className="text-slate-300 mb-4" />
                  <p className="font-semibold text-lg text-slate-700">
                    Configuration Section Placeholder
                  </p>
                  <p className="text-sm max-w-sm text-center mt-2">
                    In a production environment, this section would allow
                    administrators to define dynamic enumerations and
                    preferences.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-border flex justify-between items-center">
              <div>
                {saved && (
                  <span className="flex items-center gap-2 text-green-600 font-medium text-sm animate-in fade-in">
                    <CheckCircle size={16} /> Settings saved successfully
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
