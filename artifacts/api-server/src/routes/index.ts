import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conditionsRouter from "./conditions";
import consultationsRouter from "./consultations";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import patientRouter from "./patient";
import patientNotesRouter from "./patient-notes";
import complianceRouter from "./compliance";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(conditionsRouter);
router.use(consultationsRouter);
router.use(dashboardRouter);
router.use(patientRouter);
router.use(patientNotesRouter);
router.use(complianceRouter);

export default router;
