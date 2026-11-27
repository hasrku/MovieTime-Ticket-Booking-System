import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Ticket, ChevronRight, Clock } from "lucide-react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function MyTicketsPage() {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch("/api/bookings/my")
      .then((d) => setBookings(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="bg-white border-b border-[#e5e5e5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5">
          <h1 className="text-xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#e32636]" />
            My Bookings
          </h1>
          <p className="text-xs text-[#aaa] mt-0.5">Your confirmed cinema tickets</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        {!isAuthenticated ? (
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-14 text-center shadow-sm">
            <Ticket className="h-10 w-10 text-[#e5e5e5] mx-auto mb-3" />
            <p className="font-semibold text-[#1a1a2e] mb-1">Sign in to view your tickets</p>
            <p className="text-xs text-[#777] mb-5">Your confirmed movie bookings will appear here</p>
            <Link to="/login" className="inline-block rounded-lg bg-[#e32636] px-5 py-2 text-sm font-bold text-white hover:bg-[#b81c27] transition">
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-[#e5e5e5] h-28 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-[#e32636]/20 p-6 text-sm text-[#e32636] text-center">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-14 text-center shadow-sm">
            <Ticket className="h-10 w-10 text-[#e5e5e5] mx-auto mb-3" />
            <p className="font-semibold text-[#aaa] mb-1">No bookings yet</p>
            <p className="text-xs text-[#bbb] mb-5">Book your first movie ticket today</p>
            <Link to="/" className="inline-block rounded-lg bg-[#e32636] px-5 py-2 text-sm font-bold text-white hover:bg-[#b81c27] transition">
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
                <div className="flex items-stretch">
                  {/* Poster strip */}
                  <div className="w-20 sm:w-24 shrink-0 bg-[#1a1a2e] overflow-hidden">
                    <img
                      src={b.movieImageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80"}
                      alt={b.movieName}
                      className="h-full w-full object-cover opacity-80"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/movies/${b.movieSlug}`}
                          className="text-sm sm:text-base font-bold text-[#1a1a2e] hover:text-[#e32636] transition leading-tight"
                        >
                          {b.movieName}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#777]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#4a90a4]" /> {b.screenName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#4a90a4]" />
                            {new Date(b.showTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[#4a90a4]" />
                            {new Date(b.showTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(b.seats || []).map((s) => (
                            <span key={s} className="rounded bg-[#f0f0f0] border border-[#e5e5e5] px-2 py-0.5 text-xs font-bold text-[#333]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block rounded-full bg-[#e8f8f0] border border-[#2d9e5c]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#2d9e5c]">
                          {b.status}
                        </span>
                        <p className="mt-2 text-base font-extrabold text-[#1a1a2e]">
                          ${Number(b.totalAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-dashed border-[#e5e5e5] px-5 py-2.5 flex items-center justify-between bg-[#fafafa]">
                  <p className="text-[10px] font-mono text-[#bbb]">ID: {b.id?.slice(0, 16)}…</p>
                  <span className="text-[10px] text-[#aaa]">Booked {new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
