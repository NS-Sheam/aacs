import { Router } from "express";
import { assignmentsRoutes } from "../modules/assignment/assignments.routes";
import { resultsRoutes } from "../modules/result/results.routes";
import { reviewQueueRoutes } from "../modules/reviewQueue/reviewQueue.routes";
import { SubmissionsRoutes } from "../modules/submission/submissions.routes";
import { registerSseClient, unregisterSseClient } from "../helpers/sse";

const router = Router();

// SSE Real-Time events endpoint
router.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const clientId = Date.now().toString();
  registerSseClient(clientId, res);

  req.on("close", () => {
    unregisterSseClient(clientId);
  });
});

const apiRoutes = [
  // example: { path: "/example", route: exampleRouter },
  { path: "/assignments", route: assignmentsRoutes },
  { path: "/results", route: resultsRoutes },
  { path: "/review-queue", route: reviewQueueRoutes },
  { path: "/submissions", route: SubmissionsRoutes },
] as Record<string, any>[];

apiRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
