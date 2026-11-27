import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    MessageSquare,
    Star,
    Ticket,
    Users,
    Clapperboard,
    ChevronRight,
    Film,
    Send,
} from "lucide-react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80";

function MovieSkeleton() {
    return (
        <div className="min-h-screen bg-[#0B0D12]">
            <div className="h-[360px] animate-pulse bg-[#141720]" />
            <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
                <div className="h-6 w-36 animate-pulse rounded bg-[#1C212C]" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-44 animate-pulse rounded-2xl border border-[#252832] bg-[#141720]"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function SectionHeading({ icon: Icon, title, count }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E53945]/20 bg-[#E53945]/10">
                    <Icon className="h-4 w-4 text-[#E53945]" />
                </div>
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-[#E8EAF0]">{title}</h2>
                    {count !== undefined && (
                        <p className="mt-0.5 text-xs text-[#777D8B]">
                            {count} {count === 1 ? "item" : "items"}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ShowCard({ show }) {
    const dt = new Date(show.showTime);
    const totalSeats = show.tickets?.length || 1;
    const availableCount = Number(show.availableCount || 0);
    const percentage = availableCount / totalSeats;

    const availability =
        percentage > 0.5
            ? {
                  label: "Available",
                  style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
                  dot: "bg-emerald-400",
              }
            : percentage > 0.2
              ? {
                    label: "Filling fast",
                    style: "bg-amber-500/10 text-amber-400 border-amber-500/15",
                    dot: "bg-amber-400",
                }
              : {
                    label: "Almost full",
                    style: "bg-[#E53945]/10 text-[#F16B75] border-[#E53945]/20",
                    dot: "bg-[#E53945]",
                };

    return (
        <article className="group overflow-hidden rounded-2xl border border-[#252832] bg-[#141720] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3A3037] hover:bg-[#181C26]">
            <div className="p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#858B99]">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E53945]" />
                            <span className="truncate">{show.screenName}</span>
                        </div>

                        <p className="text-base font-bold text-[#E8EAF0]">
                            {dt.toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                            })}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-[#858B99]">
                            <Clock className="h-3.5 w-3.5" />
                            {dt.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#20242E] text-[#858B99]">
                        <Clapperboard className="h-5 w-5" />
                    </div>
                </div>

                <div className="mb-5 flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${availability.style}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                        {availability.label}
                    </span>

                    <span className="flex items-center gap-1.5 text-xs text-[#858B99]">
                        <Users className="h-3.5 w-3.5" />
                        {availableCount} seats left
                    </span>
                </div>

                <div className="flex items-center justify-between border-t border-[#252832] pt-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#777D8B]">
                            Ticket price
                        </p>
                        <p className="mt-1 text-lg font-bold tabular-nums text-[#E8EAF0]">
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(show.ticketPrice || 0))}
                        </p>
                    </div>

                    <Link
                        to={`/shows/${show.id}/book`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#E53945] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#CA2C38] active:scale-[0.98]"
                    >
                        Book seats
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

function ReviewCard({ review }) {
    const initial = review.userName?.charAt(0)?.toUpperCase() || "?";

    return (
        <article className="rounded-2xl border border-[#252832] bg-[#141720] p-5 transition hover:border-[#343946]">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E53945]/20 bg-[#E53945]/10 text-sm font-bold text-[#F16B75]">
                        {initial}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#E8EAF0]">{review.userName}</p>
                        <p className="mt-1 text-xs text-[#777D8B]">
                            {new Date(review.createdAt).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/15 bg-amber-500/10 px-2.5 py-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{review.rating}/10</span>
                </div>
            </div>

            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#A4A9B5]">{review.review}</p>
        </article>
    );
}

export default function MoviePage() {
    const { slug } = useParams();
    const { isAuthenticated } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0); // 0 means not rated yet
    const [submitting, setSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError("");
        setData(null);
        setReviewText("");
        setRating(0); // a different movie starts unrated
        setReviewError("");

        apiFetch(`/api/movies/${slug}`)
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((e) => {
                if (!cancelled) setError(e.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!rating || !reviewText.trim() || submitting) return;

        setSubmitting(true);
        setReviewError("");

        try {
            const created = await apiFetch(`/api/movies/${data.movie.id}/reviews`, {
                method: "POST",
                body: JSON.stringify({
                    review: reviewText.trim(),
                    rating: Number(rating),
                }),
            });

            setData((previous) => {
                if (previous?.movie.id !== data.movie.id) return previous;

                return {
                    ...previous,
                    // Replaces the old copy if the server updated an existing review
                    reviews: [created, ...(previous.reviews || []).filter((r) => r.id !== created.id)],
                };
            });

            setReviewText(""); // the rating is intentionally kept

            // Refresh the average rating and review count without showing the skeleton.
            // A failure here is ignored because the review was already posted.
            apiFetch(`/api/movies/${slug}`)
                .then((fresh) => {
                    setData((previous) => (previous?.movie.id === fresh?.movie?.id ? fresh : previous));
                })
                .catch(() => {});
        } catch (err) {
            setReviewError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <MovieSkeleton />;

    if (error || !data) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center bg-[#0B0D12] px-4">
                <div className="w-full max-w-md rounded-2xl border border-[#252832] bg-[#141720] p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E53945]/10">
                        <Film className="h-7 w-7 text-[#E53945]" />
                    </div>

                    <h2 className="text-xl font-bold text-[#E8EAF0]">Movie not found</h2>
                    <p className="mt-2 text-sm text-[#858B99]">
                        {error || "We couldn't find the movie you're looking for."}
                    </p>

                    <Link
                        to="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E53945] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#CA2C38]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to movies
                    </Link>
                </div>
            </div>
        );
    }

    const { movie, shows = [], reviews = [] } = data;

    return (
        <div className="min-h-screen bg-[#0B0D12] pb-16 text-[#E8EAF0]">
            {/* Movie hero */}
            <section className="relative isolate overflow-hidden border-b border-[#252832] bg-[#10131B]">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 -z-20 scale-105 bg-cover bg-center opacity-30 blur-sm"
                    style={{
                        backgroundImage: `url("${movie.imageUrl || FALLBACK_IMAGE}")`,
                    }}
                />

                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/95 to-[#0B0D12]/75" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B0D12] via-transparent to-[#0B0D12]/30" />

                <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
                    <Link
                        to="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#858B99] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        All movies
                    </Link>

                    <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-9">
                        {/* Poster */}
                        <div className="w-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#141720] shadow-2xl shadow-black/40 sm:w-48">
                            <img
                                src={movie.imageUrl || FALLBACK_IMAGE}
                                alt={movie.name}
                                className="aspect-[2/3] w-full object-cover"
                            />
                        </div>

                        {/* Movie details */}
                        <div className="min-w-0 flex-1 pt-1">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                {movie.adultRating && (
                                    <span className="rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/80">
                                        {movie.adultRating}
                                    </span>
                                )}

                                {movie.releaseDate && (
                                    <span className="flex items-center gap-1.5 text-xs text-white/60">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {movie.releaseDate}
                                    </span>
                                )}

                                <span className="flex items-center gap-1.5 text-xs text-white/60">
                                    <Clock className="h-3.5 w-3.5" />
                                    {movie.durationMinutes} min
                                </span>
                            </div>

                            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                                {movie.name}
                            </h1>

                            {movie.genres?.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {movie.genres.map((genre) => (
                                        <span
                                            key={genre}
                                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
                                        >
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {movie.averageRating > 0 && (
                                <div className="mt-5 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold leading-none text-white">
                                            {movie.averageRating}
                                            <span className="ml-1 text-xs font-medium text-white/40">/ 10</span>
                                        </p>
                                        <p className="mt-1 text-[11px] text-white/50">
                                            Based on {movie.reviewCount} reviews
                                        </p>
                                    </div>
                                </div>
                            )}

                            {movie.description && (
                                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                                    {movie.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main content */}
            <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-12">
                {/* Showtimes */}
                <section>
                    <SectionHeading icon={Ticket} title="Choose a showtime" count={shows.length} />

                    {shows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#303541] bg-[#141720]/60 px-6 py-12 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#20242E]">
                                <Calendar className="h-5 w-5 text-[#858B99]" />
                            </div>
                            <h3 className="text-sm font-semibold text-[#E8EAF0]">No showtimes available</h3>
                            <p className="mt-2 text-xs text-[#777D8B]">
                                There are no scheduled shows for this movie yet. Check back later.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {shows.map((show) => (
                                <ShowCard key={show.id} show={show} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Reviews */}
                <section>
                    <SectionHeading icon={MessageSquare} title="Audience reviews" count={reviews.length} />

                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                        {/* Review list */}
                        <div className="space-y-4 lg:col-span-2">
                            {reviews.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-[#303541] bg-[#141720]/60 px-6 py-12 text-center">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#20242E]">
                                        <MessageSquare className="h-5 w-5 text-[#858B99]" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#E8EAF0]">No reviews yet</h3>
                                    <p className="mt-2 text-xs text-[#777D8B]">
                                        Be the first to share what you thought about this movie.
                                    </p>
                                </div>
                            ) : (
                                reviews.map((review) => <ReviewCard key={review.id} review={review} />)
                            )}
                        </div>

                        {/* Review form */}
                        <aside className="lg:sticky lg:top-24">
                            <div className="overflow-hidden rounded-2xl border border-[#252832] bg-[#141720] shadow-xl shadow-black/20">
                                {/* Header */}
                                <div className="border-b border-[#252832] bg-gradient-to-b from-amber-400/[0.07] to-transparent p-5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[#E8EAF0]">Rate this movie</h3>
                                            <p className="mt-0.5 text-xs text-[#777D8B]">Share your experience</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    {isAuthenticated ? (
                                        <form onSubmit={handleReviewSubmit} className="space-y-1">
                                            {/* Rating */}
                                            <div className="rounded-xl border border-[#252832] bg-[#0F1219] px-2 py-1.5">
                                                <StarRating value={rating} onChange={setRating} disabled={submitting} />
                                            </div>

                                            {/* Review */}
                                            <div>
                                                <textarea
                                                    id="movie-review"
                                                    rows={5}
                                                    required
                                                    maxLength={2000}
                                                    value={reviewText}
                                                    onChange={(e) => setReviewText(e.target.value)}
                                                    placeholder="What did you think of the movie?"
                                                    className="w-full resize-none rounded-xl border border-[#303541] bg-[#0F1219] p-3.5 text-sm text-[#E8EAF0] outline-none transition placeholder:text-[#626978] focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10"
                                                />
                                                <p className="mt-1.5 text-right text-[10px] text-[#626978]">
                                                    {reviewText.length}/2000
                                                </p>
                                            </div>

                                            {reviewError && (
                                                <p
                                                    role="alert"
                                                    className="rounded-lg border border-[#E53945]/20 bg-[#E53945]/10 px-3 py-2 text-xs text-[#F16B75]"
                                                >
                                                    {reviewError}
                                                </p>
                                            )}

                                            <div>
                                                <button
                                                    type="submit"
                                                    disabled={submitting || !rating || !reviewText.trim()}
                                                    className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-3 text-sm font-bold text-[#14120A] transition hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#252A35] disabled:text-[#626978] disabled:active:scale-100"
                                                >
                                                    <Send className="h-4 w-4" />
                                                    {submitting ? "Submitting..." : "Post review"}
                                                </button>

                                                {(!rating || !reviewText.trim()) && (
                                                    <p className="mt-2 text-center text-[11px] text-[#777D8B]">
                                                        {!rating
                                                            ? "Select a star rating to continue"
                                                            : "Write a review to continue"}
                                                    </p>
                                                )}
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="py-3 text-center">
                                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#20242E]">
                                                <MessageSquare className="h-5 w-5 text-[#858B99]" />
                                            </div>

                                            <h4 className="text-sm font-semibold text-[#E8EAF0]">
                                                Join the conversation
                                            </h4>
                                            <p className="mx-auto mt-2 max-w-[220px] text-xs leading-5 text-[#858B99]">
                                                Sign in to rate this movie and share your thoughts.
                                            </p>

                                            <Link
                                                to="/login"
                                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-bold text-[#14120A] transition hover:bg-amber-300"
                                            >
                                                Sign in to review
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>
            </main>
        </div>
    );
}
