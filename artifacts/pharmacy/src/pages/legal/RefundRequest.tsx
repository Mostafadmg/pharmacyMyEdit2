import React, { useState } from "react";
import { Link } from "wouter";
import EdmPolicyPage from "@/components/layout/EdmPolicyPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY } from "@/data/everydaymedsSite";

export default function RefundRequest() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ orderNumber: "", email: "", reason: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.orderNumber.trim() || !form.email.trim() || !form.reason.trim()) return;
    setSubmitted(true);
  }

  return (
    <EdmPolicyPage title="Refund Request">
      <p>
        Use this form to request a refund for an order. For urgent queries you can also email{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or call {COMPANY.phoneDisplay}.
      </p>
      <p>
        Please read our{" "}
        <Link href="/legal/returns" className="text-[#314a40] font-semibold hover:underline">
          Returns and Refunds Policy
        </Link>{" "}
        before submitting a request.
      </p>

      {submitted ? (
        <div className="mt-8 rounded-xl bg-[#faf6f3] border border-gray-200 p-6">
          <p className="font-semibold text-[#314a40]">Your refund request has been received.</p>
          <p className="text-sm text-gray-600 mt-2">We will respond to {form.email} within 2 working days.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="order-number">Order number*</Label>
            <Input
              id="order-number"
              value={form.orderNumber}
              onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-email">Your email*</Label>
            <Input
              id="refund-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason for refund*</Label>
            <Textarea
              id="refund-reason"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              required
              rows={4}
              className="rounded-xl resize-none"
            />
          </div>
          <Button type="submit" className="rounded-xl bg-[#314a40] hover:bg-[#2a4038] text-white h-11 px-8">
            Submit request
          </Button>
        </form>
      )}
    </EdmPolicyPage>
  );
}
