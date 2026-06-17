import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AdmZip from "adm-zip";
import { db, dmdGtinTable, dmdSyncRunsTable, pool } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  buildGtinRows,
  parseAmppXml,
  parseGtinXml,
  parseVmpXml,
  parseVmppXml,
  type AmppRecord,
  type DmdGtinRow,
} from "./lib/dmd-xml.js";

const TRUD_BASE = "https://isd.digital.nhs.uk";
const CHUNK_SIZE = 500;

type TrudRelease = {
  id: string;
  name?: string;
  archiveFileUrl: string;
  archiveFileSha256?: string;
};

type TrudListResponse = {
  releases?: TrudRelease[];
  httpStatus?: number;
  message?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function fetchLatestRelease(
  apiKey: string,
  itemId: string,
): Promise<TrudRelease> {
  const url = `${TRUD_BASE}/trud/api/v1/keys/${apiKey}/items/${itemId}/releases?latest`;
  const res = await fetch(url);
  const body = (await res.json()) as TrudListResponse;
  if (!res.ok || body.httpStatus !== 200) {
    throw new Error(
      `TRUD list failed (${res.status}): ${body.message ?? "unknown error"}`,
    );
  }
  const release = body.releases?.[0];
  if (!release?.archiveFileUrl) {
    throw new Error("TRUD returned no release archive URL");
  }
  return release;
}

async function downloadArchive(
  url: string,
  expectedSha256?: string,
): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TRUD download failed (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (expectedSha256) {
    const hash = createHash("sha256").update(buffer).digest("hex").toUpperCase();
    if (hash !== expectedSha256.toUpperCase()) {
      throw new Error(
        `SHA256 mismatch: expected ${expectedSha256}, got ${hash}`,
      );
    }
  }
  return buffer;
}

function findZipEntries(zip: AdmZip, pattern: RegExp): string[] {
  return zip
    .getEntries()
    .map((e) => e.entryName)
    .filter((name) => pattern.test(name) && name.toLowerCase().endsWith(".xml"));
}

function readZipText(zip: AdmZip, entryName: string): string {
  const entry = zip.getEntry(entryName);
  if (!entry) throw new Error(`ZIP entry not found: ${entryName}`);
  return entry.getData().toString("utf8");
}

function parseDmdZip(zip: AdmZip): DmdGtinRow[] {
  const gtinFiles = findZipEntries(zip, /f_gtin2_/i);
  const amppFiles = findZipEntries(zip, /f_ampp2_/i);
  const vmpFiles = findZipEntries(zip, /f_vmp2_/i);
  const vmppFiles = findZipEntries(zip, /f_vmpp2_/i);

  if (gtinFiles.length === 0) {
    throw new Error("No f_gtin2_*.xml found in dm+d archive");
  }
  if (amppFiles.length === 0) {
    throw new Error("No f_ampp2_*.xml found in dm+d archive");
  }

  const gtinMappings = parseGtinXml(readZipText(zip, gtinFiles[0]!));

  const amppById = new Map<string, AmppRecord>();
  for (const file of amppFiles) {
    for (const [id, record] of parseAmppXml(readZipText(zip, file))) {
      amppById.set(id, record);
    }
  }

  const vmpNames = new Map<string, string>();
  for (const file of vmpFiles) {
    for (const [id, name] of parseVmpXml(readZipText(zip, file))) {
      vmpNames.set(id, name);
    }
  }

  const vppToVmp = new Map<string, string>();
  for (const file of vmppFiles) {
    for (const [vppid, vpid] of parseVmppXml(readZipText(zip, file))) {
      vppToVmp.set(vppid, vpid);
    }
  }

  return buildGtinRows(gtinMappings, amppById, vppToVmp, vmpNames);
}

async function upsertRows(rows: DmdGtinRow[]): Promise<number> {
  const syncedAt = new Date();
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db
      .insert(dmdGtinTable)
      .values(
        chunk.map((row) => ({
          gtin: row.gtin,
          amppId: row.amppId,
          vmpId: row.vmpId,
          productName: row.productName,
          strength: row.strength,
          form: row.form,
          supplier: row.supplier,
          discontinued: row.discontinued,
          syncedAt,
        })),
      )
      .onConflictDoUpdate({
        target: dmdGtinTable.gtin,
        set: {
          amppId: sql`excluded.ampp_id`,
          vmpId: sql`excluded.vmp_id`,
          productName: sql`excluded.product_name`,
          strength: sql`excluded.strength`,
          form: sql`excluded.form`,
          supplier: sql`excluded.supplier`,
          discontinued: sql`excluded.discontinued`,
          syncedAt: sql`excluded.synced_at`,
        },
      });
    inserted += chunk.length;
    console.log(`Upserted ${inserted}/${rows.length} GTIN rows…`);
  }
  return inserted;
}

async function recordSyncRun(input: {
  id: string;
  releaseId: string;
  releaseName?: string;
  archiveSha256?: string;
  rowCount: number;
  status: string;
  errorMessage?: string;
  finished?: boolean;
}) {
  if (input.finished) {
    await db
      .update(dmdSyncRunsTable)
      .set({
        rowCount: input.rowCount,
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        finishedAt: new Date(),
      })
      .where(sql`${dmdSyncRunsTable.id} = ${input.id}`);
    return;
  }

  await db.insert(dmdSyncRunsTable).values({
    id: input.id,
    releaseId: input.releaseId,
    releaseName: input.releaseName ?? null,
    archiveSha256: input.archiveSha256 ?? null,
    rowCount: 0,
    status: "running",
  });
}

export async function syncDmdFromTrud(): Promise<{
  releaseId: string;
  rowCount: number;
}> {
  const apiKey = requireEnv("TRUD_API_KEY");
  const itemId = process.env.TRUD_DMD_ITEM_ID?.trim() || "24";
  const runId = randomUUID();

  const release = await fetchLatestRelease(apiKey, itemId);
  console.log(`Latest dm+d release: ${release.name ?? release.id}`);

  await recordSyncRun({
    id: runId,
    releaseId: release.id,
    releaseName: release.name,
    archiveSha256: release.archiveFileSha256,
    rowCount: 0,
    status: "running",
  });

  const tempDir = await mkdtemp(join(tmpdir(), "trud-dmd-"));
  try {
    console.log("Downloading archive…");
    const buffer = await downloadArchive(
      release.archiveFileUrl,
      release.archiveFileSha256,
    );
    const zipPath = join(tempDir, release.id);
    await writeFile(zipPath, buffer);

    const zip = new AdmZip(buffer);
    const rows = parseDmdZip(zip);
    console.log(`Parsed ${rows.length} GTIN mappings from dm+d XML`);

    const rowCount = await upsertRows(rows);

    await recordSyncRun({
      id: runId,
      releaseId: release.id,
      rowCount,
      status: "success",
      finished: true,
    });

    return { releaseId: release.id, rowCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordSyncRun({
      id: runId,
      releaseId: release.id,
      rowCount: 0,
      status: "failed",
      errorMessage: message,
      finished: true,
    });
    throw err;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const result = await syncDmdFromTrud();
  console.log(
    `dm+d sync complete — release ${result.releaseId}, ${result.rowCount} GTIN rows`,
  );
  await pool.end();
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  process.argv[1].replace(/\\/g, "/").endsWith("trud-sync-dmd.ts");

if (isDirectRun) {
  main().catch(async (err) => {
    console.error(err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
}
