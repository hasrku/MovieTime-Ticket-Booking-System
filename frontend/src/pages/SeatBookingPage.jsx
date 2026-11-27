import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Ticket,
    Wifi,
    WifiOff,
    Clock,
    Monitor,
    Armchair,
    ChevronRight,
    ShieldCheck,
    Film,
    CalendarDays,
    LockKeyhole,
    Copy,
    Check,
    ArrowRight,
} from "lucide-react";
import { apiFetch, WS_URL } from "../api/client";
import { useAuth } from "../context/AuthContext";

const formatShowTime = (value) =>
    new Date(value).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

function SeatBookingSkeleton() {
    return (
        <div className="h-[calc(100dvh-5rem)] overflow-hidden bg-[#0B0D12] text-[#E8EAF0]">
            <div className="border-b border-[#252832] bg-[#0D0F14]">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5">
                    <div className="h-4 w-20 rounded bg-[#20242E] animate-pulse mb-4" />
                    <div className="h-6 w-56 rounded bg-[#20242E] animate-pulse" />
                </div>
            </div>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
                <div className="h-24 rounded-2xl border border-[#252832] bg-[#141720] animate-pulse" />
                <div className="h-[480px] rounded-2xl border border-[#252832] bg-[#141720] animate-pulse" />
            </div>
        </div>
    );
}

function SeatLegend({ className = "" }) {
    const items = [
        {
            label: "Available",
            style: "border-[#414653] bg-[#1C212C]",
        },
        {
            label: "VIP",
            style: "border-amber-500/50 bg-amber-500/10",
        },
        {
            label: "Selected",
            style: "border-[#E53945] bg-[#E53945]",
        },
        {
            label: "Held",
            style: "border-orange-500/50 bg-orange-500/15",
        },
        {
            label: "Booked",
            style: "border-[#292D37] bg-[#20242E]",
        },
    ];

    return (
        <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 ${className}`}>
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                    <span className={`h-3.5 w-3.5 rounded-[4px] border ${item.style}`} />
                    <span className="text-xs text-[#858B99]">{item.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ---------- Layout hooks ---------- */

// Makes an element exactly as tall as the space left below your navbar
function useFillScreen() {
    const [node, setNode] = useState(null);
    const [top, setTop] = useState(0);

    useLayoutEffect(() => {
        if (!node) return;

        const measure = () => setTop(Math.max(0, Math.round(node.getBoundingClientRect().top + window.scrollY)));

        window.scrollTo(0, 0);
        measure();

        window.addEventListener("resize", measure);
        const observer = new ResizeObserver(measure);
        observer.observe(document.body);

        return () => {
            window.removeEventListener("resize", measure);
            observer.disconnect();
        };
    }, [node]);

    return [setNode, { height: `calc(100dvh - ${top}px)` }];
}

// Scales its content up or down so the whole thing is visible without scrolling
function FitToBox({ children }) {
    const boxRef = useRef(null);
    const contentRef = useRef(null);
    const [fit, setFit] = useState({ scale: 1, width: 0, height: 0 });
    const [zoomed, setZoomed] = useState(false);

    useLayoutEffect(() => {
        const box = boxRef.current;
        const content = contentRef.current;

        const measure = () => {
            const width = content.offsetWidth;
            const height = content.offsetHeight;
            if (!width || !height) return;

            const scale = Math.min(box.clientWidth / width, box.clientHeight / height, 1.35);
            setFit({ scale, width, height });
        };

        const observer = new ResizeObserver(measure);
        observer.observe(box);
        observer.observe(content);
        measure();

        return () => observer.disconnect();
    }, []);

    // Zoom is offered only when the fitted seats become small (mostly on phones)
    const canZoom = fit.scale < 0.75;
    const scale = zoomed && canZoom ? 1 : fit.scale;

    return (
        <div className="relative min-h-0 flex-1">
            <div ref={boxRef} className="absolute inset-3 flex overflow-auto">
                {/* This wrapper takes the scaled size, so centering stays correct */}
                <div
                    className="relative m-auto shrink-0 overflow-hidden"
                    style={{ width: fit.width * scale, height: fit.height * scale }}
                >
                    <div
                        ref={contentRef}
                        className="absolute left-0 top-0 w-max origin-top-left"
                        style={{ transform: `scale(${scale})` }}
                    >
                        {children}
                    </div>
                </div>
            </div>

            {canZoom && (
                <button
                    type="button"
                    onClick={() => setZoomed((value) => !value)}
                    className="absolute bottom-2 right-2 rounded-full border border-[#333845] bg-[#1C212C]/95 px-3 py-1.5 text-[11px] font-semibold text-[#E8EAF0]"
                >
                    {zoomed ? "Fit screen" : "Zoom in"}
                </button>
            )}
        </div>
    );
}

/* ---------- Ticket parts (summary + confirmation) ---------- */

// Dotted divider: horizontal on mobile, vertical on medium screens and up
function TicketDivider() {
    const notch = "absolute z-10 h-6 w-6 rounded-full border border-[#252832] bg-[#0B0D12]";

    return (
        <div aria-hidden="true" className="relative h-0 w-full shrink-0 md:h-auto md:w-0 md:self-stretch">
            <div className="absolute inset-x-5 top-0 border-t-2 border-dotted border-[#454B58] md:inset-x-auto md:inset-y-5 md:left-0 md:border-l-2 md:border-t-0" />
            <span className={`${notch} -left-[13px] -top-3 [clip-path:inset(0_0_0_50%)] md:hidden`} />
            <span className={`${notch} -right-[13px] -top-3 [clip-path:inset(0_50%_0_0)] md:hidden`} />
            <span className={`${notch} -left-3 -top-[13px] hidden [clip-path:inset(50%_0_0_0)] md:block`} />
            <span className={`${notch} -bottom-[13px] -left-3 hidden [clip-path:inset(0_0_50%_0)] md:block`} />
        </div>
    );
}

function Detail({ icon: Icon, label, value }) {
    return (
        <div className="flex min-w-0 items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1C212C]">
                <Icon className="h-4 w-4 text-[#E53945]" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#777D8B]">{label}</p>
                <p className="break-words text-xs font-semibold text-[#E8EAF0] sm:text-sm">{value}</p>
            </div>
        </div>
    );
}

function SeatChips({ seats }) {
    return (
        <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
            {seats.map((seat) => (
                <span
                    key={seat}
                    className="rounded-lg border border-[#E53945]/30 bg-[#E53945]/10 px-2.5 py-1 text-xs font-bold text-[#F16A73]"
                >
                    {seat}
                </span>
            ))}
        </div>
    );
}

function ShowDetails({ movieName, screenName, showTime, seats }) {
    const date = new Date(showTime);

    return (
        <div className="min-w-0 flex-1 p-4 sm:p-6 [@media(max-height:760px)]:!py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777D8B]">Movie</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-extrabold leading-snug text-[#E8EAF0] sm:text-2xl">
                {movieName}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:mt-6 [@media(max-height:760px)]:!mt-2.5 [@media(max-height:760px)]:!gap-y-2">
                <Detail
                    icon={CalendarDays}
                    label="Date"
                    value={date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                />
                <Detail
                    icon={Clock}
                    label="Time"
                    value={date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                />
                <Detail icon={Monitor} label="Screen" value={screenName} />
                <Detail icon={Ticket} label="Tickets" value={seats.length} />
            </div>

            <div className="mt-4 border-t border-[#252832] pt-3 sm:mt-6 sm:pt-4 [@media(max-height:760px)]:!mt-2.5 [@media(max-height:760px)]:!pt-2.5">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#777D8B]">
                    <Armchair className="h-3.5 w-3.5" />
                    Seats
                </p>
                {seats.length > 0 ? (
                    <SeatChips seats={seats} />
                ) : (
                    <p className="text-xs text-amber-400">
                        Your seat hold is no longer active. Go back and select seats again.
                    </p>
                )}
            </div>
        </div>
    );
}

/* ---------- Page ---------- */

export default function SeatBookingPage() {
    const { showId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [show, setShow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [wsConnected, setWsConnected] = useState(false);

    // Steps: SELECT -> CONFIRM -> DONE
    const [step, setStep] = useState("SELECT");
    const [bookingResult, setBookingResult] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const stompRef = useRef(null);

    const [fillRef, fillStyle] = useFillScreen();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let mounted = true;

        apiFetch(`/api/shows/${showId}`)
            .then((data) => {
                if (mounted) setShow(data);
            })
            .catch((err) => {
                if (mounted) setError(err.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        const client = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 3000,
            onConnect: () => {
                if (mounted) setWsConnected(true);

                client.subscribe(`/topic/shows/${showId}/seats`, (message) => {
                    try {
                        const updatedShow = JSON.parse(message.body);
                        if (mounted) setShow(updatedShow);
                    } catch {
                        // Ignore malformed payload.
                    }
                });
            },
            onDisconnect: () => {
                if (mounted) setWsConnected(false);
            },
            onWebSocketClose: () => {
                if (mounted) setWsConnected(false);
            },
        });

        client.activate();
        stompRef.current = client;

        return () => {
            mounted = false;
            client.deactivate();
        };
    }, [showId]);

    const mySelectedSeats = useMemo(() => {
        if (!show || !user) return [];

        return (show.tickets || []).filter((ticket) => ticket.status === "LOCKED" && ticket.lockedBy === user.id);
    }, [show, user]);

    const totalAmount = useMemo(() => {
        return mySelectedSeats.reduce((sum, seat) => sum + Number(seat.price || show?.ticketPrice || 0), 0);
    }, [mySelectedSeats, show]);

    const rowsGrouped = useMemo(() => {
        if (!show?.tickets) return {};

        return show.tickets.reduce((acc, seat) => {
            if (!acc[seat.row]) acc[seat.row] = [];
            acc[seat.row].push(seat);
            return acc;
        }, {});
    }, [show]);

    const sortedRows = useMemo(() => {
        return Object.entries(rowsGrouped).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    }, [rowsGrouped]);

    const handleSeatClick = async (seat) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        if (seat.status === "BOOKED") return;

        const isLockedByOther = seat.status === "LOCKED" && seat.lockedBy !== user?.id;

        if (isLockedByOther) return;

        setError("");

        const isMine = seat.status === "LOCKED" && seat.lockedBy === user?.id;

        try {
            const endpoint = isMine ? `/api/shows/${showId}/seats/unlock` : `/api/shows/${showId}/seats/lock`;

            const updated = await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify({
                    seatNumbers: [seat.seatNumber],
                }),
            });

            setShow(updated);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(String(bookingResult.id));
            setCopied(true);
        } catch {
            setError("Couldn't copy the booking ID.");
        }
    };

    const handleSimulatedPay = async () => {
        if (mySelectedSeats.length === 0 || actionLoading) return;

        setActionLoading(true);
        setError("");

        try {
            const booking = await apiFetch(`/api/shows/${showId}/book`, {
                method: "POST",
                body: JSON.stringify({
                    seatNumbers: mySelectedSeats.map((seat) => seat.seatNumber),
                }),
            });

            setBookingResult(booking);
            setStep("DONE");
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <SeatBookingSkeleton />;

    if (!show) {
        return (
            <div className=" bg-[#0B0D12] text-[#E8EAF0] flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-[#252832] bg-[#141720] p-8 sm:p-10 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E53945]/10">
                        <Monitor className="h-7 w-7 text-[#E53945]" />
                    </div>
                    <h2 className="text-xl font-bold">Show not found</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#858B99]">
                        {error || "The show you're looking for doesn't exist."}
                    </p>
                    <Link
                        to="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E53945] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#CA2C38]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Movies
                    </Link>
                </div>
            </div>
        );
    }

    const seatNames = mySelectedSeats.map((seat) => seat.seatNumber);
    const seatCount = mySelectedSeats.length;

    const steps = [
        { key: "SELECT", label: "Select seats" },
        { key: "CONFIRM", label: "Review" },
        { key: "DONE", label: "Confirmation" },
    ];

    const currentStepIndex = steps.findIndex((item) => item.key === step);

    // Seats with different prices (e.g. VIP) are listed as separate lines
    const priceLines = Object.values(
        mySelectedSeats.reduce((acc, seat) => {
            const price = Number(seat.price || show.ticketPrice || 0);
            const key = `${seat.type}-${price}`;
            if (!acc[key]) acc[key] = { key, type: seat.type || "Standard", price, count: 0 };
            acc[key].count += 1;
            return acc;
        }, {}),
    );

    return (
        <div ref={fillRef} style={fillStyle} className="flex flex-col overflow-hidden bg-[#0B0D12] text-[#E8EAF0]">
            {/* Compact header: movie info + progress + live status */}
            <header className="shrink-0 border-b border-[#252832] bg-[#0D0F14]">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Link
                            to={`/movies/${show.movieSlug}`}
                            aria-label="Back to movie"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#292D37] bg-[#141720] text-[#858B99] transition hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold sm:text-base">{show.movieName}</p>
                            <p className="truncate text-[11px] text-[#858B99] sm:text-xs">
                                {show.screenName} • {formatShowTime(show.showTime)}
                            </p>
                        </div>
                    </div>

                    {/* Progress */}
                    <ol className="hidden items-center gap-2 md:flex">
                        {steps.map((item, index) => {
                            const completed = index < currentStepIndex || step === "DONE";
                            const active = index === currentStepIndex;

                            return (
                                <li
                                    key={item.key}
                                    aria-current={active ? "step" : undefined}
                                    className="flex items-center gap-2"
                                >
                                    <span
                                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${
                                            completed
                                                ? "border-[#E53945] bg-[#E53945] text-white"
                                                : active
                                                  ? "border-[#E53945] bg-[#E53945]/10 text-[#E53945]"
                                                  : "border-[#333845] text-[#777D8B]"
                                        }`}
                                    >
                                        {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                                    </span>
                                    <span
                                        className={`hidden text-xs font-medium lg:inline ${
                                            active || completed ? "text-[#E8EAF0]" : "text-[#777D8B]"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                    {index < steps.length - 1 && (
                                        <span className={`h-px w-6 ${completed ? "bg-[#E53945]" : "bg-[#292D37]"}`} />
                                    )}
                                </li>
                            );
                        })}
                    </ol>

                    <div className="flex shrink-0 justify-end md:flex-1">
                        <div
                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium sm:px-3 ${
                                wsConnected
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                    : "border-[#292D37] bg-[#141720] text-[#858B99]"
                            }`}
                        >
                            {wsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">
                                {wsConnected ? `Live • ${show.availableCount} seats left` : "Connecting"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Thin progress bar on small screens */}
                <div aria-hidden="true" className="flex gap-1 md:hidden">
                    {steps.map((item, index) => (
                        <span
                            key={item.key}
                            className={`h-0.5 flex-1 ${index <= currentStepIndex ? "bg-[#E53945]" : "bg-[#292D37]"}`}
                        />
                    ))}
                </div>
            </header>

            <main className="relative flex min-h-0 flex-1 flex-col">
                {/* The error floats above the page, so it never adds height */}
                {error && (
                    <div
                        role="alert"
                        className="absolute inset-x-4 top-3 z-30 mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-red-500/30 bg-[#2A1519] px-4 py-3 text-sm text-red-300 shadow-xl"
                    >
                        <span aria-hidden="true">⚠</span>
                        <span className="flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="text-xs font-semibold hover:text-white"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* ---------- SELECT SEATS ---------- */}
                {step === "SELECT" && (
                    <>
                        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#252832] bg-[#141720]">
                                {/* Screen */}
                                <div className="shrink-0 px-5 pt-4 text-center">
                                    <div
                                        className="mx-auto h-1.5 w-[70%] max-w-lg rounded-full"
                                        style={{
                                            background:
                                                "linear-gradient(90deg, transparent, #E53945 20%, #E53945 80%, transparent)",
                                            boxShadow: "0 5px 24px rgba(229,57,69,0.35)",
                                        }}
                                    />
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#777D8B]">
                                        Screen this way
                                    </p>
                                </div>

                                {/* Seat map, auto-sized to the free space */}
                                <FitToBox>
                                    <div className="p-2">
                                        {sortedRows.map(([rowLabel, seats], index) => {
                                            const firstSeat = seats[0] || {};
                                            const category = firstSeat.type || "STANDARD";
                                            const price = Number(firstSeat.price || show.ticketPrice || 0);

                                            const prevSeats = index > 0 ? sortedRows[index - 1][1] : null;
                                            const prevSeat = prevSeats?.[0];
                                            const isNewCategory =
                                                index === 0 ||
                                                prevSeat?.type !== category ||
                                                Number(prevSeat?.price || show.ticketPrice || 0) !== price;

                                            return (
                                                <React.Fragment key={rowLabel}>
                                                    {isNewCategory && (
                                                        <div className={index > 0 ? "mt-6 pt-2" : "mb-1"}>
                                                            <div className="mb-2.5 flex items-center gap-3">
                                                                <span className="h-px flex-1 bg-[#252832]" />
                                                                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A0A5B1]">
                                                                    ₹{price} {category}
                                                                </span>
                                                                <span className="h-px flex-1 bg-[#252832]" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3">
                                                        <span className="w-5 shrink-0 text-center text-[11px] font-bold text-[#777D8B]">
                                                            {rowLabel}
                                                        </span>

                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            {seats
                                                                .slice()
                                                                .sort((a, b) => a.number - b.number)
                                                                .map((seat) => {
                                                                    const isBooked = seat.status === "BOOKED";
                                                                    const isMine =
                                                                        seat.status === "LOCKED" &&
                                                                        seat.lockedBy === user?.id;
                                                                    const isOtherLocked =
                                                                        seat.status === "LOCKED" &&
                                                                        seat.lockedBy !== user?.id;
                                                                    const isVip = seat.type === "VIP";

                                                                    let seatClass =
                                                                        "border-[#414653] bg-[#1C212C] text-[#C0C4CE] hover:border-[#E53945] hover:bg-[#E53945]/10 hover:text-[#E53945]";

                                                                    if (
                                                                        isVip &&
                                                                        !isBooked &&
                                                                        !isMine &&
                                                                        !isOtherLocked
                                                                    ) {
                                                                        seatClass =
                                                                            "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20";
                                                                    }

                                                                    if (isMine) {
                                                                        seatClass =
                                                                            "border-[#E53945] bg-[#E53945] text-white shadow-[0_0_16px_rgba(229,57,69,0.2)]";
                                                                    } else if (isOtherLocked) {
                                                                        seatClass =
                                                                            "border-orange-500/30 bg-orange-500/10 text-orange-400 cursor-not-allowed";
                                                                    } else if (isBooked) {
                                                                        seatClass =
                                                                            "border-[#292D37] bg-[#20242E] text-[#555B68] cursor-not-allowed";
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={seat.seatNumber}
                                                                            type="button"
                                                                            disabled={isBooked || isOtherLocked}
                                                                            onClick={() => handleSeatClick(seat)}
                                                                            title={`${seat.seatNumber} (${seat.type}) — ₹${Number(seat.price || show.ticketPrice || 0).toFixed(2)} — ${seat.status}`}
                                                                            aria-label={`Seat ${seat.seatNumber}, ${seat.status}`}
                                                                            aria-pressed={isMine}
                                                                            className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border text-[10px] sm:text-[11px] font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E53945] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141720] disabled:cursor-not-allowed ${seatClass}`}
                                                                        >
                                                                            {seat.number}
                                                                        </button>
                                                                    );
                                                                })}
                                                        </div>

                                                        <span className="w-5 shrink-0 text-center text-[11px] font-bold text-[#777D8B]">
                                                            {rowLabel}
                                                        </span>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </FitToBox>

                                <div className="shrink-0 border-t border-[#252832] bg-[#11141B] px-3 py-2.5">
                                    <SeatLegend />
                                </div>
                            </section>

                            {/* Summary sidebar (large screens) */}
                            <aside className="hidden min-h-0 flex-col rounded-2xl border border-[#252832] bg-[#141720] p-5 lg:flex">
                                <div className="flex shrink-0 items-center justify-between">
                                    <h3 className="font-bold">Your selection</h3>
                                    <span className="rounded-full bg-[#20242E] px-2.5 py-1 text-[11px] font-semibold text-[#858B99]">
                                        {seatCount} selected
                                    </span>
                                </div>

                                {/* Only this part scrolls if a very large selection can't fit */}
                                <div className="my-3 min-h-0 flex-1 overflow-y-auto">
                                    {seatCount > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {seatNames.map((name) => (
                                                <span
                                                    key={name}
                                                    className="rounded-lg border border-[#E53945]/30 bg-[#E53945]/10 px-3 py-1.5 text-xs font-bold text-[#F16A73]"
                                                >
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-center">
                                            <Armchair className="mb-2 h-7 w-7 text-[#555B68]" />
                                            <p className="text-sm font-medium text-[#A0A5B1]">No seats selected</p>
                                            <p className="mt-1 text-xs text-[#777D8B]">Choose seats from the layout</p>
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0 border-t border-dashed border-[#333845] pt-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">Total</span>
                                        <span className="text-2xl font-extrabold">₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={seatCount === 0}
                                        onClick={() => setStep("CONFIRM")}
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E53945] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#CA2C38] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Continue to checkout
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <p className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-[#777D8B]">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Secure seat selection
                                    </p>
                                </div>
                            </aside>
                        </div>

                        {/* Bottom bar (small screens). It is part of the layout, so it covers nothing */}
                        <div className="shrink-0 border-t border-[#292D37] bg-[#0D0F14] px-4 py-3 lg:hidden">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] text-[#858B99]">
                                        {seatCount > 0 ? seatNames.join(", ") : "No seats selected"}
                                    </p>
                                    <p className="text-lg font-extrabold">₹{totalAmount.toFixed(2)}</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={seatCount === 0}
                                    onClick={() => setStep("CONFIRM")}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#E53945] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#CA2C38] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Continue
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ---------- REVIEW BOOKING ---------- */}
                {step === "CONFIRM" && (
                    // Scrolls only on extremely short screens, so buttons stay reachable
                    <div className="flex min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 [@media(max-height:760px)]:!py-2">
                        <div className="m-auto w-full max-w-md md:max-w-4xl">
                            <div className="mb-3 text-center sm:mb-5 [@media(max-height:760px)]:!mb-2 [@media(max-height:660px)]:sr-only">
                                <h2 className="text-lg font-bold tracking-tight sm:text-2xl">Review your booking</h2>
                                <p className="mt-1 hidden text-sm text-[#858B99] sm:block [@media(max-height:760px)]:!hidden">
                                    One last look before your seats are confirmed.
                                </p>
                            </div>

                            <div className="flex flex-col rounded-2xl border border-[#252832] bg-[#141720] shadow-2xl shadow-black/30 md:flex-row">
                                <ShowDetails
                                    movieName={show.movieName}
                                    screenName={show.screenName}
                                    showTime={show.showTime}
                                    seats={seatNames}
                                />

                                <TicketDivider />

                                {/* Payment stub */}
                                <div className="flex flex-col justify-between rounded-b-[15px] bg-[#11141B] p-4 sm:p-6 [@media(max-height:760px)]:!py-3 md:w-80 md:rounded-r-[15px] md:rounded-bl-none">
                                    <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#777D8B] sm:mb-3">
                                            Price details
                                        </p>
                                        <div className="max-h-24 space-y-1.5 overflow-y-auto sm:space-y-2">
                                            {priceLines.map((line) => (
                                                <div
                                                    key={line.key}
                                                    className="flex justify-between gap-3 text-xs sm:text-sm"
                                                >
                                                    <span className="text-[#858B99]">
                                                        {line.type} • {line.count} × ₹{line.price.toFixed(2)}
                                                    </span>
                                                    <span className="text-[#C0C4CE]">
                                                        ₹{(line.count * line.price).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3 flex items-end justify-between border-t border-[#292D37] pt-3">
                                            <span className="text-sm font-semibold">Total</span>
                                            <span className="text-2xl font-extrabold sm:text-3xl">
                                                ₹{totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 md:mt-6 [@media(max-height:760px)]:!mt-2.5">
                                        <button
                                            type="button"
                                            disabled={actionLoading || seatCount === 0}
                                            onClick={handleSimulatedPay}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E53945] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#E53945]/20 transition hover:bg-[#CA2C38] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {actionLoading ? (
                                                <>
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Confirming...
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard className="h-4 w-4" />
                                                    Confirm & Pay ₹{totalAmount.toFixed(2)}
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => setStep("SELECT")}
                                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#333845] bg-[#1C212C] px-5 py-2.5 text-sm font-semibold text-[#C0C4CE] transition hover:bg-[#20242E] hover:text-white disabled:opacity-50"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Change seats
                                        </button>

                                        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#777D8B]">
                                            <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                                            Demo payment • No money is deducted
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------- CONFIRMATION ---------- */}
                {step === "DONE" && bookingResult && (
                    <div className="flex min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.09),transparent_60%)] p-3 sm:p-6 [@media(max-height:760px)]:!py-2">
                        <div className="m-auto w-full max-w-md md:max-w-4xl">
                            <div className="mb-2 flex items-center justify-center gap-3 [@media(min-width:640px)_and_(min-height:761px)]:mb-6 [@media(min-width:640px)_and_(min-height:761px)]:flex-col [@media(min-width:640px)_and_(min-height:761px)]:text-center">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.25)] sm:h-14 sm:w-14">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-400 sm:h-8 sm:w-8" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold tracking-tight sm:text-3xl">
                                        Booking confirmed!
                                    </h2>
                                    <p className="text-xs text-[#858B99] sm:mt-1 sm:text-sm">
                                        Your seats are booked. Enjoy the show!
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col rounded-2xl border border-[#252832] bg-[#141720] shadow-2xl shadow-black/30 md:flex-row">
                                <ShowDetails
                                    movieName={bookingResult.movieName || show.movieName}
                                    screenName={show.screenName}
                                    showTime={show.showTime}
                                    seats={bookingResult.seats || []}
                                />

                                <TicketDivider />

                                {/* Ticket stub */}
                                <div className="flex flex-col justify-between rounded-b-[15px] bg-[#11141B] p-4 sm:p-6 [@media(max-height:760px)]:!py-3 md:w-80 md:rounded-r-[15px] md:rounded-bl-none">
                                    <div className="flex items-end justify-between gap-3 md:block">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777D8B]">
                                                Amount paid
                                            </p>
                                            <p className="mt-1 text-2xl font-extrabold text-emerald-400 sm:text-3xl">
                                                ₹{Number(bookingResult.totalAmount ?? 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 md:mt-3">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Confirmed
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#292D37] bg-[#0B0D12] px-3 py-2.5 md:mt-6 [@media(max-height:760px)]:!mt-2.5 [@media(max-height:760px)]:!py-1.5">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#777D8B]">
                                                Booking ID
                                            </p>
                                            <p className="truncate font-mono text-sm font-semibold text-[#C0C4CE]">
                                                {String(bookingResult.id ?? "N/A")}
                                            </p>
                                        </div>
                                        {bookingResult.id != null && (
                                            <button
                                                type="button"
                                                onClick={handleCopyId}
                                                aria-label="Copy booking ID"
                                                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#333845] px-2.5 py-2 text-xs font-semibold text-[#A0A5B1] transition hover:bg-[#20242E] hover:text-white"
                                            >
                                                {copied ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                                {copied ? "Copied" : "Copy"}
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 md:mt-6 md:grid-cols-1 [@media(max-height:760px)]:!mt-2.5">
                                        <Link
                                            to="/my-tickets"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E53945] px-3 py-3 text-sm font-bold text-white [@media(max-height:760px)]:!py-2.5 transition hover:bg-[#CA2C38]"
                                        >
                                            <Ticket className="h-4 w-4 shrink-0" />
                                            My tickets
                                            <ArrowRight className="hidden h-4 w-4 sm:block" />
                                        </Link>
                                        <Link
                                            to="/"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#333845] bg-[#1C212C] px-3 py-3 text-sm font-semibold text-[#C0C4CE] [@media(max-height:760px)]:!py-2.5 transition hover:bg-[#20242E] hover:text-white"
                                        >
                                            <Film className="h-4 w-4 shrink-0" />
                                            Browse movies
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
