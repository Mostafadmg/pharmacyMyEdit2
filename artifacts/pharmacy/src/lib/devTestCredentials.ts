/** Local dev / QA only — shown when `import.meta.env.DEV` is true. */

export type DevCredential = {
  label: string;
  username: string;
  password: string;
  note?: string;
};

export const DEV_PATIENT_ACCOUNTS: DevCredential[] = [
  {
    label: "Mostafa (test account)",
    username: "mostafa.damghani.md@gmail.com",
    password: "test123",
    note: "Seed with: npx tsx scripts/src/ensure-mostafa-patient.ts",
  },
];

export const DEV_PHARMACIST_ACCOUNTS: DevCredential[] = [
  {
    label: "Superintendent",
    username: "pharmacist",
    password: "pharmacare2024",
  },
  {
    label: "Admin pharmacist",
    username: "admin",
    password: "admin123",
  },
];

export function isDevTestCredentialsVisible(): boolean {
  return import.meta.env.DEV;
}
