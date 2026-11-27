import React, { useId } from "react";
import { Star } from "lucide-react";

const LABELS = [
    "Hover over a star to rate",
    "Awful",
    "Terrible",
    "Bad",
    "Poor",
    "Average",
    "Fine",
    "Good",
    "Great",
    "Superb",
    "Masterpiece",
];

export default function StarRating({ value = 0, onChange, disabled = false }) {
    const name = useId(); // keeps radio groups separate if used more than once

    // Hovering saves the score right away, so it stays after the mouse leaves
    const handleHover = (e, score) => {
        // Touch screens have no hover; they use a tap (the radio's onChange)
        if (disabled || e.pointerType === "touch" || score === value) return;
        onChange(score);
    };

    return (
        <fieldset disabled={disabled} className="text-center disabled:opacity-60">
            <legend className="sr-only">Your rating out of 10</legend>

            {/* Big score */}
            <div aria-hidden="true" className="flex items-baseline justify-center gap-1">
                <span
                    className={`text-3xl font-extrabold tabular-nums transition-colors ${
                        value ? "text-[#E8EAF0]" : "text-[#454B58]"
                    }`}
                >
                    {value || "?"}
                </span>
                <span className="text-sm font-semibold text-[#777D8B]">/10</span>
            </div>

            {/* Stars: no gap between them, so the preview doesn't flicker */}
            <div className="mt-1 flex justify-center">
                {[1, 2, 3, 4, 5].map((star) => {
                    const full = star * 2;
                    const half = full - 1;
                    const fill = value >= full ? "100%" : value >= half ? "50%" : "0%";

                    return (
                        <span
                            key={star}
                            // The ring appears only for keyboard focus, never on mouse click
                            className={`relative block h-11 w-11 select-none rounded-lg transition-transform duration-150 [-webkit-tap-highlight-color:transparent] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-400/60 ${
                                disabled ? "" : "hover:scale-110"
                            }`}
                        >
                            {/* Empty star */}
                            <Star
                                aria-hidden="true"
                                strokeWidth={1.5}
                                className="absolute left-1 top-1 h-9 w-9 text-[#4A5160]"
                            />

                            {/* Filled layer, clipped to 0%, 50% or 100% of the cell */}
                            <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 overflow-hidden"
                                style={{ width: fill }}
                            >
                                <Star
                                    strokeWidth={1.5}
                                    className="absolute left-1 top-1 h-9 w-9 max-w-none fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]"
                                />
                            </span>

                            {/* Two invisible radios: left half and right half */}
                            {[half, full].map((score) => (
                                <label
                                    key={score}
                                    onPointerEnter={(e) => handleHover(e, score)}
                                    className={`absolute inset-y-0 w-1/2 ${
                                        score === half ? "left-0" : "right-0"
                                    } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    <input
                                        type="radio"
                                        name={name}
                                        value={score}
                                        checked={value === score}
                                        onChange={() => onChange(score)}
                                        className="sr-only"
                                    />
                                    <span className="sr-only">{`${score} out of 10, ${LABELS[score]}`}</span>
                                </label>
                            ))}
                        </span>
                    );
                })}
            </div>

            <p
                aria-hidden="true"
                className={`mt-1 h-5 text-xs font-semibold ${value ? "text-amber-400" : "text-[#777D8B]"}`}
            >
                {LABELS[value]}
            </p>
        </fieldset>
    );
}
