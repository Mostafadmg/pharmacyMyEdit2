import React, { useState } from "react";
import { Link } from "wouter";
import SiteLayout from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { COMPANY } from "@/data/everydaymedsSite";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", consent: false });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || !form.consent) return;
    setSubmitted(true);
  };

  return (
    <SiteLayout className="min-h-screen flex flex-col bg-white edm-site">
      <main className="flex-1">
        <section className="bg-[#faf6f3] py-8 sm:py-10 border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <nav className="text-sm text-gray-500 text-center mb-4">
              <Link href="/" className="hover:text-[#314a40]">Home</Link>
              <span className="mx-2">&gt;</span>
              <span className="text-[#314a40] font-medium">Contact</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">Contact Us</h1>
            <p className="mt-3 text-center text-gray-600 text-sm sm:text-base">
              Please use the below form. You can also call customer service on{" "}
              <a href={COMPANY.phoneHref} className="font-semibold text-[#314a40] hover:underline">
                {COMPANY.phoneDisplay}
              </a>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#314a40] mb-2">Customer Support</h2>
              <p className="text-gray-600 text-sm mb-4">
                Have a question? Please contact us using the customer support channels below.
              </p>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <p className="font-bold text-[#314a40] mb-1">Customer Care:</p>
                  <p>
                    Phone:{" "}
                    <a href={COMPANY.phoneHref} className="text-[#314a40] hover:underline">
                      {COMPANY.phoneDisplay}
                    </a>
                  </p>
                  <p>
                    Email:{" "}
                    <a href={`mailto:${COMPANY.email}`} className="text-[#314a40] hover:underline">
                      {COMPANY.email}
                    </a>
                  </p>
                </div>
                <div>
                  <p className="font-bold text-[#314a40] mb-1">Customer Support Hours</p>
                  <p>{COMPANY.supportHours}</p>
                  <p>{COMPANY.supportHoursNote}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#314a40] mb-2">Contact Us</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please submit all general enquiries in the contact form below and we look forward to hearing from you soon.
            </p>

            {submitted ? (
              <div className="py-8 text-center rounded-2xl border border-gray-100 bg-[#faf6f3]">
                <p className="text-[#314a40] font-semibold">Thank you — your message has been sent.</p>
                <p className="text-sm text-gray-600 mt-2">We&apos;ll respond to {form.email} as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Your name</Label>
                    <Input
                      id="contact-name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      className="h-12 rounded-xl border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Your Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                      className="h-12 rounded-xl border-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Enter please your message</Label>
                  <Textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    required
                    rows={5}
                    className="rounded-xl resize-none"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="contact-consent"
                    checked={form.consent}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, consent: v === true }))}
                  />
                  <Label htmlFor="contact-consent" className="text-sm leading-relaxed font-normal text-gray-700">
                    I agree to the{" "}
                    <Link href="/legal/privacy" className="text-[#314a40] font-semibold hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    of the website.
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Send
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
