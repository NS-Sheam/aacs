import { Router } from "express";
import app from "../../app";

const router = Router();

const apiRoutes = [
  // example: { path: "/example", route: exampleRouter },
] as Record<string, any>[];

apiRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
