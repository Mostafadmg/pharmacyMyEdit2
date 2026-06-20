import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { EDM_ASSETS } from "@/data/everydaymedsAssets";
import SignInModal from "@/components/auth/SignInModal";
import { cn } from "@/lib/utils";

/** Matches everydaymeds.co.uk main navigation (Home · About Us · Weight Loss · Help). */
const NAV = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about/our-service" },
  { label: "Weight Loss", href: "/treatments/weight-loss" },
  { label: "Help", href: "/contact" },
] as const;

function navIsActive(location: string, href: string): boolean {
  if (href === "/") return location === "/";
  if (href === "/treatments/weight-loss") {
    return (
      location.startsWith("/treatments/weight-loss") ||
      location.startsWith("/pages/weight-loss") ||
      location.startsWith("/consultation/weight-loss") ||
      location === "/injectable-weight-loss"
    );
  }
  if (href === "/about/our-service") {
    return location.startsWith("/about") || location.startsWith("/pages/about-us");
  }
  if (href === "/contact") {
    return location === "/contact" || location.startsWith("/pages/contact");
  }
  return location.startsWith(href);
}

export default function Header() {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [patientName, setPatientName] = useState<string | null>(null);
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const isLoggedIn =
    typeof localStorage !== "undefined" && Boolean(localStorage.getItem("patient_token"));

  useEffect(() => {
    setPatientName(localStorage.getItem("patient_name"));
    const onStorage = () => setPatientName(localStorage.getItem("patient_name"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [location]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  };

  const closeMobile = () => setMobileOpen(false);

  const accountHref = isLoggedIn ? "/account/profile" : "/my-account/login";
  const accountLabel = isLoggedIn
    ? patientName?.trim() || "My account"
    : "Login / Register";

  return (
    <header className="edm-header sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-6 min-h-[64px] py-2">
          <Link href="/" className="flex shrink-0 items-center" aria-label="EveryDayMeds">
            <img
              src={EDM_ASSETS.logoHeader}
              alt="EveryDayMeds"
              width={250}
              height={40}
              className="h-7 w-[156px] sm:h-8 sm:w-[200px] lg:h-10 lg:w-[250px] object-contain object-left"
            />
          </Link>

          <nav
            className="hidden lg:flex items-center justify-center gap-5 xl:gap-6 text-sm font-semibold text-gray-700"
            aria-label="Main"
          >
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "py-2 hover:text-[var(--edm-dark)] transition-colors",
                  navIsActive(location, item.href) && "text-[var(--edm-dark)]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <form onSubmit={onSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="I'm looking for…"
                  aria-label="Search products"
                  className="w-[200px] lg:w-[220px] h-10 rounded-full border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm outline-none focus:border-[var(--edm-dark)]/30"
                />
              </div>
            </form>

            {isLoggedIn ? (
              <Link
                href={accountHref}
                className="hidden sm:inline-flex h-11 w-11 items-center justify-center text-gray-700 hover:text-[var(--edm-dark)]"
                aria-label={accountLabel}
                title={accountLabel}
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="hidden sm:inline-flex h-11 w-11 items-center justify-center text-gray-700 hover:text-[var(--edm-dark)]"
                aria-label="Login / Register"
              >
                <User className="h-5 w-5" />
              </button>
            )}

            <Link
              href="/wishlist"
              className="hidden sm:relative sm:inline-flex h-11 w-11 items-center justify-center text-gray-700 hover:text-rose-500"
              aria-label="Wishlist"
            >
              <Heart
                className={cn("h-5 w-5", wishlistCount > 0 && "fill-rose-500 text-rose-500")}
              />
              {wishlistCount > 0 ? (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/cart"
              className="relative inline-flex h-11 w-11 items-center justify-center text-gray-700 hover:text-[var(--edm-dark)]"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center text-gray-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <aside
            className="edm-mobile-drawer fixed left-0 top-0 bottom-0 z-[70] w-[min(320px,88vw)] bg-white shadow-2xl lg:hidden overflow-y-auto"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between bg-[#0b4131] px-4 py-3 text-white">
              <span className="text-sm font-bold">Menu</span>
              <button
                type="button"
                onClick={closeMobile}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSearch} className="p-3 border-b border-gray-100 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="I'm looking for…"
                  className="w-full h-10 rounded-full border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm outline-none"
                />
              </div>
            </form>

            <div className="px-2 py-2">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "block rounded-lg px-3 py-3 text-sm font-medium text-gray-800 hover:bg-[#f5faf7]",
                    navIsActive(location, item.href) && "text-[var(--edm-dark)] font-semibold bg-[#f5faf7]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/wishlist"
                onClick={closeMobile}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-gray-800 hover:bg-[#f5faf7]"
              >
                <Heart className="h-4 w-4" />
                Wishlist
                {wishlistCount > 0 ? (
                  <span className="ml-auto text-xs font-bold text-rose-500">{wishlistCount}</span>
                ) : null}
              </Link>
              <Link
                href={accountHref}
                onClick={closeMobile}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-gray-800 hover:bg-[#f5faf7]"
              >
                <User className="h-4 w-4" />
                {accountLabel}
              </Link>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    ["patient_token", "patient_name", "patient_email", "patient_id"].forEach((k) =>
                      localStorage.removeItem(k),
                    );
                    closeMobile();
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 text-left"
                >
                  Log out
                </button>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </header>
  );
}
