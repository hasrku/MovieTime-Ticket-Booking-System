import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, LogIn, LogOut, ShieldCheck, Ticket, User, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e5e5e5] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e32636] text-white">
              <Film className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1a1a2e]">
              movie<span className="text-[#e32636]">time</span>
            </span>
          </Link>

          {/* Right nav */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated && (
              <Link
                to="/my-tickets"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#555] hover:bg-[#f4f4f4] hover:text-[#1a1a2e] transition"
              >
                <Ticket className="h-4 w-4 text-[#e32636]" />
                My Tickets
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#e32636] px-3 py-1.5 text-xs font-bold text-[#e32636] hover:bg-[#e32636] hover:text-white transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-[#e5e5e5]">
                <div className="hidden sm:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f4f4f4] transition cursor-default">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e32636] text-white text-xs font-bold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-[#1a1a2e]">{user.firstName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#aaa]" />
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#555] hover:bg-[#fff0f0] hover:text-[#e32636] transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-[#e5e5e5]">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#e32636] hover:bg-[#fff0f0] transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-[#e32636] px-4 py-2 text-sm font-bold text-white hover:bg-[#b81c27] transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
