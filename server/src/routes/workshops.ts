import { Router } from "express";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/workshops?select=*&order=date`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      }
    );
    const data = await r.json();
    if (!r.ok) { res.status(500).json({ error: JSON.stringify(data) }); return; }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed" });
  }
});

export default router;
