import { Router } from "express";
import { assignmentsRoutes } from "../modules/assignment/assignments.routes";
import { auditLogRoutes } from "../modules/auditLog/auditLog.routes";
import { resultsRoutes } from "../modules/result/results.routes";
import { reviewQueueRoutes } from "../modules/reviewQueue/reviewQueue.routes";
import { SubmissionsRoutes } from "../modules/submission/submissions.routes";

const router = Router();

const apiRoutes = [
  // example: { path: "/example", route: exampleRouter },
  { path: "/assignments", route: assignmentsRoutes },
  { path: "/audit", route: auditLogRoutes },
  { path: "/results", route: resultsRoutes },
  { path: "/review-queue", route: reviewQueueRoutes },
  { path: "/submissions", route: SubmissionsRoutes },
] as Record<string, any>[];

apiRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
