import { Router } from "express";
import { createServiceClient } from "../lib/supabase";

const router = Router();

// GET /api/mentors — public list
router.get("/", async (_req, res) => {
  const sb = createServiceClient();
  const { data, error } = await sb.from("mentors").select("*").order("name");
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data ?? []);
});

export default router;
