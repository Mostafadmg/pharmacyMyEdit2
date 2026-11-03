/**
 * Ensures the fictional test patient portal login exists (dev / local testing).
 *
 *   pnpm --filter @workspace/scripts run ensure-mostafa-patient
 */
import { db, pool, patientAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const EMAIL = "test.patient.one@example.com";
const NAME = "Test Patient One";
const PASSWORD = "test123";

async function main() {
  const email = EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const [existing] = await db
    .select({ id: patientAccountsTable.id })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.email, email));

  if (existing) {
    await db
      .update(patientAccountsTable)
      .set({
        name: NAME,
        passwordHash,
        dateOfBirth: "1990-01-01",
        sex: "male",
        phone: "07700900123",
        addressLine1: "1 Test Street",
        city: "Testville",
        postcode: "ZZ99 3AA",
      })
      .where(eq(patientAccountsTable.email, email));
    console.log(`Updated patient login: ${email}`);
  } else {
    await db.insert(patientAccountsTable).values({
      id: "patient-test-one",
      pmrNumber: "PMR-00001",
      name: NAME,
      email,
      passwordHash,
      dateOfBirth: "1990-01-01",
      sex: "male",
      phone: "07700900123",
      addressLine1: "1 Test Street",
      city: "Testville",
      postcode: "ZZ99 3AA",
    });
    console.log(`Created patient login: ${email}`);
  }

  console.log(`Password: ${PASSWORD}`);
  console.log("Sign in at /my-account/login or use the header profile icon.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
