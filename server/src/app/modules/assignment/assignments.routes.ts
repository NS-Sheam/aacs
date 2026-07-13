import { Request, Response, Router } from "express";
const router = Router();

// POST /api/v1/assignments — Nasib builds full logic Day 2
router.post("/", async (req: Request, res: Response) => {
  res.json({ message: "POST /api/assignments — coming Day 2" });
});

// GET /api/v1/assignments
router.get("/", async (req: Request, res: Response) => {
  res.json({ message: "GET /api/assignments — coming Day 2" });
});

// GET /api/assignments/:id
router.get("/:id", async (req: Request, res: Response) => {
  res.json({ message: `GET /api/assignments/${req.params.id} — coming Day 2` });
});

export const assignmentsRoutes = router;
