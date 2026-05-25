import { db, consultationsTable, pool } from "@workspace/db";
import { sql, ilike } from "drizzle-orm";

const demos = await db
  .select({
    id: consultationsTable.id,
    status: consultationsTable.status,
    prev: consultationsTable.previousConsultationId,
  })
  .from(consultationsTable)
  .where(ilike(consultationsTable.id, "demo-%"));

const mains = demos.filter((d) => !d.id.endsWith("-prior"));
const priors = demos.filter((d) => d.id.endsWith("-prior"));
const newStart = mains.filter((d) => !d.prev);
const withPrev = mains.filter((d) => d.prev);
const transfer = withPrev.filter(
  (d) =>
    d.status === "more_info_needed" || d.status === "patient_responded",
);
const repeat = withPrev.filter((d) => !transfer.includes(d));

console.log(
  JSON.stringify(
    {
      main: mains.length,
      prior: priors.length,
      newStart: newStart.length,
      transfer: transfer.length,
      simpleRepeat: repeat.length,
    },
    null,
    2,
  ),
);

const doses = await db.execute<{ dose: string | null; n: number }>(sql`
  select answers->>'current_dose' as dose, count(*)::int as n
  from consultations
  where id like 'demo-%' and id not like '%-prior'
  group by 1
  order by 1
`);
console.log("doses", doses.rows);

await pool.end();
