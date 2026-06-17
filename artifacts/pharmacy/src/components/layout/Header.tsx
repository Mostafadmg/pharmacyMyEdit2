import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { EDM_ASSETS } from "@/data/everydaymedsAssets";
import ShopMegaMenu from "@/components/layout/ShopMegaMenu";
import MobileShopNav, { MobileNavLink, type MobileShopPanel } from "@/components/layout/MobileShopNav";
import SignInModal from "@/components/auth/SignInModal";
import { cn } from "@/lib/utils";



const NAV = [

  { label: "Home", href: "/" },

  { label: "About Us", href: "/about/our-service" },

  { label: "Shop", href: "/shop", dropdown: true },

  { label: "Weight Loss", href: "/treatments/weight-loss", highlight: true },

  { label: "Contact", href: "/contact" },

] as const;



export default function Header() {

  const [location, navigate] = useLocation();

  const [shopOpen, setShopOpen] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [mobileShopPanel, setMobileShopPanel] = useState<MobileShopPanel>("closed");
  const [signInOpen, setSignInOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { itemCount } = useCart();
  const isLoggedIn = typeof localStorage !== "undefined" && Boolean(localStorage.getItem("patient_token"));

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



  const closeMobile = () => {
    setMobileOpen(false);
    setMobileShopPanel("closed");
  };



  const isActive = (href: string) => {

    if (href === "/") return location === "/";

    if (href === "/shop") return location === "/shop" || location.startsWith("/collections/");

    return location.startsWith(href);

  };



  return (

    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

        <div className="flex items-center gap-3 lg:gap-5 min-h-[72px] py-2">

          <Link href="/" className="flex shrink-0 items-center" aria-label="EveryDayMeds">

            <img
              src={EDM_ASSETS.logoHeader}
              alt="EveryDayMeds"
              width={250}
              height={40}
              className="h-7 w-[156px] sm:h-8 sm:w-[200px] lg:h-10 lg:w-[250px] object-contain object-left"
            />

          </Link>



          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-medium text-gray-700">

            {NAV.map((item) =>

              item.dropdown ? (

                <div

                  key={item.label}

                  className="relative"

                  onMouseEnter={() => setShopOpen(true)}

                  onMouseLeave={() => setShopOpen(false)}

                >

                  <button

                    type="button"

                    className={cn(

                      "inline-flex items-center gap-1 hover:text-[#314a40]",

                      isActive(item.href) && "text-[#314a40] font-semibold",

                    )}

                    onClick={() => setShopOpen((v) => !v)}

                  >

                    {item.label}

                    <ChevronDown className={cn("h-4 w-4 transition-transform", shopOpen && "rotate-180")} />

                  </button>

                  {shopOpen ? <ShopMegaMenu onNavigate={() => setShopOpen(false)} /> : null}

                </div>

              ) : item.highlight ? (

                <Link

                  key={item.label}

                  href={item.href}

                  className="rounded-full bg-[#3d9a8b] px-4 py-2 text-white font-semibold hover:bg-[#358a7c] shadow-sm"

                >

                  {item.label}

                </Link>

              ) : (

                <Link

                  key={item.label}

                  href={item.href}

                  className={cn(

                    "hover:text-[#314a40]",

                    isActive(item.href) && "text-[#314a40] font-semibold",

                  )}

                >

                  {item.label}

                </Link>

              ),

            )}

          </nav>



          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md mx-auto">

            <div className="relative w-full">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

              <input

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                placeholder="I'm looking for…"

                className="w-full h-10 rounded-full border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm outline-none focus:border-[#314a40]/40"

              />

            </div>

          </form>



          <div className="ml-auto flex items-center gap-2 sm:gap-3">

            {isLoggedIn ? (
              <Link
                href="/my-orders"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#314a40]"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#314a40]"
                aria-label="Sign in"
              >
                <User className="h-5 w-5" />
              </button>
            )}

            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-[#314a40]" aria-label="Cart">

              <ShoppingBag className="h-5 w-5" />

              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">

                {itemCount > 9 ? "9+" : itemCount}

              </span>

            </Link>

            <button

              type="button"

              className="lg:hidden p-2 text-gray-800"

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
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-bold text-[#314a40]">Menu</span>
              <button
                type="button"
                onClick={closeMobile}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-3 py-3">
              {mobileShopPanel !== "closed" ? (
                <MobileShopNav
                  panel={mobileShopPanel}
                  setPanel={setMobileShopPanel}
                  onClose={closeMobile}
                />
              ) : (
                <>
                  <MobileNavLink href="/" label="Home" active={isActive("/")} onClick={closeMobile} />
                  <MobileNavLink
                    href="/about/our-service"
                    label="About Us"
                    active={isActive("/about/our-service")}
                    onClick={closeMobile}
                  />
                  <button
                    type="button"
                    onClick={() => setMobileShopPanel("main")}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-800 hover:bg-[#f5faf7]"
                  >
                    <span>Shop</span>
                    <ChevronDown className="h-4 w-4 opacity-50 -rotate-90" />
                  </button>
                  <MobileNavLink
                    href="/treatments/weight-loss"
                    label="Weight Loss"
                    highlight
                    onClick={closeMobile}
                  />
                  <MobileNavLink
                    href="/contact"
                    label="Contact"
                    active={isActive("/contact")}
                    onClick={closeMobile}
                  />
                </>
              )}
            </div>
          </aside>
        </>
      ) : null}

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </header>

  );

}

