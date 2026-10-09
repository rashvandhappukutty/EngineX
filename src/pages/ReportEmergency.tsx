import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDemo } from "../store/demoState";
import { AlertTriangle, UploadCloud, CheckCircle } from "lucide-react";

const formSchema = z.object({
  type: z.string().min(1, "Please select an incident type"),
  buildingId: z.string().min(1, "Please select a building"),
  locationDetails: z
    .string()
    .min(5, "Please provide more specific location details"),
  severity: z.enum(["low", "medium", "high", "critical"], {
    message: "Please select a severity level",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  peopleAffected: z.any().optional(),reporterName: z.string().min(2, "Name is required"),
  reporterContact: z.string().optional(),
});

interface FormValues {
  type: string;
  buildingId: string;
  locationDetails: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  reporterName: string;
  reporterContact?: string;
  peopleAffected?: number;
}

export default function ReportEmergency() {
  const navigate = useNavigate();
  const { buildings, addIncident } = useDemo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);
  const [createdIncidentScore, setCreatedIncidentScore] = useState<number | null>(null);
  const [createdIncidentPriority, setCreatedIncidentPriority] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      buildingId: "",
      severity: "high",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const inc = await addIncident({
        title: `${data.type} Report`,
        type: data.type,
        buildingId: data.buildingId,
        locationDetails: data.locationDetails,
        severity: data.severity,
        status: "reported",
        description: data.description,
        peopleAffected: data.peopleAffected as number | undefined,
        reporterName: data.reporterName,
        reporterContact: data.reporterContact,
      });
      setCreatedIncidentId(inc.id);
      if (inc.aiAnalysis?.risk_assessment) {
        setCreatedIncidentScore(inc.aiAnalysis.risk_assessment.risk_score);
        setCreatedIncidentPriority(inc.aiAnalysis.risk_assessment.priority);
      }
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 border-4 border-green-50 shadow-sm">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Emergency Reported
        </h2>
        <p className="text-base text-slate-600 mb-6">
          The incident has been logged and the Emergency Coordinator has received the alert.
        </p>

        {createdIncidentPriority && (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                CampusOne AI Live Triage
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                AI PRIORITY: {createdIncidentPriority.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-700">
              Evaluated with Risk Score <strong>{createdIncidentScore}/100</strong>. Automated responder resource matching and evacuation analysis have been delivered to the Emergency Coordinator.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {createdIncidentId && (
            <button
              onClick={() => navigate(`/incidents/${createdIncidentId}`)}
              className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-md font-semibold shadow-md transition-colors"
            >
              View Incident Details
            </button>
          )}
          <button
            onClick={() => navigate("/incidents")}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-md font-semibold shadow-sm transition-colors"
          >
            Incident List
          </button>
          <button
            onClick={() => {
              setIsSuccess(false);
              navigate("/dashboard");
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-md font-semibold transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Report Emergency
            </h1>
            <p className="text-slate-500 mt-1">
              Please provide accurate details to help dispatch the correct
              response team.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-border p-4 text-sm text-slate-600">
          <span className="font-bold text-slate-900">Note:</span> This is a
          demonstration interface. No actual emergency services will be
          contacted.
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 md:p-8 space-y-8"
        >
          {/* Incident Type & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Incident Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("type")}
                className={`w-full p-2.5 border rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none ${errors.type ? "border-red-500" : "border-slate-300"}`}
              >
                <option value="" disabled>
                  Select Type
                </option>
                <option value="Fire">Fire / Smoke</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Security Threat">Security Threat</option>
                <option value="Gas Leak">Gas Leak</option>
                <option value="Structural Hazard">Structural Hazard</option>
                <option value="Flooding">Flooding</option>
                <option value="Electrical Hazard">Electrical Hazard</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                {...register("severity")}
                className={`w-full p-2.5 border rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none ${errors.severity ? "border-red-500" : "border-slate-300"}`}
              >
                <option value="low">Low (Non-urgent)</option>
                <option value="medium">Medium (Requires attention)</option>
                <option value="high">High (Urgent response needed)</option>
                <option value="critical">
                  Critical (Immediate danger to life)
                </option>
              </select>
              {errors.severity && (
                <p className="text-xs text-red-500">
                  {errors.severity.message}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Building <span className="text-red-500">*</span>
              </label>
              <select
                {...register("buildingId")}
                className={`w-full p-2.5 border rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none ${errors.buildingId ? "border-red-500" : "border-slate-300"}`}
              >
                <option value="" disabled>
                  Select Building
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.buildingId && (
                <p className="text-xs text-red-500">
                  {errors.buildingId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Specific Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Room 402, North Wing Stairwell"
                {...register("locationDetails")}
                className={`w-full p-2.5 border rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none ${errors.locationDetails ? "border-red-500" : "border-slate-300"}`}
              />
              {errors.locationDetails && (
                <p className="text-xs text-red-500">
                  {errors.locationDetails.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Please describe the situation, hazards, and any immediate needs."
              {...register("description")}
              className={`w-full p-2.5 border rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none ${errors.description ? "border-red-500" : "border-slate-300"}`}
            />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Reporter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("reporterName")}
                className={`w-full p-2.5 border rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none ${errors.reporterName ? "border-red-500" : "border-slate-300"}`}
              />
              {errors.reporterName && (
                <p className="text-xs text-red-500">
                  {errors.reporterName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Contact Number
              </label>
              <input
                type="text"
                {...register("reporterContact")}
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Est. People Affected
              </label>
              <input
                type="number"
                min="0"
                {...register("peopleAffected")}
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Photo Upload (Visual only) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Attach Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <UploadCloud size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PNG, JPG up to 10MB (Frontend Preview Only)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2.5 rounded-md font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-2.5 rounded-md font-bold text-white shadow-md transition-colors ${isSubmitting ? "bg-red-400 cursor-not-allowed" : "bg-critical hover:bg-red-700"}`}
            >
              {isSubmitting ? "Submitting..." : "Submit Emergency Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
