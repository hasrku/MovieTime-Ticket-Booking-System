import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    LayoutDashboard,
    Film,
    CalendarClock,
    Plus,
    Trash2,
    Search,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    Sun,
    Moon,
    RefreshCw,
    Ticket,
    IndianRupee,
    Armchair,
    Trophy,
    X,
    Clock,
    Monitor,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

/* ================= Theme ================= */

const THEMES = {
    dark: {
        "--bg": "#0B0D12",
        "--card": "#141720",
        "--soft": "#1C212C",
        "--line": "#252832",
        "--text": "#E8EAF0",
        "--muted": "#949AA8",
        "--accent": "#E53945",
        "--accent-soft": "rgba(229,57,69,0.14)",
        "--accent-text": "#FF737D",
        "--good": "#34D399",
    },
    light: {
        "--bg": "#F5F6F8",
        "--card": "#FFFFFF",
        "--soft": "#EFF1F5",
        "--line": "#E2E5EB",
        "--text": "#151823",
        "--muted": "#5F6676",
        "--accent": "#D62F3C",
        "--accent-soft": "rgba(214,47,60,0.09)",
        "--accent-text": "#B91F2C",
        "--good": "#047857",
    },
};

const card = "rounded-2xl border border-[var(--line)] bg-[var(--card)]";
const control =
    "w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";
const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
const ghostBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--soft)] disabled:opacity-50";

const NAV = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "movies", label: "Movies", icon: Film },
    { id: "shows", label: "Shows", icon: CalendarClock },
];

const RATINGS = ["U", "UA 7+", "UA 13+", "UA 16+", "A", "PG-13", "R"];
const GENRES = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
];

/* ================= Helpers ================= */

const rupees = (value) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const number = (value) => new Intl.NumberFormat("en-IN").format(value);
const dateTime = (value) =>
    new Date(value).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
const isUpcoming = (show) => new Date(show.showTime).getTime() > Date.now();
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

// datetime-local needs LOCAL time. toISOString() would give UTC (5.5 hours off in India).
function toLocalInput(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function findMovie(movies, show) {
    return (
        movies.find((m) => show.movieId != null && m.id === show.movieId) ||
        movies.find((m) => show.movieSlug && m.slug === show.movieSlug) ||
        movies.find((m) => m.name === show.movieName)
    );
}

// Sales for one show, counted from its BOOKED seats. null = seat data unavailable.
function seatStats(show) {
    if (!show.tickets?.length) return null;
    const booked = show.tickets.filter((t) => t.status === "BOOKED");

    return {
        sold: booked.length,
        total: show.tickets.length,
        value: booked.reduce((sum, t) => sum + Number(t.price || show.ticketPrice || 0), 0),
    };
}

function addStats(list) {
    return list.reduce(
        (sum, show) => {
            const s = seatStats(show);
            if (!s) return { ...sum, missing: sum.missing + 1 };
            return { ...sum, sold: sum.sold + s.sold, total: sum.total + s.total, value: sum.value + s.value };
        },
        { sold: 0, total: 0, value: 0, missing: 0 },
    );
}

// If the list API has no seat data, load each show's details (6 at a time)
async function withSeatData(shows) {
    const result = [...shows];

    for (let start = 0; start < result.length; start += 6) {
        await Promise.all(
            result.slice(start, start + 6).map(async (show, offset) => {
                if (show.tickets?.length) return;
                try {
                    const detail = await apiFetch(`/api/shows/${show.id}`);
                    result[start + offset] = { ...show, tickets: detail?.tickets };
                } catch {
                    // The dashboard reports shows whose seat data couldn't be loaded
                }
            }),
        );
    }
    return result;
}

// Makes the dashboard exactly as tall as the space below your navbar
function useFillScreen() {
    const [node, setNode] = useState(null);
    const [top, setTop] = useState(0);

    useLayoutEffect(() => {
        if (!node) return;
        const measure = () => setTop(Math.max(0, Math.round(node.getBoundingClientRect().top + window.scrollY)));
        measure();
        window.addEventListener("resize", measure);
        const observer = new ResizeObserver(measure);
        observer.observe(document.body);
        return () => {
            window.removeEventListener("resize", measure);
            observer.disconnect();
        };
    }, [node]);

    return [setNode, `calc(100dvh - ${top}px)`];
}

/* ================= Shared UI ================= */

function Poster({ movie, className = "" }) {
    const [failedUrl, setFailedUrl] = useState("");
    const url = movie?.imageUrl;

    if (url && url !== failedUrl) {
        return (
            <img
                src={url}
                alt=""
                loading="lazy"
                onError={() => setFailedUrl(url)}
                className={`object-cover ${className}`}
            />
        );
    }
    return (
        <div className={`flex items-center justify-center bg-[var(--soft)] text-[var(--muted)] ${className}`}>
            <Film className="h-1/3 max-h-8 w-1/3 max-w-8" />
        </div>
    );
}

function PageHeader({ title, subtitle, children }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    );
}

function Segmented({ label, options, value, onChange }) {
    return (
        <div
            role="group"
            aria-label={label}
            className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--card)] p-1"
        >
            {options.map(([id, text]) => (
                <button
                    key={id}
                    type="button"
                    aria-pressed={value === id}
                    onClick={() => onChange(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        value === id ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                >
                    {text}
                </button>
            ))}
        </div>
    );
}

function SearchBox({ value, onChange, placeholder }) {
    return (
        <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
                type="search"
                aria-label={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${control} !pl-9`}
            />
        </div>
    );
}

function Empty({ icon: Icon, title, text, children }) {
    return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
            <Icon className="h-9 w-9 text-[var(--muted)]" />
            <p className="mt-3 font-bold">{title}</p>
            <p className="mt-1 max-w-xs text-sm text-[var(--muted)]">{text}</p>
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}

function Meter({ value, label }) {
    return (
        <div
            role="meter"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 overflow-hidden rounded-full bg-[var(--accent-soft)]"
        >
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${value}%` }} />
        </div>
    );
}

function Field({ label, error, hint, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">{label}</span>
            {children}
            {(error || hint) && (
                <span className={`mt-1 block text-xs ${error ? "text-[var(--accent-text)]" : "text-[var(--muted)]"}`}>
                    {error || hint}
                </span>
            )}
        </label>
    );
}

/* ================= Chart ================= */

function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;

    return (
        <div className="max-w-[220px] rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-xs text-[var(--text)] shadow-xl">
            <p className="font-bold">{row.name}</p>
            <p className="mt-1">
                {number(row.sold)} tickets • {rupees(row.value)}
            </p>
            <p className="text-[var(--muted)]">
                {percent(row.sold, row.total)}% full • {row.shows.length} show(s)
            </p>
        </div>
    );
}

// Vertical bar chart: movies along the bottom, bar height shows tickets or value
function MovieBarChart({ rows, metric }) {
    const names = new Map(rows.map((row) => [String(row.key), row.name]));
    const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
    const format = (v) => (metric === "sold" ? compact.format(v) : `₹${compact.format(v)}`);

    // Long movie names are shortened on the axis; the tooltip shows the full name
    const shorten = (key) => {
        const name = names.get(String(key)) || "";
        return name.length > 14 ? `${name.slice(0, 13)}…` : name;
    };

    return (
        <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 22, right: 4, bottom: 0, left: 0 }} accessibilityLayer>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    {/* The key is unique even if two movies share a name */}
                    <XAxis
                        dataKey={(row) => String(row.key)}
                        tickFormatter={shorten}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={64}
                        tickLine={false}
                        axisLine={{ stroke: "var(--line)" }}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <YAxis
                        allowDecimals={false}
                        width={48}
                        tickFormatter={format}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--soft)", opacity: 0.6 }} />
                    <Bar dataKey={metric} fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        <LabelList
                            dataKey={metric}
                            position="top"
                            formatter={format}
                            fill="var(--text)"
                            fontSize={11}
                            fontWeight={700}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ================= Overview ================= */

function StatTile({ icon: Icon, label, value, note }) {
    return (
        <div className={`${card} p-4`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
                    <Icon className="h-4 w-4 text-[var(--accent-text)]" />
                </span>
            </div>
            <p className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{note}</p>
        </div>
    );
}

function Overview({ movies, shows, goTo }) {
    const [range, setRange] = useState("all");
    const [metric, setMetric] = useState("sold");
    const [asTable, setAsTable] = useState(false);

    const inRange = shows.filter((s) => range === "all" || (range === "upcoming" ? isUpcoming(s) : !isUpcoming(s)));
    const totals = addStats(inRange);
    const hasData = totals.total > 0;

    // Group shows by movie
    const groups = new Map();
    inRange.forEach((show) => {
        const movie = findMovie(movies, show);
        const key = movie?.id ?? show.movieId ?? show.movieName;
        if (!groups.has(key)) groups.set(key, { key, movie, name: movie?.name || show.movieName, shows: [] });
        groups.get(key).shows.push(show);
    });
    const ranking = [...groups.values()]
        .map((g) => ({ ...g, ...addStats(g.shows) }))
        .filter((g) => g.total > 0)
        .sort((a, b) => b[metric] - a[metric] || b.sold - a.sold);

    const top = [...ranking].sort((a, b) => b.sold - a.sold || b.value - a.value)[0];
    const chartRows = ranking.slice(0, 6);
    const nextShows = shows
        .filter(isUpcoming)
        .sort((a, b) => new Date(a.showTime) - new Date(b.showTime))
        .slice(0, 4);

    return (
        <div className="space-y-4">
            <PageHeader title="Overview" subtitle="Ticket sales across your current shows">
                <Segmented
                    label="Show period"
                    value={range}
                    onChange={setRange}
                    options={[
                        ["all", "All shows"],
                        ["upcoming", "Upcoming"],
                        ["past", "Past"],
                    ]}
                />
            </PageHeader>

            {totals.missing > 0 && (
                <p className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    Seat data is missing for {totals.missing} show(s), so these totals are incomplete.
                </p>
            )}

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatTile
                    icon={Ticket}
                    label="Tickets sold"
                    value={hasData ? number(totals.sold) : "—"}
                    note="Booked seats"
                />
                <StatTile
                    icon={IndianRupee}
                    label="Booked value"
                    value={hasData ? rupees(totals.value) : "—"}
                    note="Estimated from seat prices"
                />
                <StatTile
                    icon={Armchair}
                    label="Occupancy"
                    value={hasData ? `${percent(totals.sold, totals.total)}%` : "—"}
                    note={hasData ? `${number(totals.sold)} of ${number(totals.total)} seats` : "No seat data"}
                />
                <StatTile
                    icon={CalendarClock}
                    label="Upcoming shows"
                    value={number(shows.filter(isUpcoming).length)}
                    note={`${number(movies.length)} movies in catalogue`}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                {/* Bar chart */}
                <section className={`${card} p-4 sm:p-5 xl:col-span-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="font-bold">
                                {metric === "sold" ? "Most purchased movies" : "Top movies by booked value"}
                            </h2>
                            <p className="text-xs text-[var(--muted)]">Top {chartRows.length || 6}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Segmented
                                label="Chart measure"
                                value={metric}
                                onChange={setMetric}
                                options={[
                                    ["sold", "Tickets"],
                                    ["value", "Value"],
                                ]}
                            />
                            <button
                                type="button"
                                onClick={() => setAsTable(!asTable)}
                                className="text-xs font-semibold text-[var(--accent-text)]"
                            >
                                {asTable ? "Chart" : "Table"}
                            </button>
                        </div>
                    </div>

                    {totals.sold === 0 ? (
                        <Empty
                            icon={Ticket}
                            title="No tickets sold yet"
                            text="Movies will be ranked here once seats are booked."
                        />
                    ) : asTable ? (
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left text-sm tabular-nums">
                                <thead className="text-xs text-[var(--muted)]">
                                    <tr>
                                        <th className="py-2">Movie</th>
                                        <th className="px-2">Tickets</th>
                                        <th className="px-2">Occupancy</th>
                                        <th className="text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((r) => (
                                        <tr key={r.key} className="border-t border-[var(--line)]">
                                            <td className="py-2 font-semibold">{r.name}</td>
                                            <td className="px-2">{number(r.sold)}</td>
                                            <td className="px-2">{percent(r.sold, r.total)}%</td>
                                            <td className="text-right">{rupees(r.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <MovieBarChart rows={chartRows} metric={metric} />
                    )}
                </section>

                {/* Best seller */}
                <section className={`${card} flex flex-col p-4 sm:p-5`}>
                    <h2 className="flex items-center gap-2 font-bold">
                        <Trophy className="h-4 w-4 text-amber-500" /> Best seller
                    </h2>
                    {top && top.sold > 0 ? (
                        <div className="mt-4 flex gap-4">
                            <Poster movie={top.movie} className="h-36 w-24 shrink-0 rounded-xl" />
                            <div className="min-w-0">
                                <p className="line-clamp-2 text-lg font-extrabold leading-snug">{top.name}</p>
                                <p className="mt-3 text-3xl font-extrabold">{number(top.sold)}</p>
                                <p className="text-xs text-[var(--muted)]">
                                    tickets sold • {percent(top.sold, totals.sold)}% of all sales
                                </p>
                                <p className="mt-2 text-sm font-semibold">{rupees(top.value)}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="m-auto py-8 text-sm text-[var(--muted)]">No sales yet.</p>
                    )}
                </section>
            </div>

            {/* Next shows */}
            <section className={`${card} p-4 sm:p-5`}>
                <div className="flex items-center justify-between">
                    <h2 className="font-bold">Coming up next</h2>
                    <button
                        type="button"
                        onClick={() => goTo("shows")}
                        className="text-xs font-semibold text-[var(--accent-text)]"
                    >
                        View all shows
                    </button>
                </div>
                {nextShows.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[var(--muted)]">No upcoming shows.</p>
                ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {nextShows.map((show) => {
                            const s = seatStats(show);
                            return (
                                <div key={show.id} className="rounded-xl bg-[var(--soft)] p-3">
                                    <p className="truncate text-sm font-bold">{show.movieName}</p>
                                    <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                                        {dateTime(show.showTime)} • {show.screenName}
                                    </p>
                                    <div className="mt-2.5">
                                        <Meter
                                            value={s ? percent(s.sold, s.total) : 0}
                                            label={`Seats sold for ${show.movieName}`}
                                        />
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                            {s ? `${s.sold}/${s.total} sold` : "Seat data unavailable"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

/* ================= Movies and Shows ================= */

function Movies({ movies, shows, onAdd, onSchedule, onDelete }) {
    const [query, setQuery] = useState("");
    const filtered = movies.filter((m) => m.name?.toLowerCase().includes(query.trim().toLowerCase()));

    return (
        <div className="space-y-4">
            <PageHeader title="Movies" subtitle={`${movies.length} in your catalogue`}>
                <SearchBox value={query} onChange={setQuery} placeholder="Search movies" />
                <button type="button" onClick={onAdd} className={primaryBtn}>
                    <Plus className="h-4 w-4" /> Add movie
                </button>
            </PageHeader>

            {filtered.length === 0 ? (
                <div className={card}>
                    <Empty
                        icon={Film}
                        title={query ? "No matches" : "No movies yet"}
                        text={query ? "Try a different name." : "Add your first movie to start scheduling shows."}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {filtered.map((movie) => {
                        const own = shows.filter((s) => findMovie(movies, s)?.id === movie.id);
                        return (
                            <article key={movie.id} className={`${card} group flex flex-col overflow-hidden`}>
                                <div className="relative">
                                    <Poster movie={movie} className="aspect-[4/5] w-full" />
                                    <button
                                        type="button"
                                        onClick={() => onDelete(movie)}
                                        aria-label={`Delete ${movie.name}`}
                                        className="absolute right-2 top-2 rounded-lg bg-black/65 p-2 text-white transition hover:bg-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="line-clamp-1 text-sm font-bold" title={movie.name}>
                                        {movie.name}
                                    </h3>
                                    <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">
                                        {[
                                            movie.adultRating,
                                            movie.durationMinutes && `${movie.durationMinutes} min`,
                                            movie.genres?.join(", "),
                                        ]
                                            .filter(Boolean)
                                            .join(" • ")}
                                    </p>
                                    <p className="mt-2 text-xs text-[var(--muted)]">
                                        {own.length} show(s) • {number(addStats(own).sold)} sold
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => onSchedule(movie)}
                                        className={`${ghostBtn} mt-3 !py-2 !text-xs`}
                                    >
                                        <CalendarClock className="h-3.5 w-3.5" /> Schedule
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Shows({ movies, shows, onAdd, onDelete }) {
    const [query, setQuery] = useState("");
    const [tab, setTab] = useState("upcoming");
    const text = query.trim().toLowerCase();

    const list = shows
        .filter((s) => isUpcoming(s) === (tab === "upcoming"))
        .filter((s) => `${s.movieName} ${s.screenName}`.toLowerCase().includes(text))
        .sort((a, b) => (new Date(a.showTime) - new Date(b.showTime)) * (tab === "upcoming" ? 1 : -1));

    const byDay = list.reduce((acc, show) => {
        const day = new Date(show.showTime).toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        (acc[day] = acc[day] || []).push(show);
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            <PageHeader title="Shows" subtitle="Your schedule, grouped by day">
                <SearchBox value={query} onChange={setQuery} placeholder="Search movie or screen" />
                <button type="button" onClick={onAdd} className={primaryBtn}>
                    <Plus className="h-4 w-4" /> Schedule show
                </button>
            </PageHeader>
            <Segmented
                label="Show time"
                value={tab}
                onChange={setTab}
                options={[
                    ["upcoming", "Upcoming"],
                    ["past", "Past"],
                ]}
            />

            {list.length === 0 ? (
                <div className={card}>
                    <Empty
                        icon={CalendarClock}
                        title="No shows found"
                        text={query ? "Try a different search." : `There are no ${tab} shows.`}
                    />
                </div>
            ) : (
                Object.entries(byDay).map(([day, dayShows]) => (
                    <section key={day}>
                        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{day}</h2>
                        <div className={`${card} divide-y divide-[var(--line)]`}>
                            {dayShows.map((show) => {
                                const s = seatStats(show);
                                return (
                                    <div key={show.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:px-4">
                                        <Poster
                                            movie={findMovie(movies, show)}
                                            className="h-14 w-10 shrink-0 rounded-lg"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold">{show.movieName}</p>
                                            <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(show.showTime).toLocaleTimeString(undefined, {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Monitor className="h-3 w-3" />
                                                    {show.screenName}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="w-24 shrink-0 sm:w-48">
                                            <p className="mb-1 text-xs tabular-nums text-[var(--muted)]">
                                                {s ? `${s.sold}/${s.total} sold` : "No seat data"}
                                                {s && (
                                                    <span className="float-right hidden sm:inline">
                                                        {percent(s.sold, s.total)}%
                                                    </span>
                                                )}
                                            </p>
                                            <Meter
                                                value={s ? percent(s.sold, s.total) : 0}
                                                label={`Seats sold for ${show.movieName}`}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(show)}
                                            aria-label={`Delete ${show.movieName} show`}
                                            className="shrink-0 rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}

/* ================= Step-by-step flows ================= */

// Shared frame: step list, validation, Back/Continue and publish
function Wizard({ title, steps, validate, onSubmit, onCancel, submitLabel, preview, children }) {
    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState("");
    const topRef = useRef(null);
    const last = step === steps.length - 1;

    useEffect(() => {
        topRef.current?.scrollIntoView({ block: "nearest" });
    }, [step]);

    // An error disappears as soon as its field is fixed
    const current = Object.keys(errors).length ? validate(step) : {};
    const visibleErrors = Object.fromEntries(
        Object.keys(errors)
            .filter((key) => current[key])
            .map((key) => [key, current[key]]),
    );

    const next = async (e) => {
        e.preventDefault();
        if (busy) return;
        setServerError("");

        // On the last step, recheck everything (e.g. the show time may have passed)
        const stepsToCheck = last ? steps.map((_, i) => i) : [step];
        for (const index of stepsToCheck) {
            const found = validate(index);
            if (Object.keys(found).length) {
                setErrors(found);
                setStep(index);
                return;
            }
        }
        setErrors({});
        if (!last) return setStep(step + 1);

        setBusy(true);
        try {
            await onSubmit();
        } catch (err) {
            setServerError(err.message);
            setBusy(false);
        }
    };

    return (
        <div ref={topRef} className="mx-auto max-w-5xl space-y-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    aria-label="Cancel and go back"
                    className={`${ghostBtn} !p-2.5`}
                >
                    <X className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-xl font-extrabold">{title}</h1>
                    <p className="text-xs text-[var(--muted)]">
                        Step {step + 1} of {steps.length}: {steps[step]}
                    </p>
                </div>
            </div>

            <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                {steps.map((name, index) => (
                    <li key={name} aria-current={index === step ? "step" : undefined}>
                        <div
                            className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--accent)]" : "bg-[var(--line)]"}`}
                        />
                        <p
                            className={`mt-1.5 hidden items-center gap-1 text-xs font-semibold sm:flex ${index <= step ? "" : "text-[var(--muted)]"}`}
                        >
                            {index < step && <Check className="h-3.5 w-3.5 text-[var(--good)]" />}
                            {name}
                        </p>
                    </li>
                ))}
            </ol>

            <div className={`grid items-start gap-4 ${preview ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""}`}>
                <form onSubmit={next} noValidate className={card}>
                    <div className="space-y-4 p-4 sm:p-6">{children(step, visibleErrors)}</div>

                    {serverError && (
                        <p
                            role="alert"
                            className="mx-4 mb-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-text)] sm:mx-6"
                        >
                            {serverError}
                        </p>
                    )}

                    {/* Stays visible at the bottom while a long step scrolls */}
                    <div className="sticky bottom-0 flex justify-between gap-3 rounded-b-2xl border-t border-[var(--line)] bg-[var(--card)] px-4 py-3 sm:px-6">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
                            className={ghostBtn}
                        >
                            <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
                        </button>
                        <button type="submit" disabled={busy} className={primaryBtn}>
                            {busy ? "Saving..." : last ? submitLabel : "Continue"}
                            {last ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                        </button>
                    </div>
                </form>
                {preview && <aside className="hidden lg:block">{preview}</aside>}
            </div>
        </div>
    );
}

function Review({ rows }) {
    return (
        <dl className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
            {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="shrink-0 text-[var(--muted)]">{label}</dt>
                    <dd className="break-words text-right font-semibold [overflow-wrap:anywhere]">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

function AddMovie({ onCancel, onDone }) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        imageUrl: "",
        adultRating: "UA 13+",
        genres: [],
        durationMinutes: "",
    });
    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    const toggleGenre = (genre) =>
        set("genres", form.genres.includes(genre) ? form.genres.filter((g) => g !== genre) : [...form.genres, genre]);

    const validate = (step) => {
        const errors = {};
        if (step === 0) {
            const minutes = Number(form.durationMinutes);
            if (!form.name.trim()) errors.name = "Enter the movie name";
            if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600)
                errors.durationMinutes = "Enter 1 to 600 minutes";
            if (!form.genres.length) errors.genres = "Pick at least one genre";
        }
        if (step === 1 && form.imageUrl.trim() && !/^https?:\/\/\S+$/i.test(form.imageUrl.trim())) {
            errors.imageUrl = "Enter a link starting with http:// or https://";
        }
        return errors;
    };

    const submit = async () => {
        const created = await apiFetch("/api/admin/movies", {
            method: "POST",
            body: JSON.stringify({
                ...form,
                name: form.name.trim(),
                description: form.description.trim(),
                imageUrl: form.imageUrl.trim(),
                durationMinutes: Number(form.durationMinutes),
            }),
        });
        onDone(`"${created?.name || form.name}" was added.`);
    };

    const preview = (
        <div className={`${card} overflow-hidden`}>
            <p className="px-4 py-2.5 text-xs font-bold text-[var(--muted)]">Live preview</p>
            <Poster movie={form} className="h-60 w-full" />
            <div className="p-4">
                <p className="font-extrabold">{form.name || "Movie name"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                    {[form.adultRating, form.durationMinutes && `${form.durationMinutes} min`, form.genres.join(", ")]
                        .filter(Boolean)
                        .join(" • ")}
                </p>
            </div>
        </div>
    );

    return (
        <Wizard
            title="Add a movie"
            steps={["Basics", "Poster & story", "Review"]}
            validate={validate}
            onSubmit={submit}
            onCancel={onCancel}
            submitLabel="Publish movie"
            preview={preview}
        >
            {(step, errors) => (
                <>
                    {step === 0 && (
                        <>
                            <Field label="Movie name *" error={errors.name}>
                                <input
                                    autoFocus
                                    className={control}
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                    placeholder="e.g. Interstellar"
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Duration (minutes) *" error={errors.durationMinutes}>
                                    <input
                                        type="number"
                                        min="1"
                                        max="600"
                                        className={control}
                                        value={form.durationMinutes}
                                        onChange={(e) => set("durationMinutes", e.target.value)}
                                        placeholder="135"
                                    />
                                </Field>
                                <Field label="Age rating">
                                    <select
                                        className={control}
                                        value={form.adultRating}
                                        onChange={(e) => set("adultRating", e.target.value)}
                                    >
                                        {RATINGS.map((r) => (
                                            <option key={r}>{r}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <div>
                                <p className="mb-2 text-xs font-semibold">Genres *</p>
                                <div className="flex flex-wrap gap-2">
                                    {GENRES.map((genre) => {
                                        const on = form.genres.includes(genre);
                                        return (
                                            <button
                                                key={genre}
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() => toggleGenre(genre)}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]"}`}
                                            >
                                                {genre}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.genres && (
                                    <p className="mt-1.5 text-xs text-[var(--accent-text)]">{errors.genres}</p>
                                )}
                            </div>
                        </>
                    )}
                    {step === 1 && (
                        <>
                            <Field
                                label="Poster image link"
                                error={errors.imageUrl}
                                hint="Optional. A tall (2:3) image works best."
                            >
                                <input
                                    type="url"
                                    autoFocus
                                    className={control}
                                    value={form.imageUrl}
                                    onChange={(e) => set("imageUrl", e.target.value)}
                                    placeholder="https://example.com/poster.jpg"
                                />
                            </Field>
                            <Poster movie={form} className="mx-auto h-44 w-32 rounded-xl lg:hidden" />
                            <Field label="Description" hint={`Optional • ${form.description.length}/1000`}>
                                <textarea
                                    rows={5}
                                    maxLength={1000}
                                    className={`${control} resize-none`}
                                    value={form.description}
                                    onChange={(e) => set("description", e.target.value)}
                                    placeholder="Short synopsis of the movie"
                                />
                            </Field>
                        </>
                    )}
                    {step === 2 && (
                        <Review
                            rows={[
                                ["Name", form.name],
                                ["Duration", `${form.durationMinutes} min`],
                                ["Age rating", form.adultRating],
                                ["Genres", form.genres.join(", ")],
                                ["Poster", form.imageUrl || "Not added"],
                                ["Description", form.description || "Not added"],
                            ]}
                        />
                    )}
                </>
            )}
        </Wizard>
    );
}

function ScheduleShow({ movies, shows, initialMovie, onCancel, onDone }) {
    const [query, setQuery] = useState("");
    const [form, setForm] = useState(() => {
        const tomorrow = new Date(Date.now() + 86400000);
        tomorrow.setHours(18, 0, 0, 0);
        return {
            movieId: initialMovie?.id ?? "",
            screenName: "",
            showTime: toLocalInput(tomorrow),
            ticketPrice: "200",
            rows: 6,
            seatsPerRow: 8,
        };
    });
    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const movie = movies.find((m) => m.id === form.movieId);
    const screens = [...new Set(shows.map((s) => s.screenName).filter(Boolean))];
    const rows = Math.min(12, Math.max(0, Math.floor(Number(form.rows)) || 0));
    const perRow = Math.min(14, Math.max(0, Math.floor(Number(form.seatsPerRow)) || 0));
    const wholeBetween = (value, min, max) =>
        Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

    const validate = (step) => {
        const errors = {};
        if (step === 0 && !movie) errors.movieId = "Choose a movie to continue";
        if (step === 1) {
            if (!form.screenName.trim()) errors.screenName = "Enter the screen name";
            if (!(new Date(form.showTime).getTime() > Date.now())) errors.showTime = "Choose a future date and time";
        }
        if (step === 2) {
            if (!(Number(form.ticketPrice) > 0)) errors.ticketPrice = "Enter a price above 0";
            if (!wholeBetween(form.rows, 1, 12)) errors.rows = "Enter 1 to 12";
            if (!wholeBetween(form.seatsPerRow, 2, 14)) errors.seatsPerRow = "Enter 2 to 14";
        }
        return errors;
    };

    const submit = async () => {
        await apiFetch("/api/admin/shows", {
            method: "POST",
            body: JSON.stringify({
                movieId: form.movieId,
                screenName: form.screenName.trim(),
                showTime: new Date(form.showTime).toISOString(),
                ticketPrice: Number(form.ticketPrice),
                rows: Number(form.rows),
                seatsPerRow: Number(form.seatsPerRow),
            }),
        });
        onDone(`Show for "${movie.name}" was scheduled.`);
    };

    const matches = movies.filter((m) => m.name?.toLowerCase().includes(query.trim().toLowerCase()));

    return (
        <Wizard
            title="Schedule a show"
            steps={["Movie", "Screen & time", "Seats & price", "Review"]}
            validate={validate}
            onSubmit={submit}
            onCancel={onCancel}
            submitLabel="Publish show"
        >
            {(step, errors) => (
                <>
                    {step === 0 &&
                        (movies.length === 0 ? (
                            <Empty
                                icon={Film}
                                title="Add a movie first"
                                text="You need at least one movie before scheduling a show."
                            />
                        ) : (
                            <>
                                <SearchBox value={query} onChange={setQuery} placeholder="Search movies" />
                                {errors.movieId && (
                                    <p role="alert" className="text-sm text-[var(--accent-text)]">
                                        {errors.movieId}
                                    </p>
                                )}
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                    {matches.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            aria-pressed={form.movieId === m.id}
                                            onClick={() => set("movieId", m.id)}
                                            className={`relative overflow-hidden rounded-xl border-2 text-left transition ${form.movieId === m.id ? "border-[var(--accent)]" : "border-transparent hover:border-[var(--line)]"}`}
                                        >
                                            <Poster movie={m} className="aspect-[2/3] w-full" />
                                            <span className="block truncate bg-[var(--soft)] px-2 py-1.5 text-xs font-semibold">
                                                {m.name}
                                            </span>
                                            {form.movieId === m.id && (
                                                <span className="absolute right-1.5 top-1.5 rounded-full bg-[var(--accent)] p-1 text-white">
                                                    <Check className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ))}

                    {step === 1 && (
                        <>
                            <Field label="Screen name *" error={errors.screenName}>
                                <input
                                    autoFocus
                                    list="screen-names"
                                    className={control}
                                    value={form.screenName}
                                    onChange={(e) => set("screenName", e.target.value)}
                                    placeholder="e.g. IMAX Laser - Hall 1"
                                />
                                <datalist id="screen-names">
                                    {screens.map((s) => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                            </Field>
                            <Field label="Date and time *" error={errors.showTime} hint="Uses your local time">
                                <input
                                    type="datetime-local"
                                    min={toLocalInput(new Date())}
                                    className={`${control} [color-scheme:inherit]`}
                                    value={form.showTime}
                                    onChange={(e) => set("showTime", e.target.value)}
                                />
                            </Field>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    ["ticketPrice", "Base price (₹) *", 1, undefined],
                                    ["rows", "Rows (1–12) *", 1, 12],
                                    ["seatsPerRow", "Seats per row (2–14) *", 2, 14],
                                ].map(([key, label, min, max]) => (
                                    <Field key={key} label={label} error={errors[key]}>
                                        <input
                                            type="number"
                                            min={min}
                                            max={max}
                                            className={control}
                                            value={form[key]}
                                            onChange={(e) => set(key, e.target.value)}
                                        />
                                    </Field>
                                ))}
                            </div>
                            <div className="rounded-xl bg-[var(--bg)] p-4">
                                <div className="mx-auto mb-1 h-1 w-2/3 rounded-full bg-[var(--accent)]" />
                                <p className="mb-3 text-center text-[10px] uppercase tracking-widest text-[var(--muted)]">
                                    Screen
                                </p>
                                <div
                                    aria-hidden="true"
                                    className="mx-auto grid max-w-sm gap-1"
                                    style={{ gridTemplateColumns: `repeat(${perRow || 1}, minmax(0, 1fr))` }}
                                >
                                    {Array.from({ length: rows * perRow }, (_, i) => (
                                        <span key={i} className="h-3.5 rounded-t bg-[var(--line)]" />
                                    ))}
                                </div>
                                <p className="mt-3 text-center text-sm font-bold">{rows * perRow} seats</p>
                                <p className="text-center text-xs text-[var(--muted)]">
                                    Layout preview. Your server sets seat types and final prices.
                                </p>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <Review
                            rows={[
                                ["Movie", movie?.name || "Not selected"],
                                ["Screen", form.screenName],
                                ["Date and time", dateTime(form.showTime)],
                                ["Base price", rupees(Number(form.ticketPrice))],
                                ["Seats", `${rows} rows × ${perRow} = ${rows * perRow}`],
                            ]}
                        />
                    )}
                </>
            )}
        </Wizard>
    );
}

/* ================= Page ================= */

function ConfirmDelete({ target, busy, error, onCancel, onConfirm }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && !busy && onCancel();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [busy, onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-title"
                className={`${card} w-full max-w-sm p-5 shadow-2xl`}
            >
                <h2 id="delete-title" className="text-lg font-bold">
                    Delete this {target.type}?
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                    <strong className="text-[var(--text)]">{target.name}</strong> will be deleted. This may affect
                    related shows or bookings and can't be undone here.
                </p>
                {error && (
                    <p role="alert" className="mt-3 text-sm text-[var(--accent-text)]">
                        {error}
                    </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" autoFocus disabled={busy} onClick={onCancel} className={ghostBtn}>
                        Keep it
                    </button>
                    <button type="button" disabled={busy} onClick={onConfirm} className={primaryBtn}>
                        {busy ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const { isAdmin } = useAuth();
    const [fillRef, height] = useFillScreen();
    const mainRef = useRef(null);
    const requestRef = useRef(0);

    const [theme, setTheme] = useState("dark");
    const [view, setView] = useState({ name: "overview" });
    const [data, setData] = useState({ movies: [], shows: [] });
    const [status, setStatus] = useState("loading"); // loading | ready | error
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [toast, setToast] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const loadData = useCallback(async () => {
        const request = ++requestRef.current; // only the newest request may update the page
        setRefreshing(true);
        setLoadError("");
        try {
            const [movies, shows] = await Promise.all([apiFetch("/api/movies"), apiFetch("/api/shows")]);
            const detailed = await withSeatData(shows || []);
            if (request !== requestRef.current) return;
            setData({ movies: movies || [], shows: detailed });
            setStatus("ready");
        } catch (err) {
            if (request !== requestRef.current) return;
            setLoadError(err.message);
            setStatus((previous) => (previous === "ready" ? "ready" : "error"));
        } finally {
            if (request === requestRef.current) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) loadData();
    }, [isAdmin, loadData]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(""), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        mainRef.current?.scrollTo(0, 0);
    }, [view.name]);

    const closeDelete = useCallback(() => {
        setTarget(null);
        setDeleteError("");
    }, []);

    const confirmDelete = async () => {
        setDeleting(true);
        setDeleteError("");
        try {
            await apiFetch(`/api/admin/${target.type}s/${target.id}`, { method: "DELETE" });
            setToast(`${target.name} was deleted.`);
            closeDelete();
            loadData();
        } catch (err) {
            setDeleteError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const goTo = (name, extra) => setView({ name, ...extra });
    const finish = (nextView) => (message) => {
        setToast(message);
        goTo(nextView);
        loadData();
    };
    const activeNav = { "add-movie": "movies", "add-show": "shows" }[view.name] || view.name;
    const themeStyle = { ...THEMES[theme], colorScheme: theme };

    if (!isAdmin) {
        return (
            <div
                style={themeStyle}
                className="flex min-h-[70vh] items-center justify-center bg-[var(--bg)] p-4 text-[var(--text)]"
            >
                <div className={card}>
                    <Empty
                        icon={ShieldCheck}
                        title="Admin access required"
                        text="You don't have permission to view this page."
                    />
                </div>
            </div>
        );
    }

    const navButtons = NAV.map(({ id, label, icon: Icon }) => (
        <button
            key={id}
            type="button"
            aria-current={activeNav === id ? "page" : undefined}
            onClick={() => goTo(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:flex-none lg:justify-start ${
                activeNav === id
                    ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                    : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--text)]"
            }`}
        >
            <Icon className="h-4 w-4" /> {label}
        </button>
    ));

    const tools = (
        <>
            <button
                type="button"
                onClick={loadData}
                disabled={refreshing}
                aria-label="Refresh data"
                title="Refresh data"
                className={`${ghostBtn} !p-2.5`}
            >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title="Change theme"
                className={`${ghostBtn} !p-2.5`}
            >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
        </>
    );

    return (
        <div
            ref={fillRef}
            style={{ ...themeStyle, height }}
            className="flex flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] lg:flex-row"
        >
            {/* Sidebar on large screens, top tabs on small ones */}
            <aside className="shrink-0 border-b border-[var(--line)] bg-[var(--card)] p-2 lg:flex lg:w-56 lg:flex-col lg:border-b-0 lg:border-r lg:p-4">
                <div className="mb-6 hidden items-center gap-2.5 px-2 lg:flex">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-sm font-extrabold">movietime</p>
                        <p className="text-xs text-[var(--muted)]">Admin console</p>
                    </div>
                </div>
                <nav aria-label="Admin sections" className="flex gap-1 lg:flex-col">
                    {navButtons}
                </nav>
                <div className="mt-auto hidden gap-2 lg:flex">{tools}</div>
            </aside>

            <main ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-5">
                <div className="mb-3 flex justify-end gap-2 lg:hidden">{tools}</div>

                {loadError && status === "ready" && (
                    <p
                        role="alert"
                        className="mb-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-text)]"
                    >
                        Couldn't refresh: {loadError}. Showing the last loaded data.
                    </p>
                )}

                {status === "loading" ? (
                    <div
                        role="status"
                        aria-label="Loading dashboard"
                        className="grid animate-pulse grid-cols-2 gap-3 xl:grid-cols-4"
                    >
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className={`${card} h-28`} />
                        ))}
                        <div className={`${card} col-span-2 h-72 xl:col-span-4`} />
                    </div>
                ) : status === "error" ? (
                    <div className={card}>
                        <Empty icon={AlertCircle} title="Couldn't load the dashboard" text={loadError}>
                            <button type="button" onClick={loadData} className={primaryBtn}>
                                Try again
                            </button>
                        </Empty>
                    </div>
                ) : view.name === "overview" ? (
                    <Overview {...data} goTo={goTo} />
                ) : view.name === "movies" ? (
                    <Movies
                        {...data}
                        onAdd={() => goTo("add-movie")}
                        onSchedule={(movie) => goTo("add-show", { movie })}
                        onDelete={(m) => setTarget({ type: "movie", id: m.id, name: m.name })}
                    />
                ) : view.name === "shows" ? (
                    <Shows
                        {...data}
                        onAdd={() => goTo("add-show")}
                        onDelete={(s) =>
                            setTarget({ type: "show", id: s.id, name: `${s.movieName}, ${dateTime(s.showTime)}` })
                        }
                    />
                ) : view.name === "add-movie" ? (
                    <AddMovie onCancel={() => goTo("movies")} onDone={finish("movies")} />
                ) : (
                    <ScheduleShow
                        {...data}
                        initialMovie={view.movie}
                        onCancel={() => goTo("shows")}
                        onDone={finish("shows")}
                    />
                )}
            </main>

            {toast && (
                <div
                    role="status"
                    className="fixed bottom-4 right-4 z-40 flex max-w-sm items-start gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm shadow-2xl"
                >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--good)]" />
                    {toast}
                </div>
            )}

            {target && (
                <ConfirmDelete
                    target={target}
                    busy={deleting}
                    error={deleteError}
                    onCancel={closeDelete}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
}
