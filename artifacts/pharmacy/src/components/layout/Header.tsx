import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Plus, User, LogOut, ShoppingBag, ChevronDown, ChevronRight, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { TREATMENTS_MENU } from "@/data/treatmentsMenu";
import NotificationBell from "@/components/NotificationBell";

export default function Header() {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaWrapperRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("patient_name");
    setPatientName(name);
    const handler = () => setPatientName(localStorage.getItem("patient_name"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [location]);

  // Escape key + click-outside close for mega-menu
  useEffect(() => {
    if (!isMegaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMegaOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      const root = megaWrapperRef.current;
      if (root && !root.contains(e.target as Node)) setIsMegaOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [isMegaOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMegaOpen(false);
    setOpenMobileSection(null);
  }, [location]);

  const handlePatientLogout = () => {
    ["patient_token", "patient_name", "patient_email", "patient_id"].forEach(k => localStorage.removeItem(k));
    setPatientName(null);
    navigate("/");
  };

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsMegaOpen(true);
  };
  const scheduleCloseMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsMegaOpen(false), 180);
  };

  const navLinks = [
    { name: "Shop", href: "/shop" },
    { name: "Health Hub", href: "/health-hub" },
    { name: "Pharmacist Portal", href: "/dashboard" },
  ];

  return (
    <header ref={megaWrapperRef} className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border/50 shadow-sm transition-all duration-300 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-nowrap items-center gap-3 lg:gap-4 h-20 min-w-0">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Plus className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <span className="text-xl sm:text-2xl tracking-tight whitespace-nowrap">
              <span className="font-extrabold text-secondary">Pharma</span>
              <span className="font-semibold text-primary">Care</span>
            </span>
          </Link>

          {/* Desktop primary navigation (centre) */}
          <nav
            className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-4 xl:gap-6 flex-nowrap"
            aria-label="Main"
          >
            <div
              className="relative shrink-0"
              onMouseEnter={openMega}
              onMouseLeave={scheduleCloseMega}
            >
              <button
                type="button"
                onClick={() => setIsMegaOpen(o => !o)}
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium relative group py-2 ${
                  isMegaOpen || location.startsWith("/conditions") || location.startsWith("/treatments")
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                } transition-colors`}
                data-testid="btn-treatments-menu"
                aria-expanded={isMegaOpen}
                aria-haspopup="true"
                aria-controls="treatments-mega-panel"
              >
                Treatments
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isMegaOpen ? "rotate-180" : ""}`} />
                <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  isMegaOpen ? "w-full" : "w-0 group-hover:w-full"
                }`}></span>
              </button>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`shrink-0 whitespace-nowrap text-sm font-medium relative group py-2 ${
                  location === link.href ? "text-primary" : "text-foreground hover:text-primary"
                } transition-colors`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  location === link.href ? "w-full" : "w-0 group-hover:w-full"
                }`}></span>
              </Link>
            ))}
          </nav>

          {/* Desktop utilities + account (right) */}
          <div className="hidden lg:flex shrink-0 items-center gap-1.5 xl:gap-2 ml-auto">
            <Link
              href="/wishlist"
              className="relative shrink-0 p-2 text-foreground hover:text-rose-500 transition-colors"
              data-testid="link-wishlist"
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative shrink-0 p-2 text-foreground hover:text-primary transition-colors"
              data-testid="link-cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center"
                  data-testid="cart-badge"
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            <div className="pl-1.5 xl:pl-2 border-l border-border h-8 flex shrink-0 items-center gap-1">
              {patientName && <NotificationBell audience="patient" />}
              {patientName ? (
                <div className="flex shrink-0 items-center gap-1 xl:gap-2">
                  <Link
                    href="/my-messages"
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground hover:text-primary transition-colors px-2 xl:px-3 py-1.5 rounded-full hover:bg-primary/5"
                    data-testid="link-messages"
                    title="Messages"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="hidden xl:inline">Messages</span>
                  </Link>
                  <Link
                    href="/account"
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground hover:text-primary transition-colors px-2 xl:px-3 py-1.5 rounded-full hover:bg-primary/5"
                    data-testid="link-account"
                  >
                    <User className="w-4 h-4 shrink-0" />
                    {patientName.split(" ")[0]}
                  </Link>
                  <button
                    onClick={handlePatientLogout}
                    className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/my-account/login"
                  className="shrink-0 whitespace-nowrap text-sm font-medium text-foreground hover:text-primary transition-colors px-2 xl:px-3 py-1.5 rounded-full hover:bg-primary/5 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 shrink-0" />
                  My Account
                </Link>
              )}
              <Button
                asChild
                className="shrink-0 whitespace-nowrap bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-full px-4 xl:px-6 text-sm shadow-sm hover:shadow transition-all duration-300"
              >
                <Link href="/conditions">Start consultation</Link>
              </Button>
            </div>
          </div>

          {/* Mobile cart + menu toggle */}
          <div className="md:hidden flex items-center gap-1">
            <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors" data-testid="link-cart-mobile" aria-label="Basket">
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[20px] h-5 px-1 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center" data-testid="cart-badge-mobile">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
            <button
              className="p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              data-testid="btn-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop mega-menu panel */}
      {isMegaOpen && (
        <div
          id="treatments-mega-panel"
          role="menu"
          className="hidden lg:block absolute left-0 right-0 top-20 bg-white border-t border-border/50 shadow-2xl z-40"
          onMouseEnter={openMega}
          onMouseLeave={scheduleCloseMega}
          data-testid="mega-menu-panel"
        >
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/conditions"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
                onClick={() => setIsMegaOpen(false)}
              >
                See all treatments
                <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="text-sm text-muted-foreground hidden lg:block">
                UK-registered pharmacist review · Same-day dispatch · GPhC 9011677
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-10">
              {TREATMENTS_MENU.map((col) => (
                <div key={col.title}>
                  <h3 className="font-bold text-foreground text-sm mb-4 border-b border-border/60 pb-2">
                    {col.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {col.items.map((item) => (
                      <li key={item.label + item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-primary hover:text-primary/70 hover:underline block leading-relaxed py-0.5"
                          onClick={() => setIsMegaOpen(false)}
                          data-testid={`mega-link-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        >
                          {item.label}
                          {item.isNew && (
                            <span className="ml-1.5 inline-block px-1.5 py-0 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">NEW</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-border shadow-lg animate-in slide-in-from-top-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 gap-1">
            {/* Treatments accordion (sections) */}
            <div className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenMobileSection(openMobileSection === "__root" ? null : "__root")}
                className="w-full flex items-center justify-between px-4 py-3 bg-primary/5 text-primary font-semibold text-base"
                data-testid="btn-mobile-treatments"
              >
                <span>Browse all treatments</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openMobileSection === "__root" ? "rotate-180" : ""}`} />
              </button>
              {openMobileSection === "__root" && (
                <div className="border-t border-border bg-white">
                  {TREATMENTS_MENU.map((col) => (
                    <div key={col.title} className="border-b border-border last:border-0">
                      <button
                        type="button"
                        onClick={() => setOpenMobileSection(openMobileSection === col.title ? "__root" : col.title)}
                        className="w-full flex items-center justify-between px-4 py-3 text-foreground font-medium text-sm"
                      >
                        {col.title}
                        <ChevronDown className={`w-4 h-4 transition-transform ${openMobileSection === col.title ? "rotate-180" : ""}`} />
                      </button>
                      {openMobileSection === col.title && (
                        <ul className="bg-muted/30 px-2 pb-2">
                          {col.items.map((item) => (
                            <li key={item.label + item.href}>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setOpenMobileSection(null);
                                  navigate(item.href);
                                }}
                                className="block w-full text-left px-3 py-2.5 text-sm text-primary hover:bg-primary/10 active:bg-primary/15 rounded-lg"
                              >
                                {item.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  <Link
                    href="/conditions"
                    className="block px-4 py-3 text-center text-sm font-semibold text-primary border-t border-border"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    See all conditions →
                  </Link>
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-3 rounded-xl text-base font-medium ${
                  location === link.href ? "bg-primary/5 text-primary" : "text-foreground hover:bg-muted"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/cart"
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium ${
                location === "/cart" ? "bg-primary/5 text-primary" : "text-foreground hover:bg-muted"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Basket</span>
              {itemCount > 0 && (
                <span className="min-w-[24px] h-6 px-2 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">{itemCount}</span>
              )}
            </Link>
            <div className="border-t border-border mt-2 pt-3 px-0">
              {patientName ? (
                <>
                  <Link
                    href="/my-messages"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </Link>
                  <Link
                    href="/my-consultations"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    My Consultations ({patientName.split(" ")[0]})
                  </Link>
                  <button
                    onClick={() => { handlePatientLogout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:bg-muted w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/my-account/login"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  My Account
                </Link>
              )}
            </div>
            <div className="px-4 pb-2">
              <Button
                asChild
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl h-12"
              >
                <Link href="/conditions" onClick={() => setIsMobileMenuOpen(false)}>
                  Start consultation
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
