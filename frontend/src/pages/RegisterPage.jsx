import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await register(form); navigate("/"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f4f4f4] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a1a2e] px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Film className="h-5 w-5 text-[#e32636]" />
              <span className="font-bold">movietime</span>
            </div>
            <h1 className="text-xl font-extrabold">Create account</h1>
            <p className="text-xs text-white/50 mt-0.5">Join thousands of movie lovers</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#333] mb-1">First Name</label>
                  <input required value={form.firstName} onChange={set("firstName")} placeholder="John"
                    className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-2.5 text-sm text-[#333] focus:border-[#e32636] focus:bg-white focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#333] mb-1">Last Name</label>
                  <input required value={form.lastName} onChange={set("lastName")} placeholder="Doe"
                    className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-2.5 text-sm text-[#333] focus:border-[#e32636] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1">Email <span className="text-[#aaa] font-normal">(optional)</span></label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="john@example.com"
                  className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-2.5 text-sm text-[#333] focus:border-[#e32636] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1">Phone</label>
                <input required type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-2.5 text-sm text-[#333] focus:border-[#e32636] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1">Password <span className="text-[#aaa] font-normal">(min 6 chars)</span></label>
                <div className="relative">
                  <input required minLength={6} type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••"
                    className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-2.5 pr-10 text-sm text-[#333] focus:border-[#e32636] focus:bg-white focus:outline-none transition"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-[#fff5f5] border border-[#e32636]/20 px-3 py-2.5 text-xs text-[#e32636] font-medium">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-[#e32636] py-2.5 text-sm font-bold text-white hover:bg-[#b81c27] disabled:opacity-60 transition cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                {loading
                  ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <UserPlus className="h-4 w-4" />}
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-[#aaa]">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-[#e32636] hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
