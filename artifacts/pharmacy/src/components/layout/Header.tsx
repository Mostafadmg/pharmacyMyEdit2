import React from "react";
import { Link } from "wouter";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">+</span>
        </div>
        <Link href="/" className="text-xl font-bold text-secondary cursor-pointer">
          PharmaCare
        </Link>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/conditions" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          Conditions
        </Link>
        <Link href="/track" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          Track Order
        </Link>
        <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          Pharmacist Portal
        </Link>
      </nav>
    </header>
  );
}
