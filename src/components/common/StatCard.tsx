import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "blue" | "red" | "orange" | "green" | "purple" | "default";
  accent?: string;
  trend?: string;
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  accent,
  trend,
  onClick,
  active,
}: StatCardProps) {
  const chosenVariant = accent || variant;

  const styles: Record<
    string,
    {
      iconBg: string;
      iconColor: string;
      valueColor: string;
    }
  > = {
    blue: {
      iconBg: "bg-blue-50 border-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-slate-900",
    },
    cyan: {
      iconBg: "bg-blue-50 border-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-slate-900",
    },
    red: {
      iconBg: "bg-red-50 border-red-100",
      iconColor: "text-red-600",
      valueColor: "text-red-600",
    },
    orange: {
      iconBg: "bg-orange-50 border-orange-100",
      iconColor: "text-orange-600",
      valueColor: "text-slate-900",
    },
    green: {
      iconBg: "bg-emerald-50 border-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    purple: {
      iconBg: "bg-indigo-50 border-indigo-100",
      iconColor: "text-indigo-600",
      valueColor: "text-slate-900",
    },
    default: {
      iconBg: "bg-slate-50 border-slate-100",
      iconColor: "text-slate-600",
      valueColor: "text-slate-900",
    },
  };

  const style = styles[chosenVariant] || styles.default;

  return (
    <div
      onClick={onClick}
      className={`light-card light-card-hover p-4 sm:p-5 flex flex-col justify-between ${
        onClick ? "cursor-pointer" : ""
      } ${active ? "ring-2 ring-blue-500 border-blue-300" : ""}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-slate-500 tracking-tight">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${style.iconBg}`}>
          <Icon size={16} className={style.iconColor} />
        </div>
      </div>

      <div>
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${style.valueColor}`}>
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {trend && (
              <span className="font-medium text-blue-600 shrink-0 ml-1">
                {trend}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
