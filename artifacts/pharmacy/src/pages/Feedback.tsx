import React, { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MessageSquare, AlertCircle, ShieldCheck, Phone } from "lucide-react";
import { toast } from "sonner";

function getBase() {
  return (import.meta.env.BASE_URL as string).replace(/\/$/, "");
}

export default function Feedback() {
  const [type, setType] = useState<"complaint" | "feedback" | "concern">("feedback");
  const [name, setName] = useState(() => localStorage.getItem("patient_name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("patient_email") || "");
  const [phone, setPhone] = useState("");
  const [consultationRef, setConsultationRef] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Your name is required.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "A valid email is required so we can respond.";
    if (!subject.trim()) e.subject = "Please add a short subject line.";
    if (!message.trim() || message.trim().length < 20) e.message = "Please describe what happened (at least 20 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getBase()}/api/compliance/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, patientName: name.trim(), patientEmail: email.trim(),
          patientPhone: phone.trim() || undefined,
          consultationRef: consultationRef.trim() || undefined,
          subject: subject.trim(), message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit. Please try again.");
        return;
      }
      setRefId(String(data.id || "").slice(0, 8).toUpperCase());
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-20 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-50">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Thank you</h1>
          <p className="text-lg text-slate-600 mb-2">Your {type} has been logged with reference</p>
          <p className="text-2xl font-mono font-bold text-secondary mb-8">#{refId}</p>
          <Card className="text-left rounded-2xl shadow-sm border-border/60">
            <CardContent className="p-6 space-y-3 text-sm text-slate-700">
              <p className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> You will receive an acknowledgement at <strong>{email}</strong> within 2 working days.</p>
              <p className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Our Superintendent Pharmacist will lead the response and aim to reply fully within 20 working days.</p>
              <p className="flex items-start gap-2"><MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" /> If you do not hear from us, please email <a href="mailto:complaints@pharmacare.example.uk" className="text-primary font-semibold">complaints@pharmacare.example.uk</a>.</p>
            </CardContent>
          </Card>
          <div className="mt-8">
            <Button asChild className="rounded-full bg-primary font-bold px-8 h-12">
              <Link href="/">Return to homepage</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-16">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <MessageSquare className="w-4 h-4" /> Feedback &amp; concerns
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">We're listening</h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Tell us what's on your mind. Every message reaches our Superintendent Pharmacist and helps us improve patient safety.
          </p>
        </div>

        {/* Urgent banner */}
        <Card className="bg-amber-50 border-amber-200 rounded-2xl mb-8">
          <CardContent className="p-5 flex items-start gap-3">
            <Phone className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-bold mb-0.5">In an emergency call 999. For urgent medical advice call NHS&nbsp;111.</p>
              <p>This form is not monitored 24/7 — for time-critical concerns please use the channels above.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm border-border/60">
          <CardContent className="p-7 md:p-9 space-y-6">
            <div>
              <Label className="text-sm font-bold text-secondary mb-2 block">What kind of message is this?</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "feedback", l: "Feedback" },
                  { v: "concern", l: "Concern" },
                  { v: "complaint", l: "Complaint" },
                ].map(o => (
                  <button key={o.v} type="button" onClick={() => setType(o.v as typeof type)}
                    className={`px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all ${type === o.v ? "border-primary bg-primary/5 text-secondary" : "border-border/60 text-slate-600 hover:border-primary/40"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-sm font-bold text-secondary">Your name</Label>
                <Input className={`h-11 mt-2 rounded-xl bg-muted/20 ${errors.name ? "border-red-500" : ""}`} value={name} onChange={e => setName(e.target.value)} />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label className="text-sm font-bold text-secondary">Email</Label>
                <Input type="email" className={`h-11 mt-2 rounded-xl bg-muted/20 ${errors.email ? "border-red-500" : ""}`} value={email} onChange={e => setEmail(e.target.value)} />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label className="text-sm font-bold text-secondary">Phone <span className="font-normal text-slate-500">(optional)</span></Label>
                <Input className="h-11 mt-2 rounded-xl bg-muted/20" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-bold text-secondary">Consultation reference <span className="font-normal text-slate-500">(if relevant)</span></Label>
                <Input className="h-11 mt-2 rounded-xl bg-muted/20 font-mono uppercase" value={consultationRef} onChange={e => setConsultationRef(e.target.value.toUpperCase())} placeholder="e.g. AB12CD34" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold text-secondary">Subject</Label>
              <Input className={`h-11 mt-2 rounded-xl bg-muted/20 ${errors.subject ? "border-red-500" : ""}`} value={subject} onChange={e => setSubject(e.target.value)} placeholder="One line summary" />
              {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject}</p>}
            </div>

            <div>
              <Label className="text-sm font-bold text-secondary">Message</Label>
              <Textarea className={`min-h-[160px] mt-2 rounded-xl bg-muted/20 resize-none ${errors.message ? "border-red-500" : ""}`} value={message} onChange={e => setMessage(e.target.value)} placeholder="Please describe what happened, including dates, names and what you would like us to do." />
              {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
            </div>

            <Button onClick={handleSubmit} disabled={submitting} size="lg" className="w-full h-14 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
              {submitting ? "Submitting..." : `Submit ${type}`}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              By submitting you confirm you have read our <Link href="/legal/privacy" className="text-primary underline">privacy policy</Link> and our <Link href="/legal/complaints" className="text-primary underline">complaints procedure</Link>.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
