/**
 * Patient-facing "what's required" rules for each document slot.
 *
 * Shown in a modal when a patient needs to (re)upload a document so they know
 * exactly what makes an upload eligible. Content is intentionally richer than
 * the short `criteria` in `@workspace/evidence-slots` — those drive compact
 * card hints, these drive the full requirements modal.
 *
 * NOTE: the full-body and weight-scale slots are VIDEOS, so their sections say
 * "Video must show" (not "Photo must show").
 */

import { isEvidenceSlotId, type EvidenceSlotId } from "@workspace/evidence-slots";

/** A run of text; `bold` spans render emphasised (mid-sentence allowed). */
export type RuleSpan = { text: string; bold?: boolean };

/** Bulleted requirements with a small caps heading. */
export type RuleBulletSection = {
  kind: "bullets";
  heading: string;
  items: RuleSpan[][];
};

/** Two-column requirement / details table. */
export type RuleTableSection = {
  kind: "table";
  heading?: string;
  columns: [string, string];
  rows: [string, string][];
};

export type RuleSection = RuleBulletSection | RuleTableSection;

export type DocumentRuleSet = {
  /** Modal title, e.g. "ID Verification". */
  title: string;
  /** Optional lead paragraph under the title. */
  intro?: RuleSpan[];
  sections: RuleSection[];
};

const ID_RULES: DocumentRuleSet = {
  title: "ID Verification",
  sections: [
    {
      kind: "bullets",
      heading: "Requirements for valid ID",
      items: [
        [
          { text: "Full name, DoB, and photo ", bold: true },
          { text: "must be visible and match account" },
        ],
        [
          { text: "Must be from " },
          { text: "official governmental organisation", bold: true },
          { text: " (UK or overseas acceptable)" },
        ],
        [{ text: "Pass Cards and other formal ID may be accepted" }],
        [
          { text: "First orders:", bold: true },
          { text: " ID must be in date" },
        ],
        [
          { text: "Repeat orders:", bold: true },
          { text: " Expired ID is acceptable" },
        ],
      ],
    },
  ],
};

const FULL_BODY_RULES: DocumentRuleSet = {
  title: "Full Body Video",
  intro: [{ text: "Record a live video (not a photo or screenshot)." }],
  sections: [
    {
      kind: "bullets",
      heading: "Video must show",
      items: [
        [
          { text: "Patient alone, " },
          { text: "full-length view", bold: true },
          { text: ", face clearly visible" },
        ],
        [{ text: "No sunglasses or phone covering face" }],
        [
          { text: "Fitted clothing", bold: true },
          { text: " (may accept loose if BMI still validatable)" },
        ],
        [{ text: "Same person as appears in ID" }],
      ],
    },
  ],
};

const WEIGHT_SCALE_RULES: DocumentRuleSet = {
  title: "Weight Scale Video",
  intro: [{ text: "Record a live video (not a photo or screenshot)." }],
  sections: [
    {
      kind: "bullets",
      heading: "Video must show",
      items: [
        [
          { text: "You standing on the scale, " },
          { text: "face clearly visible", bold: true },
        ],
        [
          { text: "The " },
          { text: "weight reading", bold: true },
          { text: " legible in the same shot (kg or st/lb)" },
        ],
        [{ text: "No editing, zoom, or cropped frames" }],
        [{ text: "Same person as appears in ID" }],
      ],
    },
  ],
};

const PUE_RULES: DocumentRuleSet = {
  title: "What PUE Must Show",
  intro: [
    { text: "Valid Previous Use Evidence must include " },
    { text: "all four", bold: true },
    { text: " of the following:" },
  ],
  sections: [
    {
      kind: "table",
      columns: ["Requirement", "Details"],
      rows: [
        ["1. Patient Name/Email", "Full name (not nickname) OR patient's email address"],
        ["2. Medication & Dose", "Specific medication name and dosage prescribed"],
        ["3. Date", "Order date, prescription date, OR dispatch date"],
        ["4. From Regulated Body", "Must be from a legitimate healthcare provider/pharmacy"],
      ],
    },
  ],
};

const BMI_RULES: DocumentRuleSet = {
  title: "Previous BMI Verification",
  intro: [
    {
      text: "Proof you met BMI criteria when you started weight-loss injections with your previous provider.",
    },
  ],
  sections: [
    {
      kind: "bullets",
      heading: "Document must show",
      items: [
        [
          { text: "A " },
          { text: "weight or BMI reading", bold: true },
          { text: " from when you began treatment with the other provider" },
        ],
        [
          { text: "Distinct from a prescription alone", bold: true },
          { text: " — we need proof you met BMI criteria at the start" },
        ],
        [{ text: "Your name and a date should be visible where possible" }],
      ],
    },
  ],
};

const SUPPORTING_RULES: DocumentRuleSet = {
  title: "Supporting Evidence",
  sections: [
    {
      kind: "bullets",
      heading: "What to include",
      items: [
        [{ text: "Letters or clinic notes for conditions you reported" }],
        [
          { text: "Optional", bold: true },
          { text: " unless your pharmacist has asked for it" },
        ],
      ],
    },
  ],
};

const RULES_BY_SLOT: Record<EvidenceSlotId, DocumentRuleSet> = {
  "government-id": ID_RULES,
  "full-body-video": FULL_BODY_RULES,
  "weight-scale-video": WEIGHT_SCALE_RULES,
  "previous-prescription": PUE_RULES,
  "previous-bmi-verification": BMI_RULES,
  "supporting-evidence": SUPPORTING_RULES,
};

/** Generic fallback when a document id has no dedicated rule set. */
const GENERIC_RULES: DocumentRuleSet = {
  title: "Document Requirements",
  sections: [
    {
      kind: "bullets",
      heading: "Requirements",
      items: [
        [{ text: "Clear, in full and easy to read" }],
        [{ text: "Matches the details on your account" }],
        [{ text: "Not edited, cropped, or expired" }],
      ],
    },
  ],
};

/** Rule set for a document slot id (falls back to a generic set). */
export function documentRulesFor(docId: string): DocumentRuleSet {
  if (isEvidenceSlotId(docId)) return RULES_BY_SLOT[docId];
  return GENERIC_RULES;
}
