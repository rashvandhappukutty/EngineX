import { useDemo } from "../store/demoState";
import { UserCheck, Shield, Phone, MapPin, Award } from "lucide-react";

export default function Users() {
  const { responders, currentUser } = useDemo();

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200 flex items-center gap-1.5">
              <Shield size={12} className="text-brand-600" />
              Personnel Directory
            </span>
            <span className="text-xs text-slate-500 font-medium">Crisis Command Personnel & Response Units</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Command & Response Roster
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 font-mono">
          <UserCheck size={14} className="text-emerald-600" />
          <span>Active Operator: <strong className="text-slate-900">{currentUser?.name || "Commander"}</strong> ({currentUser?.role})</span>
        </div>
      </div>

      {/* Responder Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responders.map((responder) => (
          <div key={responder.id} className="light-card p-5 space-y-4 hover:border-slate-300 transition">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{responder.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{responder.specialization} Unit • {responder.id}</p>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  responder.status === "available"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {responder.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <MapPin size={12} className="text-slate-400" />
                  Staging Depot:
                </span>
                <span className="text-slate-900 font-medium">{responder.baseLocation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone size={12} className="text-slate-400" />
                  Radio / Phone:
                </span>
                <span className="text-slate-900 font-mono">{responder.contactNumber}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Award size={11} />
                <span>Certified Qualifications</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {responder.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
