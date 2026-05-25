const ODS_BASE = "https://directory.spineservices.nhs.uk/ORD/2-0-0";
/** NHS ODS role: prescribing cost centre (GP practices in England & Wales). */
export const GP_PRIMARY_ROLE_ID = "RO177";

export type GpPracticeSummary = {
  odsCode: string;
  name: string;
  postcode: string;
  status: string;
};

export type GpPracticeDetail = GpPracticeSummary & {
  addressLines: string[];
  town: string;
  county: string;
  country: string;
  phone: string | null;
  singleLine: string;
};

type OdsSearchResponse = {
  Organisations?: Array<{
    Name?: string;
    OrgId?: string;
    PostCode?: string;
    Status?: string;
  }>;
};

type OdsOrgLocation = {
  AddrLn1?: string;
  AddrLn2?: string;
  AddrLn3?: string;
  Town?: string;
  County?: string;
  PostCode?: string;
  Country?: string;
};

type OdsOrgDetailResponse = {
  Organisation?: {
    Name?: string;
    OrgId?: { extension?: string };
    Status?: string;
    GeoLoc?: { Location?: OdsOrgLocation | OdsOrgLocation[] };
    Contacts?: {
      Contact?: Array<{ type?: string; value?: string }> | { type?: string; value?: string };
    };
  };
};

function normaliseLocation(
  loc: OdsOrgLocation | OdsOrgLocation[] | undefined,
): OdsOrgLocation | undefined {
  if (!loc) return undefined;
  return Array.isArray(loc) ? loc[0] : loc;
}

export function formatOdsAddress(loc: OdsOrgLocation | undefined): {
  lines: string[];
  town: string;
  county: string;
  postcode: string;
  country: string;
  singleLine: string;
} {
  if (!loc) {
    return { lines: [], town: "", county: "", postcode: "", country: "", singleLine: "" };
  }
  const lines = [loc.AddrLn1, loc.AddrLn2, loc.AddrLn3].filter(
    (x): x is string => Boolean(x?.trim()),
  );
  const town = loc.Town?.trim() ?? "";
  const county = loc.County?.trim() ?? "";
  const postcode = loc.PostCode?.trim() ?? "";
  const country = loc.Country?.trim() ?? "";
  const singleLine = [...lines, town, county, postcode, country]
    .filter(Boolean)
    .join(", ");
  return { lines, town, county, postcode, country, singleLine };
}

function extractPhone(
  contacts: NonNullable<OdsOrgDetailResponse["Organisation"]>["Contacts"],
): string | null {
  const raw = contacts?.Contact;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const tel = list.find((c) => c.type?.toLowerCase() === "tel");
  return tel?.value?.trim() ?? null;
}

function looksLikePostcode(q: string): boolean {
  const compact = q.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{1,2}\d[A-Z\d]?\d?[A-Z]{0,2}$/i.test(compact) && compact.length >= 2;
}

export async function searchGpPractices(opts: {
  q: string;
  limit?: number;
}): Promise<GpPracticeSummary[]> {
  const q = opts.q.trim();
  if (q.length < 2) return [];

  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 50);
  const params = new URLSearchParams({
    Status: "Active",
    PrimaryRoleId: GP_PRIMARY_ROLE_ID,
    Limit: String(limit),
  });

  if (looksLikePostcode(q)) {
    params.set("PostCode", q.replace(/\s+/g, " ").toUpperCase());
  } else {
    params.set("Name", q);
  }

  const res = await fetch(`${ODS_BASE}/organisations?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`NHS ODS search failed (${res.status})`);
  }

  const data = (await res.json()) as OdsSearchResponse;
  return (data.Organisations ?? [])
    .filter((o) => o.OrgId && o.Name)
    .map((o) => ({
      odsCode: o.OrgId!,
      name: o.Name!,
      postcode: o.PostCode?.trim() ?? "",
      status: o.Status ?? "Active",
    }));
}

export async function getGpPracticeByOdsCode(
  odsCode: string,
): Promise<GpPracticeDetail | null> {
  const code = odsCode.trim().toUpperCase();
  if (!code) return null;

  const res = await fetch(`${ODS_BASE}/organisations/${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`NHS ODS lookup failed (${res.status})`);
  }

  const data = (await res.json()) as OdsOrgDetailResponse;
  const org = data.Organisation;
  if (!org?.Name) return null;

  const loc = normaliseLocation(org.GeoLoc?.Location);
  const addr = formatOdsAddress(loc);

  return {
    odsCode: org.OrgId?.extension ?? code,
    name: org.Name,
    postcode: addr.postcode,
    status: org.Status ?? "Active",
    addressLines: addr.lines,
    town: addr.town,
    county: addr.county,
    country: addr.country,
    phone: extractPhone(org.Contacts),
    singleLine: addr.singleLine,
  };
}
