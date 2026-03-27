import { Router } from "express";
import { createAnonClient } from "../lib/supabase";

const router = Router();

// GET /api/workshops — public list
router.get("/", async (_req, res) => {
  const sb = createAnonClient();
  const { data, error } = await sb.from("workshops").select("*").order("date");
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data ?? []);
});

export default router;
