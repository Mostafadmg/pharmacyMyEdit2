import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conditionsRouter from "./conditions";
import consultationsRouter from "./consultations";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conditionsRouter);
router.use(consultationsRouter);
router.use(dashboardRouter);

export default router;
