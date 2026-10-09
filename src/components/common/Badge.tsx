export type SeverityLevel = "critical" | "high" | "medium" | "low" | string;
export type IncidentStatusType =
  | "reported"
  | "assigned"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed"
  | string;

export function SeverityBadge({
  severity,
  size = "md",
  pulse = false,
}: {
  severity: SeverityLevel;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}) {
  const sev = (severity || "low").toLowerCase();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-xs",
  }[size];

  switch (sev) {
    case "critical":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full bg-red-600 ${
              pulse ? "animate-ping" : "animate-pulse"
            }`}
          />
          Critical
        </span>
      );
    case "high":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          High
        </span>
      );
    case "medium":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Medium
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Low / Routine
        </span>
      );
  }
}

export function StatusBadge({ status }: { status: IncidentStatusType }) {
  const st = (status || "reported").toLowerCase();

  const styles: Record<string, { label: string; class: string }> = {
    reported: {
      label: "Reported",
      class: "bg-red-50 text-red-700 border-red-200",
    },
    assigned: {
      label: "Assigned",
      class: "bg-blue-50 text-blue-700 border-blue-200",
    },
    acknowledged: {
      label: "Acknowledged",
      class: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    in_progress: {
      label: "In Progress",
      class: "bg-amber-50 text-amber-700 border-amber-200",
    },
    resolved: {
      label: "Resolved",
      class: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    closed: {
      label: "Closed",
      class: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const current = styles[st] || {
    label: st.replace(/_/g, " "),
    class: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${current.class}`}
    >
      {current.label}
    </span>
  );
}

export function AIProviderBadge({
  provider,
  model,
}: {
  provider?: string;
  model?: string | null;
}) {
  const isGemini = provider === "gemini";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
        isGemini
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isGemini ? "bg-indigo-500 animate-pulse" : "bg-slate-400"
        }`}
      />
      <span>
        {isGemini
          ? `Gemini 2.5 Flash (${model || "active"})`
          : "Deterministic Safety Engine"}
      </span>
    </span>
  );
}

export function ThreatScoreBadge({ score }: { score: number }) {
  let colorClass = "text-emerald-700 border-emerald-200 bg-emerald-50";
  if (score >= 80) {
    colorClass = "text-red-700 border-red-200 bg-red-50";
  } else if (score >= 60) {
    colorClass = "text-orange-700 border-orange-200 bg-orange-50";
  } else if (score >= 35) {
    colorClass = "text-amber-700 border-amber-200 bg-amber-50";
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold ${colorClass}`}
    >
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
        Risk
      </span>
      <span className="font-bold text-sm">{score}</span>
      <span className="text-[10px] text-slate-400">/100</span>
    </div>
  );
}
