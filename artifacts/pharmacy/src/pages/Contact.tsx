import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone, Mail, MapPin, Clock, MessageSquare, ShieldCheck,
  AlertTriangle, CheckCircle2, Send, ChevronRight, ExternalLink,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const CONTACT_DETAILS = [
  {
    icon: <Phone className="w-5 h-5" />,
    label: "Telephone",
    value: "0800 123 4567",
    sub: "Mon–Fri 8am–8pm, Sat 9am–5pm",
    href: "tel:08001234567",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: <Mail className="w-5 h-5" />,
    label: "Email",
    value: "support@pharmacare.co.uk",
    sub: "We aim to respond within 4 hours",
    href: "mailto:support@pharmacare.co.uk",
    color: "text-primary",
    bg: "bg-primary/5",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: "Registered Address",
    value: "12 Health Street, London, EC1A 1BB",
    sub: "GPhC Registration: 1234567",
    href: "https://maps.google.com",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    label: "Opening Hours",
    value: "Mon–Fri: 8am – 8pm",
    sub: "Sat: 9am – 5pm · Sun: Closed",
    href: null,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const FAQ_ITEMS = [
  {
    q: "How quickly will my consultation be reviewed?",
    a: "Our pharmacists review consultations typically within 2 hours during working hours (Mon–Fri 8am–8pm). Urgent cases are prioritised.",
  },
  {
    q: "Can I cancel my consultation?",
    a: "Yes — you can cancel a pending consultation from your patient portal at any time before it has been reviewed. Once reviewed, cancellation is not possible.",
  },
  {
    q: "How do I track my order/prescription?",
    a: "Log into your patient portal to see real-time status updates, or use our consultation tracker with your email address.",
  },
  {
    q: "What if I need urgent medical help?",
    a: "Call 999 for life-threatening emergencies, or 111 for urgent non-emergency advice. Do not wait for an online consultation in an emergency.",
  },
  {
    q: "Is my information kept confidential?",
    a: "Yes. We are GPhC registered and comply fully with UK GDPR and Data Protection Act 2018. Your medical information is encrypted and only accessed by our clinical team.",
  },
  {
    q: "Do you deliver across the UK?",
    a: "We deliver prescriptions to all UK addresses via tracked Royal Mail or DHL. Next-day delivery is available on prescriptions approved before 2pm.",
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim() || form.message.trim().length < 10) e.message = "Please provide a message (at least 10 characters)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F3460] via-[#0A2A4A] to-[#061A30] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #0A7EA4 0%, transparent 60%)" }} />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-semibold px-4 py-2 rounded-full border border-white/20 mb-6">
            <MessageSquare className="w-4 h-4" /> Get in touch
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-serif font-bold mb-4">
            How can we help?
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg text-white/70 max-w-2xl mx-auto">
            Our clinical team and patient support staff are here to help. Choose the best way to reach us below.
          </motion.p>
        </div>
      </section>

      {/* Emergency banner */}
      <div className="bg-red-600 text-white py-3 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-sm font-semibold text-center">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Medical emergency? Call <strong>999</strong> immediately. Urgent advice? Call <strong>NHS 111</strong> or visit <a href="https://111.nhs.uk" target="_blank" rel="noopener noreferrer" className="underline">111.nhs.uk</a></span>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 space-y-16">

        {/* Contact cards */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-secondary mb-8 text-center">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CONTACT_DETAILS.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                {item.href ? (
                  <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                    className="block bg-white rounded-2xl border border-border/50 shadow-sm p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group h-full">
                    <div className={`w-11 h-11 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                    <p className={`font-bold text-base ${item.color} mb-1`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                    {item.href.startsWith("http") && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground mt-2" />}
                  </a>
                ) : (
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 h-full">
                    <div className={`w-11 h-11 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                      {item.icon}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                    <p className={`font-bold text-base ${item.color} mb-1`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact form + FAQ */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-[#0A7EA4]" />
              <div className="p-8">
                <h2 className="text-2xl font-serif font-bold text-secondary mb-2">Send us a message</h2>
                <p className="text-muted-foreground text-sm mb-8">For non-urgent enquiries. We typically respond within 4 hours on working days.</p>

                {submitted ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="py-10 text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary">Message Sent!</h3>
                    <p className="text-muted-foreground">Thank you, <strong>{form.name.split(" ")[0]}</strong>. We'll respond to <strong>{form.email}</strong> within 4 working hours.</p>
                    <Button variant="outline" className="rounded-full mt-4 border-2 font-bold" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                      Send another message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-secondary">Full Name</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Jane Smith" className={`h-12 rounded-xl bg-muted/20 ${errors.name ? "border-red-500" : ""}`} />
                        {errors.name && <p className="text-red-600 text-xs font-medium">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-secondary">Email Address</Label>
                        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="jane@example.com" className={`h-12 rounded-xl bg-muted/20 ${errors.email ? "border-red-500" : ""}`} />
                        {errors.email && <p className="text-red-600 text-xs font-medium">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-secondary">Subject</Label>
                      <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        placeholder="e.g. Question about my consultation" className={`h-12 rounded-xl bg-muted/20 ${errors.subject ? "border-red-500" : ""}`} />
                      {errors.subject && <p className="text-red-600 text-xs font-medium">{errors.subject}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-secondary">Your Message</Label>
                      <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="Please describe your enquiry in detail..." rows={5}
                        className={`rounded-xl bg-muted/20 resize-none text-base ${errors.message ? "border-red-500" : ""}`} />
                      {errors.message && <p className="text-red-600 text-xs font-medium">{errors.message}</p>}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/10 p-3 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                      <span>Your message is encrypted and handled in accordance with UK GDPR. We never share your data.</span>
                    </div>

                    <Button type="submit" disabled={sending} size="lg"
                      className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-md">
                      {sending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Message</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-serif font-bold text-secondary mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                  <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/10 transition-colors">
                    <span className="text-sm font-bold text-secondary">{item.q}</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                      {item.a}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Regulatory info */}
            <div className="mt-6 bg-slate-100 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider">Regulatory Information</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>GPhC Registration No: <strong className="text-secondary">1234567</strong></p>
                <p>CQC Registered Provider</p>
                <p>ICO Registration: <strong className="text-secondary">ZA123456</strong></p>
                <p className="pt-1">Complaints: <a href="mailto:complaints@pharmacare.co.uk" className="text-primary hover:underline">complaints@pharmacare.co.uk</a></p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
