import { Router } from "express";
import type { CvData } from "../models";
import { authMiddleware, type AuthedRequest } from "../middleware/authMiddleware";
import { createUserClient } from "../lib/supabase";

const router = Router();
router.use(authMiddleware);

function mapProfileRow(row: {
  id: string;
  headline: string;
  bio: string;
  phone: string;
  location: string;
  skills: unknown;
  cv_data: unknown;
  updated_at: string;
}) {
  const skills = Array.isArray(row.skills) ? (row.skills as string[]) : [];
  return {
    userId: row.id,
    headline: row.headline,
    bio: row.bio,
    phone: row.phone,
    location: row.location,
    skills,
    cvData: row.cv_data as CvData | null,
    updatedAt: row.updated_at,
  };
}

router.get("/", async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const { data: row, error } = await sb
    .from("profiles")
    .select("id,headline,bio,phone,location,skills,cv_data,updated_at")
    .eq("id", req.user!.id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!row) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(mapProfileRow(row));
});

router.patch("/", async (req: AuthedRequest, res) => {
  const body = req.body as Partial<{
    headline: string;
    bio: string;
    phone: string;
    location: string;
    skills: string[];
  }>;

  const sb = createUserClient(req.accessToken!);
  const patch: Record<string, unknown> = {};
  if (body.headline !== undefined) patch.headline = body.headline;
  if (body.bio !== undefined) patch.bio = body.bio;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.location !== undefined) patch.location = body.location;
  if (body.skills !== undefined) patch.skills = body.skills;

  const { data: row, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", req.user!.id)
    .select("id,headline,bio,phone,location,skills,cv_data,updated_at")
    .single();

  if (error || !row) {
    res.status(400).json({ error: error?.message ?? "Update failed" });
    return;
  }
  res.json(mapProfileRow(row));
});

router.get("/cv", async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const { data: row, error } = await sb.from("profiles").select("cv_data").eq("id", req.user!.id).maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(row?.cv_data ?? {});
});

router.put("/cv", async (req: AuthedRequest, res) => {
  const body = req.body as CvData;
  const cvData: CvData = {
    fullName: body.fullName ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    location: body.location ?? "",
    summary: body.summary ?? "",
    skills: body.skills ?? "",
    experience: body.experience ?? "",
    education: body.education ?? "",
  };

  const sb = createUserClient(req.accessToken!);
  const { error } = await sb.from("profiles").update({ cv_data: cvData }).eq("id", req.user!.id);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json(cvData);
});

export default router;
