import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conditionsRouter from "./conditions";
import consultationsRouter from "./consultations";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(conditionsRouter);
router.use(consultationsRouter);
router.use(dashboardRouter);

export default router;
