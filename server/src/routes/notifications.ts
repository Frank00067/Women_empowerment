import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/authMiddleware";
import { createUserClient } from "../lib/supabase";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(
    (data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      message: n.message,
      read: n.is_read,
      meta: n.meta as Record<string, string> | undefined,
      createdAt: n.created_at,
    }))
  );
});

router.patch("/:id/read", async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const { data: n, error } = await sb
    .from("notifications")
    .update({ is_read: true })
    .eq("id", req.params.id)
    .eq("user_id", req.user!.id)
    .select("*")
    .maybeSingle();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (!n) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    id: n.id,
    kind: n.kind,
    title: n.title,
    message: n.message,
    read: n.is_read,
    meta: n.meta,
    createdAt: n.created_at,
  });
});

router.post("/read-all", async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const { error } = await sb
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", req.user!.id)
    .eq("is_read", false);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

export default router;
