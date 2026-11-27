import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, LogIn, LogOut, ShieldCheck, Ticket, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setDropdownOpen(false);
                setMobileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        setMobileMenuOpen(false);

        await logout();
        navigate("/");
    };

    const closeMenus = () => {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
    };

    const initials = `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() || "U";

    return (
        <header className="sticky top-0 z-50 border-b border-[#252832] bg-[#0d0f14]/95 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-[68px] items-center justify-between">
                    {/* Brand */}
                    <Link to="/" onClick={closeMenus} className="group flex shrink-0 items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e53945] text-white shadow-sm shadow-red-950/30 transition group-hover:scale-105">
                            <Film size={21} strokeWidth={2.3} />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[19px] font-extrabold leading-none tracking-tight text-[#f1f2f5]">
                                movie<span className="text-[#e53945]">time</span>
                            </span>

                            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#777d8b]">
                                Your cinema experience
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    {/* <nav className="hidden items-center gap-1 md:flex">
                        <Link
                            to="/"
                            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-[#d0d3dc] transition hover:bg-[#181b23] hover:text-[#e53945]"
                        >
                            Movies
                        </Link>

                        {isAuthenticated && (
                            <Link
                                to="/my-tickets"
                                className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-[#9ca3af] transition hover:bg-[#181b23] hover:text-[#f1f2f5]"
                            >
                                <Ticket size={16} />
                                My Tickets
                            </Link>
                        )}
                    </nav> */}

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Admin shortcut */}
                        {/* {isAdmin && (
                            <Link
                                to="/admin"
                                className="hidden items-center gap-1.5 rounded-lg border border-[#303541] px-3 py-2 text-xs font-semibold text-[#aeb4c0] transition hover:border-[#e53945]/40 hover:bg-[#e53945]/10 hover:text-[#ff6670] sm:flex"
                            >
                                <ShieldCheck size={15} />
                                Admin
                            </Link>
                        )} */}

                        {/* Authenticated user dropdown */}
                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                    aria-expanded={dropdownOpen}
                                    aria-haspopup="menu"
                                    className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition ${
                                        dropdownOpen
                                            ? "border-[#303541] bg-[#181b23]"
                                            : "border-transparent hover:border-[#303541] hover:bg-[#181b23]"
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a2027] text-xs font-bold text-[#ff6670] ring-1 ring-[#e53945]/20">
                                        {initials}
                                    </div>

                                    {/* User name */}
                                    <div className="hidden text-left sm:block">
                                        <p className="max-w-[120px] truncate text-xs font-semibold text-[#f1f2f5]">
                                            {user?.firstName || "Account"}
                                        </p>
                                        <p className="text-[10px] text-[#858b99]">{isAdmin ? "Admin" : "Member"}</p>
                                    </div>

                                    <ChevronDown
                                        size={15}
                                        className={`hidden text-[#777d8b] transition-transform sm:block ${
                                            dropdownOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {/* Dropdown */}
                                {dropdownOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-[#292d37] bg-[#151820] shadow-xl shadow-black/40"
                                    >
                                        {/* User info */}
                                        <div className="border-b border-[#252832] px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3a2027] text-sm font-bold text-[#ff6670]">
                                                    {initials}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-[#f1f2f5]">
                                                        {user?.firstName} {user?.lastName}
                                                    </p>

                                                    <p className="truncate text-xs text-[#858b99]">
                                                        {user?.email || "Signed in"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dropdown links */}
                                        <div className="p-1.5">
                                            <Link
                                                to="/"
                                                role="menuitem"
                                                onClick={closeMenus}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#c6cad3] transition hover:bg-[#20242e] hover:text-white"
                                            >
                                                <Film size={17} className="text-[#858b99]" />
                                                Browse Movies
                                            </Link>

                                            <Link
                                                to="/my-tickets"
                                                role="menuitem"
                                                onClick={closeMenus}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#c6cad3] transition hover:bg-[#20242e] hover:text-white"
                                            >
                                                <Ticket size={17} className="text-[#858b99]" />
                                                My Tickets
                                            </Link>

                                            {isAdmin && (
                                                <Link
                                                    to="/admin"
                                                    role="menuitem"
                                                    onClick={closeMenus}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#c6cad3] transition hover:bg-[#20242e] hover:text-white"
                                                >
                                                    <ShieldCheck size={17} className="text-[#858b99]" />
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t border-[#252832] p-1.5">
                                            <button
                                                onClick={handleLogout}
                                                role="menuitem"
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#ff6670] transition hover:bg-[#e53945]/10"
                                            >
                                                <LogOut size={17} />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Logged out */
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#aeb4c0] transition hover:bg-[#181b23] hover:text-white"
                                >
                                    <LogIn size={16} />
                                    Sign in
                                </Link>

                                <Link
                                    to="/register"
                                    className="rounded-xl bg-[#e53945] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-950/20 transition hover:bg-[#ca2c38] active:scale-[0.98]"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#303541] text-[#aeb4c0] transition hover:bg-[#181b23] hover:text-white md:hidden"
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-[#252832] pb-4 pt-2 md:hidden">
                        <div className="flex flex-col gap-1">
                            <Link
                                to="/"
                                onClick={closeMenus}
                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#c6cad3] transition hover:bg-[#181b23] hover:text-white"
                            >
                                <Film size={17} className="text-[#858b99]" />
                                Browse Movies
                            </Link>

                            {isAuthenticated && (
                                <Link
                                    to="/my-tickets"
                                    onClick={closeMenus}
                                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#c6cad3] transition hover:bg-[#181b23] hover:text-white"
                                >
                                    <Ticket size={17} className="text-[#858b99]" />
                                    My Tickets
                                </Link>
                            )}

                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    onClick={closeMenus}
                                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#c6cad3] transition hover:bg-[#181b23] hover:text-white"
                                >
                                    <ShieldCheck size={17} className="text-[#858b99]" />
                                    Admin Dashboard
                                </Link>
                            )}

                            {!isAuthenticated && (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={closeMenus}
                                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#c6cad3] transition hover:bg-[#181b23] hover:text-white"
                                    >
                                        <LogIn size={17} className="text-[#858b99]" />
                                        Sign in
                                    </Link>

                                    <Link
                                        to="/register"
                                        onClick={closeMenus}
                                        className="mt-1 flex items-center justify-center rounded-xl bg-[#e53945] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ca2c38]"
                                    >
                                        Create Account
                                    </Link>
                                </>
                            )}

                            {isAuthenticated && (
                                <button
                                    onClick={handleLogout}
                                    className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#ff6670] transition hover:bg-[#e53945]/10"
                                >
                                    <LogOut size={17} />
                                    Sign out
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
