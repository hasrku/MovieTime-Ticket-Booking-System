import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, MessageSquare, Star, Ticket, Users } from "lucide-react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function MoviePage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/movies/${slug}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setSubmitting(true); setReviewError("");
    try {
      const created = await apiFetch(`/api/movies/${data.movie.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ review: reviewText, rating: Number(rating) }),
      });
      setData((p) => ({ ...p, reviews: [created, ...p.reviews] }));
      setReviewText("");
    } catch (err) { setReviewError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-white animate-pulse h-72 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-10 shadow-sm border border-[#e5e5e5]">
        <p className="text-lg font-bold text-[#e32636] mb-3">{error || "Movie not found"}</p>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#e32636] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Movies
        </Link>
      </div>
    </div>
  );

  const { movie, shows, reviews } = data;

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Hero backdrop */}
      <div
        className="relative bg-[#1a1a2e] overflow-hidden"
        style={{ backgroundImage: `url(${movie.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Strong overlay */}
        <div className="absolute inset-0 bg-[#1a1a2e]/88" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition mb-6">
            <ArrowLeft className="h-4 w-4" /> All Movies
          </Link>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Poster */}
            <div className="shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden shadow-2xl border border-white/10 self-start">
              <img
                src={movie.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80"}
                alt={movie.name}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>

            {/* Meta */}
            <div className="text-white">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded border border-white/30 px-2 py-0.5 text-[11px] font-bold text-white/80">{movie.adultRating}</span>
                {movie.releaseDate && (
                  <span className="flex items-center gap-1 text-xs text-white/50">
                    <Calendar className="h-3.5 w-3.5" /> {movie.releaseDate}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <Clock className="h-3.5 w-3.5" /> {movie.durationMinutes} min
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">{movie.name}</h1>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(movie.genres || []).map((g) => (
                  <span key={g} className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white/70">{g}</span>
                ))}
              </div>

              {movie.averageRating > 0 && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/15 px-3 py-2 mb-3">
                  <Star className="h-4 w-4 fill-[#f5a623] text-[#f5a623]" />
                  <span className="text-sm font-bold">{movie.averageRating}<span className="text-white/50 font-normal">/10</span></span>
                  <span className="text-xs text-white/40">{movie.reviewCount} reviews</span>
                </div>
              )}

              <p className="text-sm text-white/55 leading-relaxed max-w-lg">{movie.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Showtimes */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-5 w-1 rounded-full bg-[#e32636] inline-block" />
            <h2 className="text-base font-bold text-[#1a1a2e] flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-[#e32636]" /> Showtimes
            </h2>
          </div>

          {shows.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e5e5e5] p-10 text-center text-[#aaa] text-sm">
              No showtimes scheduled yet for this movie.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shows.map((show) => {
                const dt = new Date(show.showTime);
                const pct = show.availableCount / (show.tickets?.length || 1);
                return (
                  <div key={show.id} className="bg-white rounded-xl border border-[#e5e5e5] p-4 shadow-sm hover:shadow-md hover:border-[#e32636]/30 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-[#4a90a4] mb-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{show.screenName}</span>
                        </div>
                        <p className="text-sm font-bold text-[#1a1a2e]">
                          {dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs text-[#777]">
                          {dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
                        pct > 0.5 ? "bg-[#e8f8f0] text-[#2d9e5c]"
                        : pct > 0.2 ? "bg-[#fff8e6] text-[#e68a00]"
                        : "bg-[#fff0f0] text-[#e32636]"
                      }`}>
                        {show.availableCount} seats
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f0]">
                      <div>
                        <p className="text-[10px] text-[#aaa] uppercase tracking-wider font-medium">From</p>
                        <p className="text-sm font-bold text-[#1a1a2e]">${Number(show.ticketPrice).toFixed(2)}</p>
                      </div>
                      <Link
                        to={`/shows/${show.id}/book`}
                        className="rounded-lg bg-[#e32636] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#b81c27] transition"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-5 w-1 rounded-full bg-[#e32636] inline-block" />
              <h2 className="text-base font-bold text-[#1a1a2e] flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-[#e32636]" /> Reviews
                <span className="font-normal text-[#aaa]">({reviews.length})</span>
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-sm text-[#aaa]">
                No reviews yet. Be the first to review!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl border border-[#e5e5e5] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#1a1a2e] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {r.userName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1a2e] leading-none">{r.userName}</p>
                          <p className="text-[11px] text-[#aaa] mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded bg-[#f5a623]/15 px-2 py-0.5 text-xs font-bold text-[#b8780a]">
                        <Star className="h-3 w-3 fill-[#f5a623] text-[#f5a623]" /> {r.rating}/10
                      </span>
                    </div>
                    <p className="text-sm text-[#555] leading-relaxed">{r.review}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review form */}
          <div>
            <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 shadow-sm sticky top-20">
              <h3 className="text-sm font-bold text-[#1a1a2e] mb-4 flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[#f5a623]" /> Rate This Movie
              </h3>
              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-[#777] mb-1.5">
                      <label className="font-semibold text-[#1a1a2e]">Rating</label>
                      <span className="font-bold text-[#e32636]">{rating} / 10</span>
                    </div>
                    <input type="range" min="1" max="10" value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="w-full accent-[#e32636] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#aaa] mt-0.5">
                      <span>Terrible</span><span>Masterpiece</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">Your Review</label>
                    <textarea rows={4} required value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your thoughts…"
                      className="w-full rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] p-3 text-sm text-[#333] placeholder-[#bbb] focus:border-[#e32636] focus:outline-none focus:bg-white resize-none"
                    />
                  </div>
                  {reviewError && <p className="text-xs text-[#e32636]">{reviewError}</p>}
                  <button type="submit" disabled={submitting}
                    className="w-full rounded-lg bg-[#e32636] py-2.5 text-sm font-bold text-white hover:bg-[#b81c27] disabled:opacity-50 cursor-pointer transition"
                  >
                    {submitting ? "Posting…" : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-[#777] mb-4">Sign in to write a review</p>
                  <Link to="/login" className="inline-block rounded-lg bg-[#e32636] px-5 py-2 text-sm font-bold text-white hover:bg-[#b81c27] transition">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
