import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigits = (num: number) => String(num).padStart(2, "0");

  const hours = formatDigits(time.getHours());
  const minutes = formatDigits(time.getMinutes());
  const seconds = formatDigits(time.getSeconds());

  const utcHours = formatDigits(time.getUTCHours());
  const utcMinutes = formatDigits(time.getUTCMinutes());

  return (
    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md text-xs font-mono text-slate-700">
      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
        <Clock size={13} className="text-blue-600" />
        <span>
          {hours}:{minutes}:{seconds}
        </span>
        <span className="text-[10px] text-slate-400 font-normal">LCL</span>
      </div>
      <div className="h-3 w-px bg-slate-200 hidden sm:block" />
      <div className="text-[11px] text-slate-500 hidden sm:block">
        UTC {utcHours}:{utcMinutes}
      </div>
    </div>
  );
}
