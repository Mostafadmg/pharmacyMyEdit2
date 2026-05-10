import React, { useState } from "react";
import { MessageCircle, X, Phone, Mail, FileQuestion, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function LiveHelpFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          className="fixed z-[60] bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
          role="dialog"
          aria-label="Help options"
          data-testid="live-help-panel"
        >
          {/* Header */}
          <div className="bg-secondary text-white px-5 py-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-0.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Pharmacist online
              </div>
              <h3 className="font-bold text-lg">How can we help?</h3>
              <p className="text-white/70 text-xs mt-0.5">Average reply within 4 hours · Mon–Fri 8am–8pm</p>
            </div>
            <button
              type="button"
              aria-label="Close help"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options */}
          <div className="p-3 space-y-1.5">
            <Link
              href="/my-consultations"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group"
              data-testid="help-option-message"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-secondary text-sm">Message my pharmacist</div>
                <div className="text-xs text-muted-foreground">Securely chat about an existing consultation</div>
              </div>
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group"
              data-testid="help-option-faq"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileQuestion className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-secondary text-sm">FAQs & general questions</div>
                <div className="text-xs text-muted-foreground">Browse common questions or send us an enquiry</div>
              </div>
            </Link>

            <div className="pt-2 mt-2 border-t border-border grid grid-cols-2 gap-2">
              <a
                href="tel:08000209090"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted text-sm font-semibold text-secondary"
              >
                <Phone className="w-4 h-4 text-primary" /> 0800 020 9090
              </a>
              <a
                href="mailto:care@pharmacare.example.uk"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted text-sm font-semibold text-secondary"
              >
                <Mail className="w-4 h-4 text-primary" /> Email
              </a>
            </div>

            {/* NHS safety */}
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-900 leading-relaxed">
              <strong>Medical emergency?</strong> Call <strong>999</strong>. For urgent advice call <strong>NHS 111</strong> or visit{" "}
              <a href="https://111.nhs.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline inline-flex items-center gap-0.5">
                111.nhs.uk <ExternalLink className="w-3 h-3" />
              </a>.
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close help" : "Open help"}
        className="fixed z-[60] bottom-5 right-4 sm:right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        data-testid="live-help-fab"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-accent border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  );
}
