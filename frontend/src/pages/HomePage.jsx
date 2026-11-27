import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Search, Star, ChevronLeft, ChevronRight, Flame, Play, Ticket, Film, ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { apiFetch } from "../api/client";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85";

const formatGenres = (genres = []) => genres.slice(0, 2).join(" · ");

function FeaturedCarousel({ movies }) {
    const autoplay = useMemo(
        () =>
            Autoplay({
                delay: 5500,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
            }),
        [],
    );

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: movies.length > 1,
            align: "start",
        },
        movies.length > 1 ? [autoplay] : [],
    );

    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => {
        emblaApi?.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        emblaApi?.scrollNext();
    }, [emblaApi]);

    const scrollTo = useCallback(
        (index) => {
            emblaApi?.scrollTo(index);
        },
        [emblaApi],
    );

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);

        return () => {
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi, onSelect]);

    if (!movies.length) return null;

    return (
        <section className="relative overflow-hidden border-b border-[#252832] bg-[#0B0D12]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#141720]/30 to-[#0B0D12]/70" />

            <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#E8EAF0]">
                        <Flame className="h-4 w-4 text-[#E53945]" />
                        <span className="text-sm font-semibold tracking-wide">FEATURED MOVIES</span>
                    </div>

                    {movies.length > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={scrollPrev}
                                aria-label="Previous movie"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#292D37] bg-[#141720] text-[#E8EAF0] transition hover:border-[#E53945]/50 hover:bg-[#1C212C]"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <button
                                onClick={scrollNext}
                                aria-label="Next movie"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#292D37] bg-[#141720] text-[#E8EAF0] transition hover:border-[#E53945]/50 hover:bg-[#1C212C]"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
                    <div className="flex">
                        {movies.map((movie) => (
                            <div key={movie.id} className="relative min-w-0 flex-[0_0_100%] overflow-hidden">
                                <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[#252832] bg-[#141720] sm:min-h-[440px] lg:min-h-[480px]">
                                    <img
                                        src={movie.imageUrl || FALLBACK_IMAGE}
                                        alt={movie.name}
                                        className="absolute inset-0 h-full w-full object-cover object-center"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                                    <div className="relative flex min-h-[360px] items-end sm:min-h-[440px] lg:min-h-[480px]">
                                        <div className="max-w-2xl px-6 pb-9 pt-10 sm:px-10 sm:pb-12 lg:px-14">
                                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                                <span className="rounded-md bg-[#E53945] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                                    Now Showing
                                                </span>

                                                {movie.adultRating && (
                                                    <span className="rounded-md border border-white/30 bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                                        {movie.adultRating}
                                                    </span>
                                                )}

                                                {movie.averageRating > 0 && (
                                                    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                                        <Star size={12} className="fill-amber-400 text-amber-400" />
                                                        {movie.averageRating}/10
                                                    </span>
                                                )}
                                            </div>

                                            <h1 className="mb-3 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                                                {movie.name}
                                            </h1>

                                            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                                                {movie.genres?.length > 0 && <span>{formatGenres(movie.genres)}</span>}

                                                {movie.durationMinutes && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-white/40" />
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock size={14} />
                                                            {movie.durationMinutes} min
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            <p className="mb-7 line-clamp-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
                                                {movie.description ||
                                                    "Experience this movie on the big screen. Book your tickets now."}
                                            </p>

                                            <Link
                                                to={`/movies/${movie.slug}`}
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#E53945] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-[#CA2C38] active:scale-[0.98]"
                                            >
                                                <Ticket size={17} />
                                                Book Tickets
                                                <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {movies.length > 1 && (
                    <div className="mt-5 flex items-center justify-center gap-2">
                        {movies.map((movie, index) => (
                            <button
                                key={movie.id}
                                onClick={() => scrollTo(index)}
                                aria-label={`Go to featured movie ${index + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    selectedIndex === index ? "w-8 bg-[#E53945]" : "w-2 bg-[#3A3F4B] hover:bg-[#777D8B]"
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function MovieCard({ movie }) {
    return (
        <Link
            to={`/movies/${movie.slug}`}
            className="group block overflow-hidden rounded-2xl border border-[#252832] bg-[#141720] transition duration-300 hover:-translate-y-1 hover:border-[#3A404D] hover:bg-[#181C26] hover:shadow-xl hover:shadow-black/20"
        >
            <div className="relative aspect-[2/3] overflow-hidden bg-[#1C212C]">
                <img
                    src={movie.imageUrl || FALLBACK_IMAGE}
                    alt={movie.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10 opacity-90" />

                {movie.averageRating > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {movie.averageRating}/10
                    </div>
                )}

                {movie.adultRating && (
                    <span className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/65 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        {movie.adultRating}
                    </span>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E53945] text-white shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-105">
                        <Play size={20} fill="currentColor" />
                    </div>
                </div>
            </div>

            <div className="p-3.5 sm:p-4">
                <h3 className="line-clamp-1 text-sm font-bold text-[#E8EAF0] transition-colors group-hover:text-[#FF6873] sm:text-base">
                    {movie.name}
                </h3>

                <div className="mt-1.5 flex min-h-[18px] items-center gap-1.5 text-xs text-[#858B99]">
                    <span className="line-clamp-1">{formatGenres(movie.genres)}</span>

                    {movie.durationMinutes > 0 && (
                        <>
                            <span className="shrink-0 text-[#454B58]">·</span>
                            <span className="flex shrink-0 items-center gap-1">
                                <Clock size={12} />
                                {movie.durationMinutes}m
                            </span>
                        </>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#252832] pt-3">
                    <span className="text-xs font-medium text-[#858B99] transition-colors group-hover:text-[#E8EAF0]">
                        View details
                    </span>

                    <ArrowRight
                        size={15}
                        className="text-[#777D8B] transition group-hover:translate-x-1 group-hover:text-[#E53945]"
                    />
                </div>
            </div>
        </Link>
    );
}

function MovieSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#252832] bg-[#141720]">
            <div className="aspect-[2/3] animate-pulse bg-[#1C212C]" />

            <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#252A35]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#202530]" />
                <div className="h-8 animate-pulse rounded-lg bg-[#202530]" />
            </div>
        </div>
    );
}

export default function HomePage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("All");

    useEffect(() => {
        apiFetch("/api/movies")
            .then((data) => setMovies(data || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const genres = useMemo(() => {
        const genreSet = new Set(["All"]);

        movies.forEach((movie) => {
            (movie.genres || []).forEach((genre) => genreSet.add(genre));
        });

        return Array.from(genreSet);
    }, [movies]);

    const filteredMovies = useMemo(() => {
        return movies.filter((movie) => {
            const searchTerm = query.trim().toLowerCase();

            const matchesSearch =
                !searchTerm ||
                movie.name?.toLowerCase().includes(searchTerm) ||
                movie.description?.toLowerCase().includes(searchTerm) ||
                (movie.genres || []).some((genre) => genre.toLowerCase().includes(searchTerm));

            const matchesGenre = selectedGenre === "All" || (movie.genres || []).includes(selectedGenre);

            return matchesSearch && matchesGenre;
        });
    }, [movies, query, selectedGenre]);

    const featuredMovies = useMemo(() => movies.slice(0, 5), [movies]);

    return (
        <main className="min-h-screen bg-[#0B0D12] text-[#E8EAF0]">
            {/* Featured carousel */}
            {!loading && !error && featuredMovies.length > 0 && <FeaturedCarousel movies={featuredMovies} />}

            {/* Main content */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                {/* Page heading and search */}
                <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF6873]">
                            <Film size={14} />
                            Cinema & Entertainment
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-[#E8EAF0] sm:text-3xl">
                            Discover movies
                        </h2>

                        <p className="mt-1.5 text-sm text-[#858B99]">Find your next movie and book your seats.</p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            size={17}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777D8B]"
                        />

                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search movies..."
                            className="w-full rounded-xl border border-[#292D37] bg-[#141720] py-3 pl-10 pr-4 text-sm text-[#E8EAF0] outline-none transition placeholder:text-[#777D8B] focus:border-[#E53945] focus:ring-4 focus:ring-[#E53945]/10"
                        />
                    </div>
                </div>

                {/* Genre filters */}
                {!loading && !error && genres.length > 1 && (
                    <div className="mb-8">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {genres.map((genre) => {
                                const active = selectedGenre === genre;

                                return (
                                    <button
                                        key={genre}
                                        onClick={() => setSelectedGenre(genre)}
                                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                                            active
                                                ? "bg-[#E53945] text-white shadow-sm shadow-red-950/30"
                                                : "border border-[#292D37] bg-[#141720] text-[#A3A8B4] hover:border-[#3A404D] hover:bg-[#1C212C] hover:text-[#E8EAF0]"
                                        }`}
                                    >
                                        {genre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Movie section header */}
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-[#E8EAF0] sm:text-xl">
                            {query ? "Search results" : selectedGenre === "All" ? "Now showing" : selectedGenre}
                        </h3>

                        {!loading && (
                            <p className="mt-1 text-xs text-[#777D8B]">
                                {filteredMovies.length} {filteredMovies.length === 1 ? "movie" : "movies"} available
                            </p>
                        )}
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <MovieSkeleton key={index} />
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-2xl border border-[#49252D] bg-[#141720] px-6 py-12 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E53945]/10 text-[#FF6873]">
                            <Film size={22} />
                        </div>

                        <h3 className="font-semibold text-[#E8EAF0]">Unable to load movies</h3>

                        <p className="mt-1 text-sm text-[#858B99]">{error}</p>
                    </div>
                )}

                {/* Empty search */}
                {!loading && !error && filteredMovies.length === 0 && (
                    <div className="rounded-2xl border border-[#252832] bg-[#141720] px-6 py-16 text-center">
                        <Search className="mx-auto mb-4 h-8 w-8 text-[#555C69]" />

                        <h3 className="font-semibold text-[#E8EAF0]">No movies found</h3>

                        <p className="mt-1 text-sm text-[#858B99]">Try another title or choose a different genre.</p>

                        <button
                            onClick={() => {
                                setQuery("");
                                setSelectedGenre("All");
                            }}
                            className="mt-5 text-sm font-semibold text-[#FF6873] transition hover:text-[#E53945] hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Movie grid */}
                {!loading && !error && filteredMovies.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                        {filteredMovies.map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                )}

                {/* Bottom section */}
                {!loading && !error && movies.length > 0 && (
                    <div className="relative mt-12 overflow-hidden rounded-2xl border border-[#292D37] bg-[#141720] p-6 sm:p-8">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#E53945]/[0.07] blur-3xl" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#FF6873]">
                                    Your next movie night
                                </div>

                                <h3 className="text-xl font-bold text-[#E8EAF0] sm:text-2xl">
                                    Great movies. Great seats. Great memories.
                                </h3>

                                <p className="mt-2 max-w-lg text-sm leading-6 text-[#858B99]">
                                    Find a movie you love, explore the details and make your next cinema experience
                                    unforgettable.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setQuery("");
                                    setSelectedGenre("All");
                                    window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                    });
                                }}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E8EAF0] px-4 py-3 text-sm font-semibold text-[#0B0D12] transition hover:bg-white active:scale-[0.98]"
                            >
                                Explore movies
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
