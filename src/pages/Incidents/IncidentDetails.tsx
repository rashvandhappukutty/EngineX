import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDemo } from "../../store/demoState";
import type { IncidentStatus, Severity } from "../../store/demoState";
import {
  ArrowLeft,
  ShieldAlert,
  MessageSquare,
  MapPin,
  Clock,
  Users,
  Activity,
  CheckCircle,
} from "lucide-react";

export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    incidents,
    buildings,
    responders,
    updateIncident,
    addNote,
    currentUser,
  } = useDemo();

  const incident = incidents.find((i) => i.id === id);
  const building = buildings.find((b) => b.id === incident?.buildingId);
  const assignedTeam = responders.find(
    (r) => r.id === incident?.assignedTeamId,
  );

  const [noteText, setNoteText] = useState("");

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold mb-2">Incident Not Found</h2>
        <p className="text-slate-500 mb-4">
          The incident you are looking for does not exist or has been removed.
        </p>
        <Link to="/incidents" className="text-primary hover:underline">
          Back to Incidents
        </Link>
      </div>
    );
  }

  const getSeverityColors = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (newStatus === "resolved" || newStatus === "closed") {
      if (
        !window.confirm(
          `Are you sure you want to mark this incident as ${newStatus}?`,
        )
      )
        return;
    }
    updateIncident(incident.id, { status: newStatus });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote(incident.id, `[${currentUser?.name}] ${noteText}`);
    setNoteText("");
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/incidents")}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-md shadow-sm transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {incident.title}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityColors(incident.severity)}`}
              >
                {incident.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {incident.id}
              </span>
              <span>•</span>
              <span>{incident.type}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={incident.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as IncidentStatus)
            }
            className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="reported">Reported</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors">
            Assign Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-panel border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold border-b border-border pb-3 mb-4">
              Incident Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Location
                  </div>
                  <div className="font-medium text-slate-900">
                    {building?.name || "Unknown Building"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {incident.locationDetails}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Reported
                  </div>
                  <div className="font-medium text-slate-900">
                    {new Date(incident.reportedTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(incident.reportedTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <Users size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Reporter & Impact
                  </div>
                  <div className="font-medium text-slate-900">
                    {incident.reporterName}{" "}
                    {incident.reporterContact &&
                      `(${incident.reporterContact})`}
                  </div>
                  <div className="text-sm text-slate-600">
                    Est. Affected: {incident.peopleAffected || "Unknown"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-500">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Team
                  </div>
                  {assignedTeam ? (
                    <>
                      <div className="font-medium text-slate-900">
                        {assignedTeam.name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {assignedTeam.specialization}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500 italic mt-1">
                      No team assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </div>
              <p className="text-slate-800 bg-slate-50 p-4 rounded-md border border-slate-100 whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-panel border border-border rounded-lg shadow-sm flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-2 font-semibold">
              <MessageSquare size={18} className="text-slate-500" />
              Internal Response Notes
            </div>
            <div className="p-4 flex-1 max-h-64 overflow-y-auto space-y-4 bg-slate-50">
              {incident.notes.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4 italic">
                  No notes added yet.
                </div>
              ) : (
                incident.notes.map((note, __idx) => (
                  <div
                    key={__idx}
                    className="bg-white p-3 rounded border border-slate-200 text-sm shadow-sm"
                  >
                    {note}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border bg-white flex gap-3 items-start">
              <textarea
                className="flex-1 border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                placeholder="Type internal note here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors whitespace-nowrap"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Recommendations */}
        <div className="space-y-6">
          <div className="bg-panel border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Activity size={18} className="text-slate-500" />
                Activity Timeline
              </div>
            </div>
            <div className="p-5">
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {incident.timeline.map((event, __idx) => (
                  <div key={event.id} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></span>
                    <div className="text-xs text-slate-500 mb-1">
                      {new Date(event.time).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-800 font-medium">
                      {event.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-5">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wider">
              Recommended Next Actions
            </h3>
            <ul className="space-y-3">
              {!assignedTeam && (
                <li className="flex items-start gap-2 text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5" />
                  <span>
                    Assign an available response team based on required
                    qualifications.
                  </span>
                </li>
              )}
              {incident.status === "reported" && (
                <li className="flex items-start gap-2 text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5" />
                  <span>
                    Acknowledge the incident and alert building occupants if
                    necessary.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2 text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors">
                <CheckCircle size={16} className="text-blue-500 mt-0.5" />
                <span>
                  Review evacuation routes for{" "}
                  {building?.name || "the building"}.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
