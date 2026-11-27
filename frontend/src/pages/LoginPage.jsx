import React, { useLayoutEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, LogIn, Eye, EyeOff, User, Lock, Armchair, Ticket, Wifi, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
    { icon: Armchair, title: "Pick your seats", text: "Choose where you sit from the seat map." },
    { icon: Wifi, title: "Live availability", text: "See seat updates while you choose." },
    { icon: Ticket, title: "Tickets in one place", text: "Find your bookings whenever you need them." },
];

// Login only checks that fields are filled in. The server verifies the details.
const validators = {
    identifier: (v) => (v.trim() ? "" : "Enter your email or phone number"),
    password: (v) => (v ? "" : "Enter your password"),
};

const DEMO_ACCOUNTS = {
    user: { identifier: "user1@movietime.com", password: "User@123" },
    admin: { identifier: "admin1@movietime.com", password: "Admin@123" },
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

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [fillRef, fillStyle] = useFillScreen();

    const [form, setForm] = useState({ identifier: "", password: "" });
    const [errors, setErrors] = useState({});
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState("");
    // Which button started the request: "form", "user", "admin" or "" (idle)
    const [pending, setPending] = useState("");
    const loading = pending !== "";

    const set = (key) => (e) => {
        const { value } = e.target;
        setForm((prev) => ({ ...prev, [key]: value }));
        setError("");

        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: validators[key](value) }));
        }
    };

    const fieldProps = (key) => ({
        id: key,
        value: form[key],
        onChange: set(key),
        error: errors[key],
    });

    // Shared by the form and the demo buttons
    const signIn = async (identifier, password, source) => {
        if (loading) return;

        setError("");
        setPending(source);

        try {
            const user = await login(identifier, password);
            const isAdmin = user?.role?.toLowerCase() === "admin";
            navigate(isAdmin ? "/admin" : "/", { replace: true });
        } catch (err) {
            setError(err?.message || "Unable to sign in. Please try again.");
        } finally {
            setPending("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const nextErrors = Object.fromEntries(Object.keys(validators).map((key) => [key, validators[key](form[key])]));
        setErrors(nextErrors);

        const firstInvalid = Object.keys(nextErrors).find((key) => nextErrors[key]);
        if (firstInvalid) {
            e.currentTarget.elements[firstInvalid].focus();
            return;
        }

        signIn(form.identifier.trim(), form.password, "form");
    };

    const quickLogin = (type) => {
        setErrors({});
        const account = DEMO_ACCOUNTS[type];
        signIn(account.identifier, account.password, type);
    };

    const spinner = <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;

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

                    <h1 className="text-xl font-bold tracking-tight text-[#E8EAF0] sm:text-2xl">Welcome back</h1>
                    {/* A server error takes the subtitle's place, so the page doesn't grow */}
                    {error ? (
                        <p role="alert" className="mt-1 flex items-start gap-1.5 text-xs text-red-400 sm:text-sm">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-2" title={error}>
                                {error}
                            </span>
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-[#858B99] sm:text-sm">Sign in to continue booking.</p>
                    )}

                    {/* noValidate: our own messages replace the browser's popups */}
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="mt-3 space-y-1.5 sm:mt-5 sm:space-y-2 [@media(max-height:760px)]:!mt-2.5 [@media(max-height:760px)]:!space-y-1"
                    >
                        <Field
                            {...fieldProps("identifier")}
                            label="Email or phone"
                            icon={User}
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="user@example.com"
                        />

                        <Field
                            {...fieldProps("password")}
                            label="Password"
                            icon={Lock}
                            type={showPwd ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
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
                            {pending === "form" ? spinner : <LogIn className="h-4 w-4" />}
                            {pending === "form" ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-4 [@media(max-height:760px)]:!mt-3">
                        <div className="mb-2.5 flex items-center gap-3">
                            <span className="h-px flex-1 bg-[#292D37]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777D8B]">
                                Demo accounts
                            </span>
                            <span className="h-px flex-1 bg-[#292D37]" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => quickLogin("user")}
                                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#333845] bg-[#1C212C] text-xs font-semibold text-[#C0C4CE] transition hover:border-[#414653] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {pending === "user" ? spinner : <User className="h-3.5 w-3.5" />}
                                Normal user
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => quickLogin("admin")}
                                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#E53945]/30 bg-[#E53945]/10 text-xs font-semibold text-[#F16B75] transition hover:bg-[#E53945] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {pending === "admin" ? spinner : <ShieldCheck className="h-3.5 w-3.5" />}
                                Admin
                            </button>
                        </div>
                    </div>

                    <p className="mt-3 text-center text-sm text-[#858B99] sm:mt-4 [@media(max-height:760px)]:!mt-2.5">
                        Don&apos;t have an account?{" "}
                        <Link to="/register" className="font-semibold text-[#E95A64] transition hover:text-[#FF737D]">
                            Register
                        </Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
