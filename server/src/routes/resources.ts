import { Router } from "express";
import type { ResourceType } from "../models";
import {
  authMiddleware,
  requireRoles,
  type AuthedRequest,
} from "../middleware/authMiddleware";
import { createAnonClient, createUserClient } from "../lib/supabase";

const router = Router();
const anon = () => createAnonClient();

router.get("/", async (_req, res) => {
  const { data, error } = await anon()
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(
    (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type as ResourceType,
      url: r.url,
      description: r.description,
      createdAt: r.created_at,
    }))
  );
});

router.post(
  "/",
  authMiddleware,
  requireRoles("admin"),
  async (req: AuthedRequest, res) => {
    const { title, type, url, description } = req.body as {
      title?: string;
      type?: string;
      url?: string;
      description?: string;
    };
    if (!title || !type || !url) {
      res.status(400).json({ error: "title, type, url required" });
      return;
    }
    const t = type as ResourceType;
    if (!["pdf", "link", "video"].includes(t)) {
      res.status(400).json({ error: "type must be pdf, link, or video" });
      return;
    }

    const sb = createUserClient(req.accessToken!);
    const { data: r, error } = await sb
      .from("resources")
      .insert({ title, type: t, url, description: description ?? "" })
      .select("*")
      .single();

    if (error || !r) {
      res.status(400).json({ error: error?.message ?? "Failed" });
      return;
    }

    res.status(201).json({
      id: r.id,
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
      createdAt: r.created_at,
    });
  }
);

router.put(
  "/:id",
  authMiddleware,
  requireRoles("admin"),
  async (req: AuthedRequest, res) => {
    const sb = createUserClient(req.accessToken!);
    const body = req.body as Partial<{
      title: string;
      type: ResourceType;
      url: string;
      description: string;
    }>;

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.url !== undefined) patch.url = body.url;
    if (body.description !== undefined) patch.description = body.description;
    if (body.type !== undefined && ["pdf", "link", "video"].includes(body.type)) {
      patch.type = body.type;
    }

    const { data: r, error } = await sb
      .from("resources")
      .update(patch)
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (!r) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({
      id: r.id,
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
      createdAt: r.created_at,
    });
  }
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles("admin"),
  async (req: AuthedRequest, res) => {
    const sb = createUserClient(req.accessToken!);
    const { data: existing } = await sb.from("resources").select("id").eq("id", req.params.id).maybeSingle();
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { error } = await sb.from("resources").delete().eq("id", req.params.id);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(204).send();
  }
);

export default router;
