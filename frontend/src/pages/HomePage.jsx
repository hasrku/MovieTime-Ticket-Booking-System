import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Search, Star, ChevronRight, Flame } from "lucide-react";
import { apiFetch } from "../api/client";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  useEffect(() => {
    apiFetch("/api/movies")
      .then((d) => setMovies(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => {
    const s = new Set(["All"]);
    movies.forEach((m) => (m.genres || []).forEach((g) => s.add(g)));
    return Array.from(s);
  }, [movies]);

  const filtered = useMemo(() =>
    movies.filter((m) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || m.name.toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q);
      const matchG = selectedGenre === "All" || (m.genres || []).includes(selectedGenre);
      return matchQ && matchG;
    }),
    [movies, query, selectedGenre]
  );

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Hero Banner */}
      <div className="bg-[#1a1a2e] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e32636]/20 border border-[#e32636]/30 px-3 py-1 text-xs font-semibold text-[#ff6b7a] mb-4">
              <Flame className="h-3 w-3" />
              Book Now — Real-Time Seat Availability
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
              Movies, Events &amp; More
            </h1>
            <p className="text-sm text-white/55 mb-6">
              Pick your seat live. No surprises at the counter.
            </p>
            {/* Search bar inline */}
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aaa]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies, genres…"
                className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:bg-white focus:text-[#1a1a2e] focus:placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#e32636]/60 transition"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Genre filter chips */}
        <div className="flex gap-2 flex-wrap mb-6">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                selectedGenre === g
                  ? "bg-[#e32636] border-[#e32636] text-white"
                  : "bg-white border-[#e5e5e5] text-[#555] hover:border-[#e32636] hover:text-[#e32636]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1a1a2e]">
            {selectedGenre === "All" ? "Now Showing" : selectedGenre} · <span className="text-[#e32636]">{filtered.length} movies</span>
          </h2>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-[#e5e5e5]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 bg-[#e5e5e5] rounded" />
                  <div className="h-2.5 w-1/2 bg-[#e5e5e5] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[#e32636]/20 bg-[#fff5f5] p-8 text-center">
            <p className="font-semibold text-[#e32636]">Could not load movies</p>
            <p className="mt-1 text-sm text-[#e32636]/70">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-white border border-[#e5e5e5] p-14 text-center">
            <p className="text-[#aaa] font-medium">No movies match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((movie) => (
              <Link
                key={movie.id}
                to={`/movies/${movie.slug}`}
                className="group rounded-xl bg-white border border-[#e5e5e5] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] overflow-hidden bg-[#f0f0f0]">
                  <img
                    src={movie.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80"}
                    alt={movie.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Rating pill */}
                  {movie.averageRating > 0 && (
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-[#f5a623] text-[#f5a623]" />
                      {movie.averageRating}/10
                    </div>
                  )}
                  {/* Rating badge */}
                  <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {movie.adultRating}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-[#1a1a2e] leading-tight line-clamp-1 group-hover:text-[#e32636] transition-colors">
                    {movie.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {(movie.genres || []).slice(0, 2).map((g) => (
                      <span key={g} className="text-[10px] text-[#777]">{g}</span>
                    ))}
                    {(movie.genres || []).length > 1 && (
                      <span className="text-[10px] text-[#aaa]">· </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-[#777]">
                      <Clock className="h-3 w-3" />
                      {movie.durationMinutes}m
                    </span>
                  </div>
                  <button className="mt-2.5 w-full rounded-lg bg-[#e32636] py-1.5 text-xs font-bold text-white hover:bg-[#b81c27] transition cursor-pointer">
                    Book Tickets
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
