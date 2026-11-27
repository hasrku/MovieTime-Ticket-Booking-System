import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Ticket,
  Wifi,
  WifiOff,
  MapPin,
  Clock,
  Monitor,
} from "lucide-react";
import { apiFetch, WS_URL } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SeatBookingPage() {
  const { showId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  // Steps: "SELECT" -> "CONFIRM" -> "DONE"
  const [step, setStep] = useState("SELECT");
  const [bookingResult, setBookingResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const stompRef = useRef(null);

  useEffect(() => {
    apiFetch(`/api/shows/${showId}`)
      .then((data) => setShow(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      onConnect: () => {
        setWsConnected(true);
        client.subscribe(`/topic/shows/${showId}/seats`, (message) => {
          try {
            const updatedShow = JSON.parse(message.body);
            setShow(updatedShow);
          } catch {
            // ignore malformed payload
          }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onWebSocketClose: () => setWsConnected(false),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [showId]);

  const mySelectedSeats = useMemo(() => {
    if (!show || !user) return [];
    return (show.tickets || []).filter(
      (t) => t.status === "LOCKED" && t.lockedBy === user.id
    );
  }, [show, user]);

  const totalAmount = useMemo(() => {
    return mySelectedSeats.reduce(
      (sum, s) => sum + Number(s.price || show?.ticketPrice || 0),
      0
    );
  }, [mySelectedSeats, show]);

  const rowsGrouped = useMemo(() => {
    if (!show?.tickets) return {};
    return show.tickets.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});
  }, [show]);

  const handleSeatClick = async (seat) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (seat.status === "BOOKED") return;
    const isLockedByOther =
      seat.status === "LOCKED" && seat.lockedBy !== user?.id;
    if (isLockedByOther) return;

    setError("");
    const isMine =
      seat.status === "LOCKED" && seat.lockedBy === user?.id;
    try {
      const endpoint = isMine
        ? `/api/shows/${showId}/seats/unlock`
        : `/api/shows/${showId}/seats/lock`;
      const updated = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ seatNumbers: [seat.seatNumber] }),
      });
      setShow(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSimulatedPay = async () => {
    if (mySelectedSeats.length === 0) return;
    setActionLoading(true);
    setError("");
    try {
      const booking = await apiFetch(`/api/shows/${showId}/book`, {
        method: "POST",
        body: JSON.stringify({
          seatNumbers: mySelectedSeats.map((s) => s.seatNumber),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="space-y-3 w-full max-w-3xl px-4">
          <div className="h-20 animate-pulse rounded-xl bg-white border border-gray-200" />
          <div className="h-96 animate-pulse rounded-xl bg-white border border-gray-200" />
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-10 shadow-sm border border-gray-200 max-w-sm mx-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Monitor className="h-7 w-7 text-[#e32636]" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">Show not found</p>
          <p className="text-sm text-gray-500 mb-5">{error || "The show you're looking for doesn't exist."}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#e32636] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c0101f] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              to={`/movies/${show.movieSlug}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#e32636] transition font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="font-bold text-[#1a1a2e] text-base leading-tight">{show.movieName}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  {show.screenName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(show.showTime).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Available</p>
              <p className="text-sm font-bold text-[#1a1a2e]">{show.availableCount} seats</p>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                wsConnected
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              {wsConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {wsConnected ? "Live" : "Connecting..."}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-[#e32636] flex items-center gap-2">
            <span className="font-medium">⚠</span> {error}
          </div>
        )}

        {step === "SELECT" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Curved Screen Indicator */}
            <div className="bg-gray-50 border-b border-gray-100 py-5 px-6 text-center">
              <div className="mx-auto max-w-xs">
                <div
                  className="h-1.5 w-full rounded-t-full"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, #e32636, transparent)",
                    boxShadow: "0 4px 16px rgba(227,38,54,0.25)",
                  }}
                />
                <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Screen this way
                </p>
              </div>
            </div>

            {/* Seat Grid */}
            <div className="p-6 sm:p-8">
              <div className="mx-auto max-w-2xl space-y-2.5 overflow-x-auto pb-2">
                {Object.entries(rowsGrouped).map(([rowLabel, seats]) => (
                  <div
                    key={rowLabel}
                    className="flex items-center justify-center gap-2"
                  >
                    <span className="w-5 text-center text-xs font-bold text-gray-400">
                      {rowLabel}
                    </span>
                    <div className="flex gap-1.5 sm:gap-2">
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

                          let btnClass =
                            "border-gray-300 bg-white text-gray-700 hover:border-[#e32636] hover:bg-red-50 hover:text-[#e32636] cursor-pointer";
                          if (isVip && !isBooked && !isMine && !isOtherLocked) {
                            btnClass =
                              "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-100 cursor-pointer";
                          }
                          if (isMine) {
                            btnClass =
                              "border-[#e32636] bg-[#e32636] text-white font-bold shadow-md cursor-pointer";
                          } else if (isOtherLocked) {
                            btnClass =
                              "border-orange-300 bg-orange-100 text-orange-500 animate-pulse cursor-not-allowed";
                          } else if (isBooked) {
                            btnClass =
                              "border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed line-through";
                          }

                          return (
                            <button
                              key={seat.seatNumber}
                              type="button"
                              disabled={isBooked || isOtherLocked}
                              onClick={() => handleSeatClick(seat)}
                              title={`${seat.seatNumber} (${seat.type}) — ₹${Number(seat.price).toFixed(0)} — ${seat.status}`}
                              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg border text-xs font-semibold transition-all ${btnClass}`}
                            >
                              {seat.seatNumber}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-md border border-gray-300 bg-white inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-md border border-amber-300 bg-amber-50 inline-block" />
                  VIP
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-md border border-[#e32636] bg-[#e32636] inline-block" />
                  Selected (You)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-md border border-orange-300 bg-orange-100 inline-block" />
                  Held by others
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-md border border-gray-200 bg-gray-100 inline-block" />
                  Booked
                </span>
              </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">
                    Selected Seats ({mySelectedSeats.length})
                  </p>
                  <p className="text-sm font-semibold text-[#1a1a2e]">
                    {mySelectedSeats.length > 0
                      ? mySelectedSeats.map((s) => s.seatNumber).join(", ")
                      : "Tap any available seat above"}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {mySelectedSeats.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-xl font-extrabold text-[#1a1a2e]">
                        ₹{totalAmount.toFixed(0)}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={mySelectedSeats.length === 0}
                    onClick={() => setStep("CONFIRM")}
                    className="rounded-lg bg-[#e32636] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#c0101f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "CONFIRM" && (
          <div className="mx-auto max-w-md">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-[#1a1a2e] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Booking Summary
                    </h2>
                    <p className="text-xs text-gray-400">
                      Simulated checkout — no real payment
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-0">
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                  {[
                    { label: "Movie", value: show.movieName, bold: true },
                    { label: "Screen", value: show.screenName },
                    {
                      label: "Date & Time",
                      value: new Date(show.showTime).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    },
                    {
                      label: "Seats",
                      value: mySelectedSeats.map((s) => s.seatNumber).join(", "),
                      highlight: true,
                    },
                  ].map(({ label, value, bold, highlight }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-3 bg-white"
                    >
                      <span className="text-sm text-gray-500">{label}</span>
                      <span
                        className={`text-sm ${
                          highlight
                            ? "font-bold text-[#e32636]"
                            : bold
                            ? "font-semibold text-[#1a1a2e]"
                            : "text-gray-700"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-4 bg-gray-50">
                    <span className="text-sm font-bold text-[#1a1a2e]">
                      Total Amount
                    </span>
                    <span className="text-xl font-extrabold text-[#1a1a2e]">
                      ₹{totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">
                  🔒 This is a simulation. No money will be deducted.
                </p>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 px-6 pb-6 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("SELECT")}
                  className="w-1/3 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSimulatedPay}
                  className="flex-1 rounded-lg bg-[#e32636] py-3 text-sm font-bold text-white transition hover:bg-[#c0101f] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay ₹{totalAmount.toFixed(0)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "DONE" && bookingResult && (
          <div className="mx-auto max-w-md">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Success Header */}
              <div className="bg-green-500 px-6 py-8 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <CheckCircle2 className="h-9 w-9 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Booking Confirmed!
                </h2>
                <p className="mt-1 text-sm text-green-100">
                  Your seats are reserved. Enjoy the show!
                </p>
              </div>

              {/* Ticket Details */}
              <div className="p-6">
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden mb-5">
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <span className="text-xs text-gray-400 font-medium">
                      BOOKING ID
                    </span>
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
                      {bookingResult.id?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <span className="text-sm text-gray-500">Movie</span>
                    <span className="text-sm font-semibold text-[#1a1a2e]">
                      {bookingResult.movieName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <span className="text-sm text-gray-500">Seats</span>
                    <span className="text-sm font-bold text-[#e32636]">
                      {bookingResult.seats?.join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-4 bg-gray-50">
                    <span className="text-sm font-bold text-[#1a1a2e]">
                      Amount Paid
                    </span>
                    <span className="text-lg font-extrabold text-green-600">
                      ₹{Number(bookingResult.totalAmount).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    to="/my-tickets"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#e32636] px-5 py-3 text-sm font-bold text-white hover:bg-[#c0101f] transition"
                  >
                    <Ticket className="h-4 w-4" /> My Tickets
                  </Link>
                  <Link
                    to="/"
                    className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Browse Movies
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
