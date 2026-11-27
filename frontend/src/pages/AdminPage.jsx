import React, { useEffect, useState } from "react";
import {
  Film,
  Plus,
  ShieldCheck,
  Trash2,
  CalendarClock,
  Clapperboard,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

function FormInput({ label, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#e32636] focus:outline-none focus:ring-2 focus:ring-[#e32636]/10 transition"
      />
    </div>
  );
}

function FormSelect({ label, children, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        {...props}
        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#e32636] focus:outline-none focus:ring-2 focus:ring-[#e32636]/10 transition"
      >
        {children}
      </select>
    </div>
  );
}

function FormTextarea({ label, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#e32636] focus:outline-none focus:ring-2 focus:ring-[#e32636]/10 transition resize-none"
      />
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [movieForm, setMovieForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    adultRating: "PG-13",
    genres: "Sci-Fi, Action",
    durationMinutes: 135,
  });

  const [showForm, setShowForm] = useState({
    movieId: "",
    screenName: "IMAX Laser - Hall 1",
    showTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    ticketPrice: "14.50",
    rows: 6,
    seatsPerRow: 8,
  });

  const loadData = async () => {
    try {
      const [m, s] = await Promise.all([
        apiFetch("/api/movies"),
        apiFetch("/api/shows"),
      ]);
      setMovies(m || []);
      setShows(s || []);
      if (m?.length && !showForm.movieId) {
        setShowForm((prev) => ({ ...prev, movieId: m[0].id }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-10 shadow-sm border border-gray-200 max-w-sm mx-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <ShieldCheck className="h-7 w-7 text-[#e32636]" />
          </div>
          <p className="font-bold text-gray-800 mb-1">Admin Access Required</p>
          <p className="text-sm text-gray-500">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = {
        ...movieForm,
        durationMinutes: Number(movieForm.durationMinutes),
        genres: movieForm.genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
      };
      const created = await apiFetch("/api/admin/movies", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Movie "${created.name}" created with slug /movies/${created.slug}`);
      setMovieForm({
        name: "",
        description: "",
        imageUrl: "",
        adultRating: "PG-13",
        genres: "Sci-Fi, Action",
        durationMinutes: 135,
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = {
        movieId: showForm.movieId,
        screenName: showForm.screenName,
        showTime: new Date(showForm.showTime).toISOString(),
        ticketPrice: Number(showForm.ticketPrice),
        rows: Number(showForm.rows),
        seatsPerRow: Number(showForm.seatsPerRow),
      };
      await apiFetch("/api/admin/shows", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Show scheduled successfully!");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMovie = async (id) => {
    try {
      await apiFetch(`/api/admin/movies/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteShow = async (id) => {
    try {
      await apiFetch(`/api/admin/shows/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e32636]/10">
              <ShieldCheck className="h-6 w-6 text-[#e32636]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1a1a2e]">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Add movies (auto-resolves unique slugs), schedule shows &amp; manage seats
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">
        {/* Alert messages */}
        {message && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#e32636]">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Forms Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Add Movie */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e32636]/10">
                <Film className="h-5 w-5 text-[#e32636]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1a1a2e]">
                  Add New Movie
                </h2>
                <p className="text-xs text-gray-400">
                  Slug is auto-generated &amp; unique
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateMovie} className="p-6 space-y-4">
              <FormInput
                label="Movie Name"
                type="text"
                required
                placeholder="e.g. Interstellar 2"
                value={movieForm.name}
                onChange={(e) =>
                  setMovieForm({ ...movieForm, name: e.target.value })
                }
              />
              <FormTextarea
                label="Description"
                rows={3}
                placeholder="Short synopsis of the movie..."
                value={movieForm.description}
                onChange={(e) =>
                  setMovieForm({ ...movieForm, description: e.target.value })
                }
              />
              <FormInput
                label="Poster Image URL"
                type="url"
                placeholder="https://example.com/poster.jpg"
                value={movieForm.imageUrl}
                onChange={(e) =>
                  setMovieForm({ ...movieForm, imageUrl: e.target.value })
                }
              />
              <div className="grid grid-cols-3 gap-3">
                <FormInput
                  label="Rating"
                  type="text"
                  placeholder="PG-13"
                  value={movieForm.adultRating}
                  onChange={(e) =>
                    setMovieForm({ ...movieForm, adultRating: e.target.value })
                  }
                />
                <FormInput
                  label="Duration (min)"
                  type="number"
                  placeholder="135"
                  value={movieForm.durationMinutes}
                  onChange={(e) =>
                    setMovieForm({ ...movieForm, durationMinutes: e.target.value })
                  }
                />
                <FormInput
                  label="Genres"
                  type="text"
                  placeholder="Action, Sci-Fi"
                  value={movieForm.genres}
                  onChange={(e) =>
                    setMovieForm({ ...movieForm, genres: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e32636] py-2.5 text-sm font-bold text-white hover:bg-[#c0101f] transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Movie
              </button>
            </form>
          </div>

          {/* Schedule Show */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a2e]/10">
                <CalendarClock className="h-5 w-5 text-[#1a1a2e]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1a1a2e]">
                  Schedule Show &amp; Seats
                </h2>
                <p className="text-xs text-gray-400">
                  Set screen, time &amp; seat grid
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateShow} className="p-6 space-y-4">
              <FormSelect
                label="Select Movie"
                required
                value={showForm.movieId}
                onChange={(e) =>
                  setShowForm({ ...showForm, movieId: e.target.value })
                }
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </FormSelect>
              <FormInput
                label="Screen Name"
                type="text"
                required
                placeholder="IMAX Laser - Hall 1"
                value={showForm.screenName}
                onChange={(e) =>
                  setShowForm({ ...showForm, screenName: e.target.value })
                }
              />
              <FormInput
                label="Show Date &amp; Time"
                type="datetime-local"
                required
                value={showForm.showTime}
                onChange={(e) =>
                  setShowForm({ ...showForm, showTime: e.target.value })
                }
              />
              <div className="grid grid-cols-3 gap-3">
                <FormInput
                  label="Base Price (₹)"
                  type="number"
                  step="0.50"
                  required
                  value={showForm.ticketPrice}
                  onChange={(e) =>
                    setShowForm({ ...showForm, ticketPrice: e.target.value })
                  }
                />
                <FormInput
                  label="Rows"
                  type="number"
                  min="1"
                  max="12"
                  value={showForm.rows}
                  onChange={(e) =>
                    setShowForm({ ...showForm, rows: e.target.value })
                  }
                />
                <FormInput
                  label="Seats / Row"
                  type="number"
                  min="2"
                  max="14"
                  value={showForm.seatsPerRow}
                  onChange={(e) =>
                    setShowForm({ ...showForm, seatsPerRow: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1a2e] py-2.5 text-sm font-bold text-white hover:bg-[#2d2d4e] transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Schedule Show
              </button>
            </form>
          </div>
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Movies List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clapperboard className="h-4 w-4 text-[#e32636]" />
                <h3 className="font-bold text-[#1a1a2e]">Movies</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {movies.length}
                </span>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {movies.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">
                  No movies yet. Add one above.
                </p>
              ) : (
                movies.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                        {m.name}
                      </p>
                      <p className="text-xs font-mono text-gray-400">
                        /movies/{m.slug}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMovie(m.id)}
                      className="ml-3 flex-shrink-0 rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-[#e32636] transition cursor-pointer"
                      title="Delete movie"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shows List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="h-4 w-4 text-[#1a1a2e]" />
                <h3 className="font-bold text-[#1a1a2e]">Scheduled Shows</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {shows.length}
                </span>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {shows.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">
                  No shows yet. Schedule one above.
                </p>
              ) : (
                shows.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                        {s.movieName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.screenName} &bull;{" "}
                        {new Date(s.showTime).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        &bull;{" "}
                        <span className="text-green-600 font-medium">
                          {s.availableCount} free
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteShow(s.id)}
                      className="ml-3 flex-shrink-0 rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-[#e32636] transition cursor-pointer"
                      title="Delete show"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
