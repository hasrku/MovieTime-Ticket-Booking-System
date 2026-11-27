import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, LogIn, User, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(identifier, password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const quickLogin = async (email, pass) => {
    setError(""); setLoading(true);
    try {
      const user = await login(email, pass);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f4f4f4] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden">
          {/* Top bar */}
          <div className="bg-[#1a1a2e] px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Film className="h-5 w-5 text-[#e32636]" />
              <span className="font-bold">movietime</span>
            </div>
            <h1 className="text-xl font-extrabold">Welcome back</h1>
            <p className="text-xs text-white/50 mt-0.5">Sign in to continue booking</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1.5">Email or Phone</label>
                <input
                  type="text" required value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3.5 py-2.5 text-sm text-[#333] focus:border-[#e32636] focus:bg-white focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3.5 py-2.5 pr-10 text-sm text-[#333] focus:border-[#e32636] focus:bg-white focus:outline-none transition"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-[#fff5f5] border border-[#e32636]/20 px-3.5 py-2.5 text-xs text-[#e32636] font-medium">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-[#e32636] py-2.5 text-sm font-bold text-white hover:bg-[#b81c27] disabled:opacity-60 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : <LogIn className="h-4 w-4" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-5 pt-5 border-t border-[#f0f0f0]">
              <p className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wider mb-2.5">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => quickLogin("user1@movietime.com", "User@123")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] py-2 text-xs font-semibold text-[#555] hover:border-[#4a90a4] hover:text-[#4a90a4] transition cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" /> Normal User
                </button>
                <button type="button" onClick={() => quickLogin("admin1@movietime.com", "Admin@123")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[#e32636]/30 bg-[#fff5f5] py-2 text-xs font-semibold text-[#e32636] hover:bg-[#e32636] hover:text-white transition cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-[#aaa]">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-bold text-[#e32636] hover:underline">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
