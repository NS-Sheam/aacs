import { Router } from "express";
import { ReviewQueueController } from "./reviewQueue.controller";

const router = Router();

router.get("/", ReviewQueueController.getPending);
router.patch("/:itemId", ReviewQueueController.resolve);

export const reviewQueueRoutes = router;
