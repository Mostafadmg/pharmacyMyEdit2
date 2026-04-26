import React from "react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">+</span>
            </div>
            <span className="text-xl font-bold text-white">PharmaCare</span>
          </div>
          <p className="text-secondary-foreground/80 max-w-sm mb-6">
            Private pharmacy consultations, reviewed by UK pharmacist prescribers. Secure, fast, and confidential online healthcare.
          </p>
          <div className="flex gap-4 text-sm text-secondary-foreground/60">
            <span>GPhC Reg: 1234567</span>
            <span>CQC Registered</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-4 text-white">Services</h3>
          <ul className="space-y-2 text-secondary-foreground/80">
            <li><Link href="/conditions" className="hover:text-primary transition-colors">All Conditions</Link></li>
            <li><Link href="/track" className="hover:text-primary transition-colors">Track Consultation</Link></li>
            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Pharmacist Login</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-4 text-white">Legal</h3>
          <ul className="space-y-2 text-secondary-foreground/80">
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Complaints</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-secondary-foreground/20 text-center text-sm text-secondary-foreground/60">
        <p>&copy; {new Date().getFullYear()} PharmaCare Digital Pharmacy. All rights reserved.</p>
      </div>
    </footer>
  );
}
