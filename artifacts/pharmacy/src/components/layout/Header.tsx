import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Conditions", href: "/conditions" },
    { name: "Track Order", href: "/track" },
    { name: "Pharmacist Portal", href: "/dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Plus className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <span className="text-2xl tracking-tight">
              <span className="font-extrabold text-secondary">Pharma</span>
              <span className="font-semibold text-primary">Care</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`text-sm font-medium relative group py-2 ${
                  location === link.href ? "text-primary" : "text-foreground hover:text-primary"
                } transition-colors`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  location === link.href ? "w-full" : "w-0 group-hover:w-full"
                }`}></span>
              </Link>
            ))}
            
            <div className="pl-2 border-l border-border h-8 flex items-center">
              <Button 
                asChild 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-full px-6 shadow-sm hover:shadow transition-all duration-300"
              >
                <Link href="/conditions">Start consultation</Link>
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-border shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-4 gap-2">
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
            <div className="mt-4 px-4 pb-2">
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
