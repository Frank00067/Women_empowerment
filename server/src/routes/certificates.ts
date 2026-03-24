import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/authMiddleware";
import { createUserClient } from "../lib/supabase";

const router = Router();

router.get("/mine", authMiddleware, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "learner") {
    res.status(403).json({ error: "Only learners have course certificates" });
    return;
  }

  const sb = createUserClient(req.accessToken!);
  const { data: certs, error } = await sb
    .from("certificates")
    .select("*")
    .eq("user_id", req.user!.id)
    .order("issued_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const courseIds = [...new Set((certs ?? []).map((c) => c.course_id))];
  const { data: courses } =
    courseIds.length > 0
      ? await sb.from("courses").select("id,title").in("id", courseIds)
      : { data: [] as { id: string; title: string }[] };

  const titleByCourse = new Map((courses ?? []).map((c) => [c.id, c.title]));

  res.json(
    (certs ?? []).map((c) => ({
      id: c.id,
      userId: c.user_id,
      courseId: c.course_id,
      issuedAt: c.issued_at,
      courseTitle: titleByCourse.get(c.course_id) ?? "Course",
    }))
  );
});

router.get("/", authMiddleware, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const sb = createUserClient(req.accessToken!);
  const { data: certs, error } = await sb.from("certificates").select("*").order("issued_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const courseIds = [...new Set((certs ?? []).map((c) => c.course_id))];
  const userIds = [...new Set((certs ?? []).map((c) => c.user_id))];

  const { data: courses } =
    courseIds.length > 0
      ? await sb.from("courses").select("id,title").in("id", courseIds)
      : { data: [] as { id: string; title: string }[] };

  const { data: profiles } =
    userIds.length > 0
      ? await sb.from("profiles").select("id,full_name,email").in("id", userIds)
      : { data: [] as { id: string; full_name: string; email: string }[] };

  const titleByCourse = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const profById = new Map((profiles ?? []).map((p) => [p.id, p]));

  res.json(
    (certs ?? []).map((c) => {
      const p = profById.get(c.user_id);
      return {
        id: c.id,
        userId: c.user_id,
        courseId: c.course_id,
        issuedAt: c.issued_at,
        courseTitle: titleByCourse.get(c.course_id),
        userName: p?.full_name,
        userEmail: p?.email,
      };
    })
  );
});

export default router;
