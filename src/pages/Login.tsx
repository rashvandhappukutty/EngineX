import { useState } from "react";
import { useDemo, type User } from "../store/demoState";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, KeyRound, User as UserIcon } from "lucide-react";

const DEMO_PROFILES: User[] = [
  { id: "u1", name: "Admin User", role: "administrator" },
  { id: "u2", name: "Emergency Coordinator", role: "coordinator" },
  { id: "u3", name: "Campus Security", role: "security" },
  { id: "u4", name: "Medical Responder", role: "responder" },
  { id: "u5", name: "Student Reporter", role: "reporter" },
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
      setError("Please enter both email and password.");
      return;
    }
    // Fallback manual login defaults to reporter if they just type anything
    setCurrentUser({
      id: "custom",
      name: email.split("@")[0],
      role: "reporter",
    });
    navigate("/");
  };

  const loginAs = (profile: User) => {
    setCurrentUser(profile);

    // Route appropriately based on role
    if (profile.role === "reporter") navigate("/report-emergency");
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 left-0 w-full h-full pattern-grid opacity-50 z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[120px] opacity-20 z-0"></div>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl z-10 flex flex-col md:flex-row overflow-hidden border border-slate-200">
        {/* Left Side: Branding */}
        <div className="bg-slate-900 w-full md:w-5/12 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-30 translate-x-1/2 -translate-y-1/2"></div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary p-2 rounded-lg">
                <Shield className="text-white" size={32} />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Engine<span className="text-primary">X</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Smart Campus Crisis Coordination
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Centralized emergency response, dynamic evacuation routing, and
              real-time resource allocation for safer campuses.
            </p>
          </div>

          <div className="mt-12 text-xs text-slate-500 font-medium">
            NEXUS'26 HACKATHON PROTOTYPE
          </div>
        </div>

        {/* Right Side: Login Form & Profiles */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Sign in to your account or use a demo profile below.
          </p>

          <form onSubmit={handleManualLogin} className="space-y-4 mb-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <UserIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="admin@enginex.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-md transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-400 uppercase font-bold tracking-wider text-xs">
                Or use a demo profile
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => loginAs(profile)}
                className="flex flex-col items-start p-3 border border-slate-200 rounded-md hover:border-primary hover:bg-blue-50 transition-all text-left"
              >
                <span className="font-bold text-slate-900 text-sm">
                  {profile.name}
                </span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  {profile.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer Modal / Banner */}
      <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 text-xs max-w-xs z-50">
        <p className="font-bold mb-1 flex items-center gap-2">
          <Shield size={14} className="text-primary" /> DEMO MODE ONLY
        </p>
        <p className="text-slate-400">
          Authentication is simulated on the frontend for demonstration
          purposes. No real credentials are required.
        </p>
      </div>
    </div>
  );
}
