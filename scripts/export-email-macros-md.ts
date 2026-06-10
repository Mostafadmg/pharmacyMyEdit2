import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  EMAIL_MACROS,
  MACRO_CATEGORIES,
} from "../artifacts/pharmacist-rx/src/components/tools/macroLibraryData.ts";

const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../artifacts/pharmacist-rx/docs/email-macros-review.md",
);

mkdirSync(dirname(outPath), { recursive: true });

const lines: string[] = [
  "# Email Macros Library — Review Document",
  "",
  "> Generated from the Rx portal macro library. Share this file for review — note any macros to **add**, **edit**, or **remove**.",
  "",
  `**Total macros:** ${EMAIL_MACROS.length}`,
  "",
  "## How placeholders work",
  "",
  "| Placeholder | Meaning |",
  "| --- | --- |",
  "| `<<Patient Name>>` | Filled with the patient's name when sending from the portal |",
  "| `[INSERT ...]` | Prescriber fills in before sending |",
  "| `Kind regards,\\nThe Clinical Team` | Replaced with the logged-in prescriber's name |",
  "",
  "**Note:** `Subject:` lines are stripped automatically when a macro is loaded in the portal — messages start at the patient greeting.",
  "",
  "---",
  "",
  "## Table of contents",
  "",
];

for (const cat of MACRO_CATEGORIES) {
  const items = EMAIL_MACROS.filter((m) => m.category === cat);
  if (!items.length) continue;
  lines.push(`- [${cat}](#${slug(cat)}) (${items.length})`);
}

lines.push("", "---", "");

for (const cat of MACRO_CATEGORIES) {
  const items = EMAIL_MACROS.filter((m) => m.category === cat);
  if (!items.length) continue;

  lines.push(`## ${cat}`, "", `*${items.length} macro(s)*`, "");

  for (const m of items) {
    lines.push(
      `### ${m.name}`,
      "",
      "| Field | Value |",
      "| --- | --- |",
      `| **ID** | \`${m.id}\` |`,
      `| **Category** | ${m.category} |`,
      `| **Description** | ${m.description} |`,
      "",
      "**Message:**",
      "",
      "```text",
      m.content.trim(),
      "```",
      "",
      "---",
      "",
    );
  }
}

lines.push(
  "## Review checklist (for reviewer)",
  "",
  "For each macro, mark one of:",
  "",
  "- **Keep** — no changes",
  "- **Edit** — wording or clinical content needs updating (add notes inline)",
  "- **Remove** — no longer needed",
  "- **New** — suggest a new macro under the relevant category",
  "",
);

writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${EMAIL_MACROS.length} macros to ${outPath}`);

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
