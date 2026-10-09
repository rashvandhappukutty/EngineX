import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDemo } from "../store/demoState";
import {
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  Phone,
  Flame,
  CheckCircle2
} from "lucide-react";

const formSchema = z.object({
  category: z.string().min(1, "Please select an incident category"),
  buildingId: z.string().min(1, "Please select a campus building"),
  locationDetails: z
    .string()
    .min(2, "Please provide specific room or sector details"),
  severity: z.enum(["low", "medium", "high", "critical"], {
    message: "Please select a severity level",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  peopleAffected: z.any().optional(),
  reporterName: z.string().min(2, "Reporter name is required"),
  reporterContact: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReportEmergency() {
  const [searchParams] = useSearchParams();
  const initialBuilding = searchParams.get("building") || "";

  const { buildings, addIncident, currentUser } = useDemo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "fire",
      buildingId: initialBuilding,
      severity: "high",
      description: "",
      locationDetails: "",
      reporterName: currentUser?.name || "Campus Duty Officer",
      reporterContact: "+91 98765 43210",
      peopleAffected: 0,
    },
  });

  const watchDesc = watch("description");
  const watchCategory = watch("category");
  const watchSeverity = watch("severity");

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const selectedBld = buildings.find((b) => b.id === data.buildingId);
      const inc = await addIncident({
        title: `${data.category.toUpperCase()} Emergency - ${selectedBld?.name || data.locationDetails}`,
        type: data.category,
        category: data.category,
        buildingId: data.buildingId,
        location: `${selectedBld?.name || "Campus Building"}, ${data.locationDetails}`,
        locationDetails: data.locationDetails,
        severity: data.severity,
        status: "reported",
        description: data.description,
        peopleAffected: data.peopleAffected ? Number(data.peopleAffected) : 0,
        reporterName: data.reporterName,
        reporterContact: data.reporterContact,
      });

      setCreatedIncidentId(inc.id);
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && createdIncidentId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="light-card p-8 text-center space-y-6 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
              {createdIncidentId}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              Emergency Broadcast Dispatched
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Incident has been recorded in the central database, AI threat evaluation initiated, and notification sirens sent to command operators.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-around">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Severity</div>
              <div className="font-bold text-critical uppercase mt-0.5">{watchSeverity}</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
              <div className="font-bold text-blue-600 mt-0.5">Triage Active</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">AI Evaluation</div>
              <div className="font-bold text-ai-600 mt-0.5 flex items-center gap-1">
                <Sparkles size={12} />
                <span>Synchronized</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to={`/incidents/${createdIncidentId}`}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition"
            >
              <span>View Incident Dossier</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/command-center"
              className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition"
            >
              <span>Return to Command Center</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="light-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-critical bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-critical" />
            Emergency Intake Portal
          </span>
          <span className="text-xs text-slate-500 font-medium">Rapid Incident Broadcast</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Report Campus Emergency
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Submit crisis reports with location telemetry. The EngineX AI engine will immediately extract threat vectors and notify response teams.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-8 light-card p-6 space-y-5">
          {/* Incident Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Emergency Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "fire", label: "Fire & Smoke", icon: Flame },
                { id: "medical", label: "Medical", icon: ShieldAlert },
                { id: "hazmat", label: "HazMat / Gas", icon: AlertTriangle },
                { id: "security", label: "Security Threat", icon: ShieldAlert },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setValue("category", item.id)}
                  className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                    watchCategory === item.id
                      ? "bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-400 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <item.icon size={16} className={watchCategory === item.id ? "text-brand-600" : "text-slate-400"} />
                  <span className="text-xs font-bold mt-2">{item.label}</span>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-[11px] text-critical font-medium">{errors.category.message}</p>
            )}
          </div>

          {/* Severity Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assessed Severity Tier *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "critical", label: "Critical", desc: "Life Threat / Evac" },
                { id: "high", label: "High", desc: "Immediate Dispatch" },
                { id: "medium", label: "Medium", desc: "Containment Needed" },
                { id: "low", label: "Low", desc: "Advisory / Stable" },
              ].map((sev) => (
                <button
                  type="button"
                  key={sev.id}
                  onClick={() => setValue("severity", sev.id as any)}
                  className={`p-2.5 rounded-lg border text-center transition ${
                    watchSeverity === sev.id
                      ? sev.id === "critical"
                        ? "bg-red-50 border-red-500 text-red-900 ring-2 ring-red-400"
                        : "bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-400"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs font-bold uppercase">{sev.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{sev.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location & Building */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Campus Building *
              </label>
              <select
                {...register("buildingId")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select campus facility...</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code || b.id}) - {b.occupancy} Occupants
                  </option>
                ))}
              </select>
              {errors.buildingId && (
                <p className="text-[11px] text-critical font-medium">{errors.buildingId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Specific Location / Room Details *
              </label>
              <input
                type="text"
                {...register("locationDetails")}
                placeholder="e.g. 2nd Floor, Organic Chemistry Lab 204"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
              />
              {errors.locationDetails && (
                <p className="text-[11px] text-critical font-medium">{errors.locationDetails.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Incident Description & Observed Hazards *</span>
              <span className="text-[10px] text-slate-400 font-mono">{watchDesc?.length || 0} characters</span>
            </label>
            <textarea
              rows={4}
              {...register("description")}
              placeholder="Describe the nature of the emergency, chemical involvement, smoke density, trapped individuals, and immediate risks..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
            />
            {errors.description && (
              <p className="text-[11px] text-critical font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Reporter Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Reporter Name *
              </label>
              <input
                type="text"
                {...register("reporterName")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Contact Phone / Radio Callsign
              </label>
              <input
                type="text"
                {...register("reporterContact")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-critical hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={15} />
              <span>{isSubmitting ? "Dispatching Emergency Broadcast..." : "Broadcast Emergency Incident"}</span>
            </button>
          </div>
        </form>

        {/* Live AI Intake Assistant Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="ai-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-ai-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ai-900">
                Real-Time AI Intake Assistant
              </h3>
            </div>
            <p className="text-xs text-ai-800 leading-relaxed">
              As you type, EngineX evaluates the threat vectors, matches certified campus responders, and maps hazard perimeters.
            </p>

            <div className="p-3.5 bg-white rounded-lg border border-ai-200 text-xs space-y-2">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Threat Anticipation</span>
                <span className="font-mono text-[10px] text-ai-600 font-bold uppercase">{watchSeverity}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {watchDesc && watchDesc.length > 10
                  ? `Synthesizing details for ${watchCategory} incident. Automated safe corridor will prioritize Assembly Point 1.`
                  : "Enter a detailed description to preview AI threat factors and dispatch recommendations."}
              </p>
            </div>
          </div>

          {/* Campus Helpline Notice */}
          <div className="light-card p-5 space-y-2 border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Phone size={13} className="text-brand-600" />
              Direct Emergency Hotlines
            </h4>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Campus Control: <strong className="text-slate-900">+91 98765 43210</strong></div>
              <div>Medical Center: <strong className="text-slate-900">Ext 222</strong></div>
              <div>Fire Station: <strong className="text-slate-900">Ext 101</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
