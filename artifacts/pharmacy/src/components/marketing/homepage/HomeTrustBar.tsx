import React from "react";
import { TRUST_BAR_ITEMS } from "@/data/everydaymedsAssets";

function TrustMarqueeTrack({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="marquee__track" aria-hidden={ariaHidden || undefined}>
      {TRUST_BAR_ITEMS.map(({ icon, label }) => (
        <div key={label} className="marquee-item">
          <span className="marquee-item__icon">
            <img src={icon} alt={ariaHidden ? "" : label} loading="lazy" />
          </span>
          <span className="marquee-item__text">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function HomeTrustBar() {
  return (
    <section className="marquee-icons edm-trust-marquee border-y border-[#c5dfd0]">
      <div
        className="marquee marquee--pauseable"
        style={
          {
            "--marquee-speed": "25s",
            "--marquee-gap": "48px",
            "--icon-size": "28px",
            "--item-pad": "10px",
            "--divider-opacity": "0.2",
          } as React.CSSProperties
        }
      >
        <div className="marquee__mask">
          <TrustMarqueeTrack />
          <TrustMarqueeTrack ariaHidden />
        </div>
      </div>
    </section>
  );
}
