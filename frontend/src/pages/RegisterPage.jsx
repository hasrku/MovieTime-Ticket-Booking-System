import React, { useLayoutEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Film,
    UserPlus,
    Eye,
    EyeOff,
    User,
    Mail,
    Phone,
    Lock,
    Armchair,
    Ticket,
    Wifi,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const INITIAL_FORM = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
};

const FEATURES = [
    { icon: Armchair, title: "Pick your seats", text: "Choose where you sit from the seat map." },
    { icon: Wifi, title: "Live availability", text: "See seat updates while you choose." },
    { icon: Ticket, title: "Tickets in one place", text: "Find your bookings whenever you need them." },
];

// Every field is compulsory. Returns an error message, or "" if the value is valid.
const validators = {
    firstName: (v) => (v.trim() ? "" : "First name is required"),
    lastName: (v) => (v.trim() ? "" : "Last name is required"),
    email: (v) => {
        if (!v.trim()) return "Email is required";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address";
    },
    phone: (v) => {
        if (!v.trim()) return "Phone number is required";
        const digits = v.replace(/\D/g, "");
        const validCharacters = /^\+?[\d\s()-]+$/.test(v.trim());
        return validCharacters && digits.length >= 10 && digits.length <= 15 ? "" : "Enter a valid phone number";
    },
    password: (v) => {
        if (!v.trim()) return "Password is required";
        return v.length >= 6 ? "" : "Use at least 6 characters";
    },
};

// Makes an element at least as tall as the space left below your navbar
function useFillScreen() {
    const [node, setNode] = useState(null);
    const [top, setTop] = useState(56);

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

    return [setNode, { height: `calc(100dvh - ${top}px)` }];
}

function Field({ id, label, icon: Icon, error, hint, children, ...inputProps }) {
    return (
        <div className="min-w-0">
            <label htmlFor={id} className="mb-1 block text-xs font-semibold text-[#C0C4CE]">
                {label}{" "}
                <span aria-hidden="true" className="text-[#E53945]">
                    *
                </span>
            </label>

            <div className="relative">
                <Icon
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                        error ? "text-red-400" : "text-[#777D8B]"
                    }`}
                />
                <input
                    id={id}
                    name={id}
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby={`${id}-message`}
                    className={`h-10 w-full rounded-xl border bg-[#10131A] pl-9 text-base text-[#E8EAF0] outline-none transition placeholder:text-[#555B68] focus:ring-2 sm:h-11 sm:text-sm [@media(max-height:760px)]:!h-10 ${
                        children ? "pr-11" : "pr-3"
                    } ${
                        error
                            ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/10"
                            : "border-[#292D37] focus:border-[#E53945] focus:ring-[#E53945]/10"
                    }`}
                    {...inputProps}
                />
                {children}
            </div>

            {/* Space is always reserved, so error messages don't make the page jump */}
            <p
                id={`${id}-message`}
                aria-live="polite"
                title={error || hint}
                className={`mt-0.5 h-4 truncate text-[11px] leading-4 ${error ? "text-red-400" : "text-[#777D8B]"}`}
            >
                {error || hint}
            </p>
        </div>
    );
}

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [fillRef, fillStyle] = useFillScreen();

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (key) => (e) => {
        const { value } = e.target;
        setForm((prev) => ({ ...prev, [key]: value }));
        setError("");

        // Once an error is visible, update it while the user types
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: validators[key](value) }));
        }
    };

    // Check a field when the user leaves it, but only if they typed something
    const handleBlur = (key) => () => {
        if (form[key]) {
            setErrors((prev) => ({ ...prev, [key]: validators[key](form[key]) }));
        }
    };

    const fieldProps = (key) => ({
        id: key,
        value: form[key],
        onChange: set(key),
        onBlur: handleBlur(key),
        error: errors[key],
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const formElement = e.currentTarget;
        const nextErrors = Object.fromEntries(Object.keys(validators).map((key) => [key, validators[key](form[key])]));
        setErrors(nextErrors);
        setError("");

        const firstInvalid = Object.keys(nextErrors).find((key) => nextErrors[key]);
        if (firstInvalid) {
            formElement.elements[firstInvalid].focus();
            return;
        }

        setLoading(true);

        try {
            await register({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password, // passwords are sent exactly as typed
            });
            navigate("/");
        } catch (err) {
            setError(err?.message || "Unable to create your account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={fillRef}
            style={fillStyle}
            className="flex overflow-y-auto bg-[#0B0D12] p-3 sm:p-5 [@media(max-height:760px)]:!py-2"
        >
            <div className="m-auto grid w-full max-w-md overflow-hidden rounded-2xl border border-[#252832] bg-[#141720] shadow-2xl shadow-black/40 lg:max-w-5xl lg:grid-cols-[0.85fr_1fr]">
                {/* Brand panel (large screens) */}
                <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-[#252832] bg-[#11141B] p-8 lg:flex [@media(max-height:760px)]:!py-5">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,57,69,0.18),transparent_60%)]" />

                    <Link to="/" className="relative inline-flex items-center gap-2 self-start">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E53945]/10">
                            <Film className="h-5 w-5 text-[#E53945]" />
                        </span>
                        <span className="text-lg font-extrabold tracking-tight text-[#E8EAF0]">movietime</span>
                    </Link>

                    <div className="relative py-6">
                        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#E8EAF0]">
                            Your next movie
                            <span className="block text-[#E53945]">starts here.</span>
                        </h2>

                        <ul className="mt-6 space-y-4">
                            {FEATURES.map(({ icon: Icon, title, text }) => (
                                <li key={title} className="flex items-start gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#292D37] bg-[#1C212C]">
                                        <Icon className="h-4 w-4 text-[#E53945]" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-[#E8EAF0]">{title}</p>
                                        <p className="mt-0.5 text-xs text-[#858B99]">{text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="relative text-[11px] text-[#555B68]">
                        © {new Date().getFullYear()} MovieTime. All rights reserved.
                    </p>
                </aside>

                {/* Form panel */}
                <section className="p-5 sm:p-7 lg:p-8 [@media(max-height:760px)]:!py-4">
                    <Link to="/" className="mb-2 inline-flex items-center gap-2 lg:hidden">
                        <Film className="h-4 w-4 text-[#E53945]" />
                        <span className="text-sm font-extrabold tracking-tight text-[#E8EAF0]">movietime</span>
                    </Link>

                    <h1 className="text-xl font-bold tracking-tight text-[#E8EAF0] sm:text-2xl">Create your account</h1>
                    {/* A server error takes the subtitle's place, so the page doesn't grow */}
                    {error ? (
                        <p role="alert" className="mt-1 flex items-start gap-1.5 text-xs text-red-400 sm:text-sm">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-2" title={error}>
                                {error}
                            </span>
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-[#858B99] sm:text-sm">All fields are required.</p>
                    )}

                    {/* noValidate: our own messages replace the browser's popups */}
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="mt-3 space-y-1.5 sm:mt-5 sm:space-y-2 [@media(max-height:760px)]:!mt-2.5 [@media(max-height:760px)]:!space-y-1"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <Field
                                {...fieldProps("firstName")}
                                label="First name"
                                icon={User}
                                type="text"
                                autoComplete="given-name"
                                placeholder="John"
                            />
                            <Field
                                {...fieldProps("lastName")}
                                label="Last name"
                                icon={User}
                                type="text"
                                autoComplete="family-name"
                                placeholder="Doe"
                            />
                        </div>

                        <Field
                            {...fieldProps("email")}
                            label="Email address"
                            icon={Mail}
                            type="email"
                            autoComplete="email"
                            placeholder="john@example.com"
                        />

                        <Field
                            {...fieldProps("phone")}
                            label="Phone number"
                            icon={Phone}
                            type="tel"
                            autoComplete="tel"
                            placeholder="+91 98765 43210"
                        />

                        <Field
                            {...fieldProps("password")}
                            label="Password"
                            icon={Lock}
                            type={showPwd ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Create a password"
                            hint="Use at least 6 characters."
                        >
                            <button
                                type="button"
                                onClick={() => setShowPwd((prev) => !prev)}
                                aria-label={showPwd ? "Hide password" : "Show password"}
                                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#777D8B] transition hover:text-[#E8EAF0]"
                            >
                                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </Field>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E53945] text-sm font-bold text-white shadow-lg shadow-[#E53945]/20 transition hover:bg-[#CA2C38] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                                <UserPlus className="h-4 w-4" />
                            )}
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="mt-3 text-center text-sm text-[#858B99] sm:mt-4 [@media(max-height:760px)]:!mt-2.5">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-[#E95A64] transition hover:text-[#FF737D]">
                            Sign in
                        </Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
