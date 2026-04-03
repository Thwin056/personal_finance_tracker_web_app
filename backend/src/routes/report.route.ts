import { Router } from "express";
import {
    generateReportController,
    getAllReportsController,
    resendReportEmailController,
    updateReportSettingController,
} from "../controllers/report.controller";

const reportRoutes = Router();

reportRoutes.get("/all", getAllReportsController);
reportRoutes.get("/generate", generateReportController);
reportRoutes.post("/resend/:id", resendReportEmailController);
reportRoutes.put("/update-setting", updateReportSettingController);

export default reportRoutes;
