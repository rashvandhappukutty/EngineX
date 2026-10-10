import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo, type User } from "../store/demoState";
import { Shield, Eye, EyeOff, KeyRound, User as UserIcon, ArrowRight, CheckCircle2 } from "lucide-react";

const DEMO_PROFILES: User[] = [
  { id: "u1", name: "Commander Miller", role: "administrator" },
  { id: "u2", name: "Coordinator Vance", role: "coordinator" },
  { id: "u3", name: "Officer Briggs", role: "security" },
  { id: "u4", name: "Medic Chen", role: "responder" },
  { id: "u5", name: "Campus Watch", role: "reporter" },
];

export default function Login() {
  const { setCurrentUser } = useDemo();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your credentials.");
      return;
    }
    setCurrentUser({
      id: "custom",
      name: email.split("@")[0],
      role: "coordinator",
    });
    navigate("/command-center");
  };

  const loginAs = (profile: User) => {
    setCurrentUser(profile);
    if (profile.role === "reporter") navigate("/report");
    else navigate("/command-center");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden pattern-grid">
      <div className="w-full max-w-4xl z-10 flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-xl border border-slate-200 bg-white">
        {/* Left Side: Branding */}
        <div className="bg-slate-900 text-white w-full md:w-5/12 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
                <Shield size={22} />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Engine<span className="text-brand-400">X</span>
                </span>
                <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  Crisis Intelligence
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight tracking-tight">
              Smart Campus Crisis Coordination
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time spatial incident awareness, AI triage, automated responder matching, and dynamic corridor routing.
            </p>
          </div>

          <div className="space-y-2 mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-brand-400" />
              <span>Dual-Engine AI (Gemini 2.5 + Safety Core)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-brand-400" />
              <span>Dijkstra Spatial Evacuation Solver</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-brand-400" />
              <span>Human-in-the-Loop Safety Authorization</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Profiles */}
        <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Command Station Authentication
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a verified operational profile or enter credentials.
            </p>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-3.5 mb-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-xs border border-red-200 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Operator Email</label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@enginex.campus.edu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Access Key / Password</label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2"
            >
              <span>Sign In to Terminal</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Demo Access Roles */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Quick Role Switch (Instant Demo Access)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loginAs(p)}
                  className="p-2 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 border border-slate-200 rounded-lg text-left transition group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-brand-700 truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">{p.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
