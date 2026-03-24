import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/authMiddleware";
import { createUserClient } from "../lib/supabase";

const router = Router();
router.use(authMiddleware);

router.get("/learner", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "learner") {
    res.status(403).json({ error: "Learner only" });
    return;
  }

  const sb = createUserClient(req.accessToken!);
  const uid = req.user!.id;

  const { data: courses } = await sb.from("courses").select("id,title");
  const { data: lessons } = await sb.from("lessons").select("id,course_id");
  const { data: prog } = await sb.from("progress").select("lesson_id").eq("user_id", uid);

  const completed = new Set((prog ?? []).map((p) => p.lesson_id));
  const lessonsByCourse = new Map<string, string[]>();
  for (const l of lessons ?? []) {
    const arr = lessonsByCourse.get(l.course_id) ?? [];
    arr.push(l.id);
    lessonsByCourse.set(l.course_id, arr);
  }

  const courseSummaries = (courses ?? []).map((c) => {
    const ids = lessonsByCourse.get(c.id) ?? [];
    const total = ids.length;
    const done = ids.filter((lid) => completed.has(lid)).length;
    return {
      courseId: c.id,
      title: c.title,
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const { count: certCount } = await sb
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", uid);

  const { count: appCount } = await sb
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("learner_id", uid);

  const { count: unread } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("is_read", false);

  res.json({
    courseSummaries,
    certificatesCount: certCount ?? 0,
    applicationsCount: appCount ?? 0,
    unreadNotifications: unread ?? 0,
  });
});

router.get("/employer", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "employer") {
    res.status(403).json({ error: "Employer only" });
    return;
  }

  const sb = createUserClient(req.accessToken!);
  const uid = req.user!.id;

  const { data: myJobs } = await sb.from("jobs").select("id").eq("employer_id", uid);
  const jobIds = (myJobs ?? []).map((j) => j.id);

  let totalApplications = 0;
  let pendingApplications = 0;
  if (jobIds.length > 0) {
    const { data: apps } = await sb.from("applications").select("status").in("job_id", jobIds);
    totalApplications = apps?.length ?? 0;
    pendingApplications = (apps ?? []).filter((a) => a.status === "pending").length;
  }

  const { count: unread } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("is_read", false);

  res.json({
    jobsPosted: jobIds.length,
    totalApplications,
    pendingApplications,
    unreadNotifications: unread ?? 0,
  });
});

router.get("/admin", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const sb = createUserClient(req.accessToken!);
  const { data: profiles } = await sb.from("profiles").select("role");

  const list = profiles ?? [];
  const { count: courseCount } = await sb.from("courses").select("*", { count: "exact", head: true });
  const { count: certCount } = await sb.from("certificates").select("*", { count: "exact", head: true });
  const { count: resCount } = await sb.from("resources").select("*", { count: "exact", head: true });
  const { count: jobCount } = await sb.from("jobs").select("*", { count: "exact", head: true });

  res.json({
    totalUsers: list.length,
    learners: list.filter((p) => p.role === "learner").length,
    employers: list.filter((p) => p.role === "employer").length,
    admins: list.filter((p) => p.role === "admin").length,
    courses: courseCount ?? 0,
    certificatesIssued: certCount ?? 0,
    resources: resCount ?? 0,
    jobs: jobCount ?? 0,
  });
});

export default router;
