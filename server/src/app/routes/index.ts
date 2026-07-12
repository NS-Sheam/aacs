import { Router } from "express";
import { assignmentsRoutes } from "../modules/assignment/assignments.routes";
import { resultsRoutes } from "../modules/result/results.routes";
import { reviewQueueRoutes } from "../modules/reviewQueue/reviewQueue.routes";
import { submissionsRoutes } from "../modules/submission/submissions.routes";

const router = Router();

const apiRoutes = [
  // example: { path: "/example", route: exampleRouter },
  { path: "/assignments", route: assignmentsRoutes },
  { path: "/results", route: resultsRoutes },
  { path: "/review-queue", route: reviewQueueRoutes },
  { path: "/submissions", route: submissionsRoutes },
] as Record<string, any>[];

apiRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
