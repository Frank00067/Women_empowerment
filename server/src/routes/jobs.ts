import { Router } from "express";
import {
  authMiddleware,
  requireRoles,
  type AuthedRequest,
} from "../middleware/authMiddleware";
import { createAnonClient, createUserClient } from "../lib/supabase";

const router = Router();
const anon = () => createAnonClient();

router.get("/", async (_req, res) => {
  const { data: jobs, error } = await anon()
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(
    (jobs ?? []).map((j) => ({
      id: j.id,
      employerId: j.employer_id,
      title: j.title,
      description: j.description,
      location: j.location,
      salary: j.salary,
      createdAt: j.created_at,
      employerName: j.employer_display_name || "Employer",
    }))
  );
});

router.get("/mine", authMiddleware, requireRoles("employer"), async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .eq("employer_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(
    (data ?? []).map((j) => ({
      id: j.id,
      employerId: j.employer_id,
      title: j.title,
      description: j.description,
      location: j.location,
      salary: j.salary,
      createdAt: j.created_at,
    }))
  );
});

router.post(
  "/",
  authMiddleware,
  requireRoles("employer"),
  async (req: AuthedRequest, res) => {
    const { title, description, location, salary } = req.body as {
      title?: string;
      description?: string;
      location?: string;
      salary?: string;
    };
    if (!title || !description) {
      res.status(400).json({ error: "title and description required" });
      return;
    }

    const sb = createUserClient(req.accessToken!);
    const { data: job, error } = await sb
      .from("jobs")
      .insert({
        employer_id: req.user!.id,
        title,
        description,
        location: location ?? "",
        salary: salary ?? "",
      })
      .select("*")
      .single();

    if (error || !job) {
      res.status(400).json({ error: error?.message ?? "Failed to create job" });
      return;
    }

    res.status(201).json({
      id: job.id,
      employerId: job.employer_id,
      title: job.title,
      description: job.description,
      location: job.location,
      salary: job.salary,
      createdAt: job.created_at,
    });
  }
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles("employer"),
  async (req: AuthedRequest, res) => {
    const sb = createUserClient(req.accessToken!);
    const { data: existing, error: qErr } = await sb
      .from("jobs")
      .select("id")
      .eq("id", req.params.id)
      .eq("employer_id", req.user!.id)
      .maybeSingle();

    if (qErr) {
      res.status(400).json({ error: qErr.message });
      return;
    }
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const { error } = await sb.from("jobs").delete().eq("id", req.params.id);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(204).send();
  }
);

export default router;
