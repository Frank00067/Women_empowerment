import { Router } from "express";
import {
  authMiddleware,
  requireRoles,
  type AuthedRequest,
} from "../middleware/authMiddleware";
import { createUserClient } from "../lib/supabase";

const router = Router();

router.post("/", authMiddleware, requireRoles("learner"), async (req: AuthedRequest, res) => {
  const { jobId, coverLetter } = req.body as { jobId?: string; coverLetter?: string };
  if (!jobId) {
    res.status(400).json({ error: "jobId required" });
    return;
  }

  const sb = createUserClient(req.accessToken!);
  const { data: job, error: jErr } = await sb.from("jobs").select("id,title").eq("id", jobId).maybeSingle();

  if (jErr || !job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const { data: created, error } = await sb
    .from("applications")
    .insert({
      job_id: jobId,
      learner_id: req.user!.id,
      cover_letter: coverLetter ?? "",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      res.status(400).json({ error: "Already applied" });
      return;
    }
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({
    id: created.id,
    jobId: created.job_id,
    learnerId: created.learner_id,
    coverLetter: created.cover_letter,
    status: created.status,
    createdAt: created.created_at,
  });
});

router.get("/mine", authMiddleware, requireRoles("learner"), async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const { data: apps, error } = await sb
    .from("applications")
    .select("*")
    .eq("learner_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const jobIds = [...new Set((apps ?? []).map((a) => a.job_id))];
  const { data: jobs } =
    jobIds.length > 0
      ? await sb.from("jobs").select("id,title").in("id", jobIds)
      : { data: [] as { id: string; title: string }[] };

  const titleByJob = new Map((jobs ?? []).map((j) => [j.id, j.title]));

  res.json(
    (apps ?? []).map((a) => ({
      id: a.id,
      jobId: a.job_id,
      learnerId: a.learner_id,
      coverLetter: a.cover_letter,
      status: a.status,
      createdAt: a.created_at,
      jobTitle: titleByJob.get(a.job_id),
    }))
  );
});

router.get(
  "/for-job/:jobId",
  authMiddleware,
  requireRoles("employer"),
  async (req: AuthedRequest, res) => {
    const sb = createUserClient(req.accessToken!);
    const { data: job, error: jErr } = await sb
      .from("jobs")
      .select("id")
      .eq("id", req.params.jobId)
      .eq("employer_id", req.user!.id)
      .maybeSingle();

    if (jErr || !job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const { data: apps, error } = await sb
      .from("applications")
      .select("*")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const learnerIds = [...new Set((apps ?? []).map((a) => a.learner_id))];
    const { data: profiles } =
      learnerIds.length > 0
        ? await sb.from("profiles").select("id,full_name,email").in("id", learnerIds)
        : { data: [] as { id: string; full_name: string; email: string }[] };

    const profById = new Map((profiles ?? []).map((p) => [p.id, p]));

    res.json(
      (apps ?? []).map((a) => {
        const p = profById.get(a.learner_id);
        return {
          id: a.id,
          jobId: a.job_id,
          learnerId: a.learner_id,
          coverLetter: a.cover_letter,
          status: a.status,
          createdAt: a.created_at,
          learnerName: p?.full_name,
          learnerEmail: p?.email,
        };
      })
    );
  }
);

router.patch(
  "/:id/status",
  authMiddleware,
  requireRoles("employer"),
  async (req: AuthedRequest, res) => {
    const { status } = req.body as { status?: string };
    const allowed = ["pending", "reviewed", "shortlisted", "rejected"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: "valid status required" });
      return;
    }

    const sb = createUserClient(req.accessToken!);
    const { data: app, error: fErr } = await sb.from("applications").select("*").eq("id", req.params.id).maybeSingle();

    if (fErr || !app) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const { data: job } = await sb
      .from("jobs")
      .select("employer_id,title")
      .eq("id", app.job_id)
      .maybeSingle();

    if (!job || job.employer_id !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { data: updated, error } = await sb
      .from("applications")
      .update({ status })
      .eq("id", app.id)
      .select("*")
      .single();

    if (error || !updated) {
      res.status(400).json({ error: error?.message ?? "Update failed" });
      return;
    }

    res.json({
      id: updated.id,
      jobId: updated.job_id,
      learnerId: updated.learner_id,
      coverLetter: updated.cover_letter,
      status: updated.status,
      createdAt: updated.created_at,
    });
  }
);

export default router;
