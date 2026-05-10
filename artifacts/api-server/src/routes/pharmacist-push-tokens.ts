import { Router, type IRouter, type Response } from "express";
import { Expo } from "expo-server-sdk";
import { db, pharmacistPushTokensTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";
import { deletePushToken } from "../lib/expo-push";

const router: IRouter = Router();

// POST /api/pharmacist/push-tokens — register / refresh an Expo push token
router.post(
  "/pharmacist/push-tokens",
  requirePharmacist,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const { expoPushToken, platform } = (req.body ?? {}) as {
      expoPushToken?: string;
      platform?: string;
    };
    const actor = req.authActor!;
    if (!expoPushToken || typeof expoPushToken !== "string") {
      res.status(400).json({ error: "expoPushToken is required" });
      return;
    }
    if (!Expo.isExpoPushToken(expoPushToken)) {
      res.status(400).json({ error: "expoPushToken is not a valid Expo push token" });
      return;
    }

    await db
      .insert(pharmacistPushTokensTable)
      .values({
        expoPushToken,
        pharmacistId: actor.id,
        pharmacistName: actor.name,
        platform: platform ?? null,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pharmacistPushTokensTable.expoPushToken,
        set: {
          pharmacistId: actor.id,
          pharmacistName: actor.name,
          platform: platform ?? null,
          lastSeenAt: new Date(),
        },
      });

    res.status(204).end();
  },
);

// DELETE /api/pharmacist/push-tokens/:token — unregister on sign-out
router.delete(
  "/pharmacist/push-tokens/:token",
  requirePharmacist,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const token = String(req.params["token"] ?? "");
    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }
    // Only let pharmacist unregister tokens belonging to them.
    await db
      .delete(pharmacistPushTokensTable)
      .where(
        sql`${pharmacistPushTokensTable.expoPushToken} = ${token} AND ${pharmacistPushTokensTable.pharmacistId} = ${req.authActor!.id}`,
      );
    res.status(204).end();
  },
);

export { deletePushToken };
export default router;
