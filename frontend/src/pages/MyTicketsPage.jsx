import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Calendar,
    Ticket,
    Clock,
    Armchair,
    ArrowRight,
    Clapperboard,
    Popcorn,
    ShieldCheck,
    XCircle,
    RotateCw,
} from "lucide-react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80";

const CURRENCY = "INR"; // change to "INR" if your amounts are in rupees

// A show stays in "Upcoming" this long after it starts, so the ticket
// doesn't move to history while the movie is still playing.
const SHOW_GRACE_MS = 3 * 60 * 60 * 1000;

const STATUS = {
    success: {
        styles: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        Icon: ShieldCheck,
    },
    failed: {
        styles: "border-red-500/20 bg-red-500/10 text-red-400",
        Icon: XCircle,
    },
    pending: {
        styles: "border-amber-500/20 bg-amber-500/10 text-amber-400",
        Icon: Clock,
    },
    unknown: {
        styles: "border-[#3A404D] bg-[#1C212C] text-[#A3A8B4]",
        Icon: Ticket,
    },
};

const STATUS_MAP = {
    CONFIRMED: STATUS.success,
    SUCCESS: STATUS.success,
    CANCELLED: STATUS.failed,
    FAILED: STATUS.failed,
    PENDING: STATUS.pending,
};

/* ---------- Helpers ---------- */

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = parseDate(value);
    if (!date) return "N/A";

    return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(value) {
    const date = parseDate(value);
    if (!date) return "N/A";

    return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatAmount(value) {
    if (value === null || value === undefined || value === "") return "N/A";

    const amount = Number(value);
    if (!Number.isFinite(amount)) return "N/A";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: CURRENCY,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatReference(id) {
    if (id === null || id === undefined || id === "") return "N/A";

    const text = String(id); // works for both number and string IDs
    return text.length > 16 ? `${text.slice(0, 16)}...` : text;
}

function isCancelled(booking) {
    return STATUS_MAP[booking.status?.toUpperCase()] === STATUS.failed;
}

function isPastShow(booking, now) {
    const showDate = parseDate(booking.showTime);
    // Unknown dates stay in "Upcoming" so a valid ticket is never hidden
    return showDate ? showDate.getTime() + SHOW_GRACE_MS < now : false;
}

// direction: 1 = earliest first, -1 = latest first. Unknown dates go last.
function sortByShowTime(list, direction) {
    return [...list].sort((a, b) => {
        const first = parseDate(a.showTime);
        const second = parseDate(b.showTime);

        if (!first && !second) return 0;
        if (!first) return 1;
        if (!second) return -1;

        return (first - second) * direction;
    });
}

function groupBookings(bookings) {
    const now = Date.now();
    const upcoming = [];
    const history = [];

    bookings.forEach((booking) => {
        const inHistory = isCancelled(booking) || isPastShow(booking, now);
        (inHistory ? history : upcoming).push(booking);
    });

    return {
        upcoming: sortByShowTime(upcoming, 1),
        history: sortByShowTime(history, -1),
    };
}

/* ---------- Ticket parts ---------- */

// Horizontal on mobile and tablet, vertical on large screens.
// Each notch is clipped to its inner half so it "cuts" the card border cleanly.
function TicketDivider() {
    const notch = "absolute z-10 h-6 w-6 rounded-full border border-[#252832] bg-[#0B0D12]";

    return (
        <div aria-hidden="true" className="relative h-0 w-full shrink-0 lg:h-auto lg:w-0 lg:self-stretch">
            {/* Dotted line */}
            <div className="absolute inset-x-5 top-0 border-t-2 border-dotted border-[#454B58] lg:inset-x-auto lg:inset-y-5 lg:left-0 lg:border-l-2 lg:border-t-0" />

            {/* Mobile notches: left and right */}
            <span className={`${notch} -left-[13px] -top-3 [clip-path:inset(0_0_0_50%)] lg:hidden`} />
            <span className={`${notch} -right-[13px] -top-3 [clip-path:inset(0_50%_0_0)] lg:hidden`} />

            {/* Desktop notches: top and bottom */}
            <span className={`${notch} -left-3 -top-[13px] hidden [clip-path:inset(50%_0_0_0)] lg:block`} />
            <span className={`${notch} -bottom-[13px] -left-3 hidden [clip-path:inset(0_0_50%_0)] lg:block`} />
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1C212C] text-[#FF6873]">
                <Icon size={16} />
            </div>

            <div>
                <p className="text-[10px] uppercase tracking-wider text-[#777D8B]">{label}</p>
                <p className="text-xs font-semibold text-[#D5D8E0]">{value}</p>
            </div>
        </div>
    );
}

function TicketSkeleton() {
    return (
        <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-[#252832] bg-[#141720] lg:max-w-none lg:flex-row">
            <div className="h-48 w-full animate-pulse bg-[#202530] lg:h-auto lg:w-44" />

            <div className="flex-1 space-y-4 p-5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#252A35]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#202530]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[#202530]" />
                <div className="h-7 w-1/3 animate-pulse rounded bg-[#252A35]" />
            </div>

            <div className="h-28 animate-pulse border-t-2 border-dotted border-[#454B58] bg-[#11141B] lg:h-auto lg:w-56 lg:border-l-2 lg:border-t-0" />
        </div>
    );
}

function BookingCard({ booking }) {
    const seats = booking.seats || [];
    const { styles, Icon: StatusIcon } = STATUS_MAP[booking.status?.toUpperCase()] || STATUS.unknown;
    const inactive = isCancelled(booking) || isPastShow(booking, Date.now());
    const titleStyles = "line-clamp-2 text-base font-bold leading-snug text-[#E8EAF0] sm:text-lg";

    return (
        // No overflow-hidden here, so the notches can cover the card border
        <article className="group relative mx-auto flex h-full w-full max-w-sm flex-col rounded-2xl border border-[#252832] bg-[#141720] transition duration-300 hover:shadow-xl hover:shadow-black/20 lg:max-w-none lg:flex-row">
            {/* Movie poster */}
            <div className="relative isolate h-48 w-full shrink-0 overflow-hidden rounded-t-[15px] bg-[#1C212C] lg:h-auto lg:w-44 lg:rounded-l-[15px] lg:rounded-tr-none">
                <img
                    src={booking.movieImageUrl || FALLBACK_IMAGE}
                    alt={booking.movieName || "Movie poster"}
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.onerror = null; // prevents an endless error loop
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                        inactive ? "grayscale" : ""
                    }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Main booking information */}
            <div className="flex min-w-0 flex-1 flex-col justify-between p-5 lg:py-6">
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            {booking.movieSlug ? (
                                <Link
                                    to={`/movies/${booking.movieSlug}`}
                                    className={`${titleStyles} transition hover:text-[#FF6873]`}
                                >
                                    {booking.movieName || "Untitled movie"}
                                </Link>
                            ) : (
                                <h3 className={titleStyles}>{booking.movieName || "Untitled movie"}</h3>
                            )}

                            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#858B99]">
                                <Clapperboard size={13} className="shrink-0 text-[#E53945]" />
                                <span className="truncate">{booking.screenName || "Screen not assigned"}</span>
                            </div>
                        </div>

                        <span
                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles}`}
                        >
                            <StatusIcon size={13} />
                            {booking.status || "Unknown"}
                        </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-4">
                        <InfoItem icon={Calendar} label="Date" value={formatDate(booking.showTime)} />
                        <InfoItem icon={Clock} label="Showtime" value={formatTime(booking.showTime)} />
                    </div>
                </div>

                {/* Seats */}
                <div className="mt-5">
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#777D8B]">
                        <Armchair size={12} />
                        {seats.length > 0 ? `Your seats (${seats.length})` : "Your seats"}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {seats.length > 0 ? (
                            seats.map((seat) => (
                                <span
                                    key={seat}
                                    className="rounded-md border border-[#3A3035] bg-[#E53945]/10 px-2.5 py-1 text-[11px] font-bold text-[#FF6873]"
                                >
                                    {seat}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-[#777D8B]">Seat information unavailable</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Divider sits between the details and the stub */}
            <TicketDivider />

            {/* Ticket stub: price and booking reference */}
            <div className="flex shrink-0 flex-col justify-between rounded-b-[15px] bg-[#11141B] px-5 py-5 lg:w-56 lg:rounded-r-[15px] lg:rounded-bl-none lg:px-6 lg:py-6">
                <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#777D8B]">Total amount</p>
                    <p className="mt-1 text-2xl font-extrabold text-[#E8EAF0]">{formatAmount(booking.totalAmount)}</p>
                </div>

                <div className="mt-4 lg:mt-8 lg:border-t lg:border-[#252832] lg:pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#777D8B]">
                        Booking reference
                    </p>
                    <p
                        title={String(booking.id ?? "")}
                        className="mt-1 break-all font-mono text-xs font-medium text-[#A3A8B4]"
                    >
                        {formatReference(booking.id)}
                    </p>
                    <p className="mt-3 text-[10px] text-[#777D8B]">Booked on {formatDate(booking.createdAt)}</p>
                </div>
            </div>
        </article>
    );
}

/* ---------- Page states ---------- */

const primaryButton =
    "mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E53945] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#CA2C38] active:scale-[0.98]";

function StatePanel({ icon: Icon, title, message, children }) {
    return (
        <div className="rounded-2xl border border-[#252832] bg-[#141720] px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C212C] text-[#777D8B]">
                <Icon size={30} />
            </div>
            <h2 className="text-lg font-bold text-[#E8EAF0]">{title}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#858B99]">{message}</p>
            {children}
        </div>
    );
}

/* ---------- Data hook ---------- */

function useMyBookings(isAuthenticated) {
    // null means "still loading"
    const [result, setResult] = useState(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setResult(null); // also clears old data after logout
        if (!isAuthenticated) return;

        let ignore = false; // blocks stale or unmounted updates

        apiFetch("/api/bookings/my")
            .then((data) => {
                if (data && !Array.isArray(data)) {
                    throw new Error("Unexpected response from the server.");
                }
                if (!ignore) setResult({ bookings: data || [], error: "" });
            })
            .catch((e) => {
                if (!ignore) {
                    setResult({ bookings: [], error: e?.message || "Something went wrong." });
                }
            });

        return () => {
            ignore = true;
        };
    }, [isAuthenticated, attempt]);

    return {
        bookings: result?.bookings || [],
        error: result?.error || "",
        loading: result === null,
        retry: () => setAttempt((n) => n + 1),
    };
}

/* ---------- Page ---------- */

export default function MyTicketsPage() {
    const { isAuthenticated } = useAuth();
    const { bookings, loading, error, retry } = useMyBookings(isAuthenticated);
    const [selectedTab, setSelectedTab] = useState(null);

    const groups = groupBookings(bookings);

    // Until the user picks a tab, open the one that has something to show
    const activeTab = selectedTab ?? (groups.upcoming.length > 0 ? "upcoming" : "history");
    const visibleBookings = groups[activeTab];

    const tabs = [
        { id: "upcoming", label: "Upcoming" },
        { id: "history", label: "Past & cancelled" },
    ];

    function renderContent() {
        if (!isAuthenticated) {
            return (
                <StatePanel
                    icon={Ticket}
                    title="Sign in to view your tickets"
                    message="Your movie bookings will appear here. Sign in to access your cinema tickets."
                >
                    <Link to="/login" className={primaryButton}>
                        Sign In
                        <ArrowRight size={16} />
                    </Link>
                </StatePanel>
            );
        }

        if (loading) {
            return (
                <div role="status" aria-label="Loading your bookings" className="space-y-5">
                    {[1, 2, 3].map((n) => (
                        <TicketSkeleton key={n} />
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <StatePanel icon={Ticket} title="Unable to load your bookings" message={error}>
                    <button type="button" onClick={retry} className={primaryButton}>
                        <RotateCw size={16} />
                        Try again
                    </button>
                </StatePanel>
            );
        }

        if (bookings.length === 0) {
            return (
                <StatePanel
                    icon={Popcorn}
                    title="No bookings yet"
                    message="Your next movie adventure is waiting. Explore what's showing and book your first ticket."
                >
                    <Link to="/" className={primaryButton}>
                        Browse Movies
                        <ArrowRight size={16} />
                    </Link>
                </StatePanel>
            );
        }

        return (
            <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-1 rounded-xl border border-[#252832] bg-[#141720] p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                aria-pressed={activeTab === tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                    activeTab === tab.id
                                        ? "bg-[#E53945] text-white"
                                        : "text-[#858B99] hover:text-[#E8EAF0]"
                                }`}
                            >
                                {tab.label} ({groups[tab.id].length})
                            </button>
                        ))}
                    </div>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6873] transition hover:text-[#E53945]"
                    >
                        Book another
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {visibleBookings.length > 0 ? (
                    // 1 column on phones, 2 vertical tickets on tablets, 1 horizontal on large screens
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
                        {visibleBookings.map((booking) => (
                            <BookingCard key={booking.id} booking={booking} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-[#252832] bg-[#141720] px-6 py-12 text-center text-sm text-[#858B99]">
                        {activeTab === "upcoming" ? "You have no upcoming shows." : "No past or cancelled bookings."}
                    </p>
                )}
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0B0D12] text-[#E8EAF0]">
            {/* Page header */}
            <div className="border-b border-[#252832] bg-[#0D0F14]">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF6873]">
                            <Ticket size={14} />
                            Your cinema experience
                        </div>

                        <h1 className="text-2xl font-extrabold tracking-tight text-[#E8EAF0] sm:text-3xl">
                            My Bookings
                        </h1>

                        <p className="mt-1 text-sm text-[#858B99]">Your movie tickets, all in one place.</p>
                    </div>

                    <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-[#3A3035] bg-[#E53945]/10 text-[#FF6873] sm:flex">
                        <Popcorn size={23} />
                    </div>
                </div>
            </div>

            {/* Notch colour matches this page background (#0B0D12) */}
            <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9">{renderContent()}</div>
        </main>
    );
}
