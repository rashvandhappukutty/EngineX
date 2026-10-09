import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "../store/demoState";
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  Users,
  Navigation,
  RefreshCw,
} from "lucide-react";

export default function Recommendations() {
  const { incidents, refreshAIAnalysis } = useDemo();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  );

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      for (const inc of activeIncidents) {
        await refreshAIAnalysis(inc.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto space-y-8 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Sparkles className="text-primary" size={28} />
            AI Decision Support & Recommendations
          </h1>
          <p className="text-slate-600 mt-1">
            Aggregated intelligence, crisis actions, and resource matches computed by CampusOne AI.
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          disabled={isRefreshing || activeIncidents.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Evaluating Incidents..." : "Re-evaluate All Incidents"}</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-sm">
        <AlertCircle size={18} className="mt-0.5 text-amber-600 shrink-0" />
        <div>
          <strong className="font-semibold">Human-in-the-Loop Safety Floor Enforced:</strong>{" "}
          All AI recommendations are advisory decision support for emergency coordinators and responders. Physical verification is mandatory before executing high-risk crisis actions.
        </div>
      </div>

      {/* Incident Recommendations Cards */}
      <div className="space-y-6">
        {activeIncidents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Active Incidents</h3>
            <p className="text-sm text-slate-500 mt-1">All campus areas are currently reported safe.</p>
          </div>
        ) : (
          activeIncidents.map((incident) => {
            const ai = incident.aiAnalysis;
            return (
              <div
                key={incident.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
              >
                {/* Card Header */}
                <div className="bg-slate-50 p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${
                        incident.severity === "critical"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : incident.severity === "high"
                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {incident.severity}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{incident.title}</h2>
                    <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {incident.id}
                    </span>
                  </div>

                  <Link
                    to={`/incidents/${incident.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <span>View Detail & Triage</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Card Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Situation Assessment */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-slate-600" />
                      Situation Assessment
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {ai?.risk_assessment?.reasoning_summary || incident.description}
                    </p>
                    {ai?.risk_assessment && (
                      <div className="text-xs text-slate-600">
                        Evaluated Risk Score:{" "}
                        <strong className="text-slate-900 font-bold">
                          {ai.risk_assessment.risk_score}/100
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Recommended Actions */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-600" />
                      Priority Action Items
                    </div>
                    <ul className="space-y-2">
                      {ai?.recommended_actions && ai.recommended_actions.length > 0 ? (
                        ai.recommended_actions.slice(0, 3).map((act, idx) => {
                          const actionTitle = typeof act === "string" ? act : act.action;
                          return (
                            <li
                              key={idx}
                              className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 font-medium flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                              <span>{actionTitle}</span>
                            </li>
                          );
                        })
                      ) : (
                        <li className="text-xs text-slate-500 italic">No automated actions listed.</li>
                      )}
                    </ul>
                  </div>

                  {/* Right Column: Matched Response Team & Evacuation */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                        <Users size={14} className="text-indigo-600" />
                        AI Matched Response Unit
                      </div>
                      {ai?.resource_recommendations && ai.resource_recommendations.length > 0 ? (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs">
                          <div className="font-bold text-indigo-950">
                            {ai.resource_recommendations[0].team_name || ai.resource_recommendations[0].name}
                          </div>
                          <div className="text-indigo-700 mt-0.5">
                            {ai.resource_recommendations[0].rationale}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">No team match found.</div>
                      )}
                    </div>

                    {ai?.evacuation_recommendation && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                          <Navigation size={14} className="text-emerald-600" />
                          Evacuation Status
                        </div>
                        <div className="text-xs text-slate-700 font-medium">
                          {ai.evacuation_recommendation.safe_zone
                            ? `Assemble at: ${ai.evacuation_recommendation.safe_zone}`
                            : `Status: ${ai.evacuation_recommendation.status}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
