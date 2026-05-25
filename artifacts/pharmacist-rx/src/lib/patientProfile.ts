import type { Consultation } from "@workspace/api-client-react";
import { formatPatientDob } from "@/lib/orderPatientUi";

export type PatientProfileState = {
  firstName: string;
  middleName: string;
  surname: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
  gpDoctorName: string;
  gpSurgery: string;
  gpAddress: string;
  gpOdsCode: string;
};

export const DOB_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function profileFromConsultation(c: Consultation): PatientProfileState {
  const nameParts = (c.patientName || "").trim().split(/\s+/).filter(Boolean);
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const dobYear = c.patientAge
    ? String(new Date().getFullYear() - c.patientAge)
    : "";
  const deliveryParts = (c.deliveryAddress ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  return {
    firstName: nameParts[0] ?? "",
    middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "",
    surname: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
    dobDay: "",
    dobMonth: "",
    dobYear,
    phone: "",
    email: c.patientEmail ?? "",
    addressLine1: c.deliveryAddressLine1 ?? deliveryParts[0] ?? "",
    addressLine2: c.deliveryAddressLine2 ?? deliveryParts[1] ?? "",
    city: c.deliveryCity ?? deliveryParts[2] ?? "",
    county: deliveryParts[3] ?? "",
    postcode: c.deliveryPostcode ?? deliveryParts[4] ?? "",
    gpDoctorName:
      c.gpName ??
      (typeof answers.gp_name === "string" ? answers.gp_name : "") ??
      "",
    gpSurgery: c.gpSurgery ?? "",
    gpAddress:
      c.gpAddress ??
      (typeof answers.gp_address === "string" ? answers.gp_address : "") ??
      "",
    gpOdsCode: "",
  };
}

export function fmtName(p: PatientProfileState): string {
  return [p.firstName, p.middleName, p.surname].filter(Boolean).join(" ") || "—";
}

export function dobPartsToIso(
  day: string,
  month: string,
  year: string,
): string {
  if (!day || !month || !year) return "";
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y) return "";
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return "";
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isoToDobParts(iso: string): {
  dobDay: string;
  dobMonth: string;
  dobYear: string;
} {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { dobDay: "", dobMonth: "", dobYear: "" };
  return {
    dobYear: match[1],
    dobMonth: String(Number(match[2])),
    dobDay: String(Number(match[3])),
  };
}

export function fmtDob(p: PatientProfileState, patientAge?: number | null): string {
  return formatPatientDob({
    dobDay: p.dobDay,
    dobMonth: p.dobMonth,
    dobYear: p.dobYear,
    patientAge,
  });
}

export function fmtAddress(p: PatientProfileState): string {
  return (
    [p.addressLine1, p.addressLine2, p.city, p.county, p.postcode]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

export function fmtGp(p: PatientProfileState): string {
  const parts = [
    p.gpDoctorName && `Dr / GP: ${p.gpDoctorName}`,
    p.gpSurgery,
    p.gpAddress,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function deliveryAddressFromProfile(p: PatientProfileState): string {
  return [p.addressLine1, p.addressLine2, p.city, p.county, p.postcode]
    .filter(Boolean)
    .join(", ");
}

export const PROFILE_FIELD_META: {
  key: keyof PatientProfileState;
  label: string;
}[] = [
  { key: "firstName", label: "First name" },
  { key: "middleName", label: "Middle name" },
  { key: "surname", label: "Surname" },
  { key: "dobDay", label: "DOB day" },
  { key: "dobMonth", label: "DOB month" },
  { key: "dobYear", label: "DOB year" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "addressLine1", label: "Address line 1" },
  { key: "addressLine2", label: "Address line 2" },
  { key: "city", label: "City" },
  { key: "county", label: "County" },
  { key: "postcode", label: "Postcode" },
  { key: "gpDoctorName", label: "GP doctor name" },
  { key: "gpSurgery", label: "GP surgery" },
  { key: "gpAddress", label: "GP address" },
  { key: "gpOdsCode", label: "GP ODS code" },
];
