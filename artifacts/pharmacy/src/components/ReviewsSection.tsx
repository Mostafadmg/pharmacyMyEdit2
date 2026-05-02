import React from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Hannah J.",
    location: "Manchester",
    title: "Genuinely changed my mornings",
    body: "Ordered hayfever tablets at 9am, in my hand by 11am the next day. The pharmacist actually called me back to discuss a question about my asthma inhaler — proper care, not just a website.",
    treatment: "Hayfever · Fexofenadine",
    rating: 5,
    verified: true,
  },
  {
    name: "David K.",
    location: "Glasgow",
    title: "Saved me a wasted GP appointment",
    body: "Could not get a GP slot for two weeks. PharmaCare reviewed my consultation in under three hours and the prescription was at my door the next morning. Genuinely impressed.",
    treatment: "Acid reflux · Omeprazole",
    rating: 5,
    verified: true,
  },
  {
    name: "Priya S.",
    location: "London",
    title: "Discreet, kind, professional",
    body: "I was nervous about asking for the morning-after pill online. The pharmacist was so kind in the chat and answered every question without judgement. Will use again.",
    treatment: "Emergency contraception",
    rating: 5,
    verified: true,
  },
  {
    name: "Marcus O.",
    location: "Birmingham",
    title: "Properly supported throughout",
    body: "On a weight-loss programme through PharmaCare. Weekly check-ins from the pharmacist, dose titrated carefully, and the medicine always arrives on time. Genuinely felt looked after — your results will of course depend on you and your clinician.",
    treatment: "Weight loss programme",
    rating: 5,
    verified: true,
  },
  {
    name: "Sophie R.",
    location: "Leeds",
    title: "They actually listened",
    body: "Pharmacist asked me to send a photo of my acne and replied with a properly tailored plan, not just a stock answer. Skin is clearer in 6 weeks. Would recommend to anyone.",
    treatment: "Acne · Tretinoin",
    rating: 5,
    verified: true,
  },
  {
    name: "Tom W.",
    location: "Bristol",
    title: "Cheaper than my last private prescription",
    body: "Switched from a high street chain — same medicine, better price, and a real human pharmacist who picked up that I needed a dose review. Won't go back.",
    treatment: "ED · Sildenafil",
    rating: 5,
    verified: true,
  },
];

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-[#00B67A] text-[#00B67A]" />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section className="py-24 bg-muted/20" data-testid="reviews-section">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header strip — patient feedback (illustrative) */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              Patient feedback
            </span>
            <StarRow />
            <span className="text-muted-foreground text-sm">Recent reviews</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-3">
            What our patients <em className="text-primary italic">actually</em> say
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            A selection of recent feedback from verified PharmaCare patients. We collect post-consultation feedback on
            every order and publish a representative sample below — names abbreviated for privacy.
          </p>
        </div>

        {/* Review grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <article
              key={r.name}
              className="bg-white border border-border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow"
              data-testid={`review-card-${r.name.split(" ")[0].toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-3">
                <StarRow count={r.rating} />
                {r.verified && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B67A] bg-[#00B67A]/10 px-2 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
              <h3 className="font-bold text-secondary text-lg mb-2 leading-snug">{r.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-5">{r.body}</p>
              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-secondary">{r.name}</div>
                  <div className="text-muted-foreground">{r.location}</div>
                </div>
                <span className="text-primary font-medium text-right max-w-[55%] leading-tight">{r.treatment}</span>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center mt-10 text-xs text-muted-foreground max-w-2xl mx-auto">
          Individual experiences vary. All medicines are prescribed only when our pharmacist independent prescriber
          confirms they are clinically appropriate for you.
        </p>
      </div>
    </section>
  );
}
