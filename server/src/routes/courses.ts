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
  const { data: courses, error } = await anon()
    .from("courses")
    .select("id,title,description,category,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const ids = (courses ?? []).map((c) => c.id);
  const byCourse = new Map<string, number>();
  if (ids.length > 0) {
    const { data: counts } = await anon().from("lessons").select("course_id").in("course_id", ids);
    for (const row of counts ?? []) {
      const id = row.course_id as string;
      byCourse.set(id, (byCourse.get(id) ?? 0) + 1);
    }
  }

  res.json(
    (courses ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      lessonCount: byCourse.get(c.id) ?? 0,
      createdAt: c.created_at,
    }))
  );
});

router.get("/:id/progress", authMiddleware, async (req: AuthedRequest, res) => {
  const sb = createUserClient(req.accessToken!);
  const courseId = req.params.id;

  const { data: lessons, error: lErr } = await sb
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);

  if (lErr) {
    res.status(500).json({ error: lErr.message });
    return;
  }
  if (!lessons?.length) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const lessonIds = lessons.map((l) => l.id);
  const { data: prog } = await sb
    .from("progress")
    .select("lesson_id")
    .eq("user_id", req.user!.id)
    .in("lesson_id", lessonIds);

  res.json({
    completedLessonIds: (prog ?? []).map((p) => p.lesson_id),
    total: lessonIds.length,
  });
});

router.get("/:id", async (req, res) => {
  const { data: course, error: cErr } = await anon()
    .from("courses")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (cErr) {
    res.status(500).json({ error: cErr.message });
    return;
  }
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const { data: lessons, error: lErr } = await anon()
    .from("lessons")
    .select("*")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  if (lErr) {
    res.status(500).json({ error: lErr.message });
    return;
  }

  res.json({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    createdAt: course.created_at,
    lessonIds: (lessons ?? []).map((l) => l.id),
    lessons: (lessons ?? []).map((l) => ({
      id: l.id,
      courseId: l.course_id,
      title: l.title,
      content: l.content,
      order: l.sort_order,
    })),
  });
});

router.post(
  "/:courseId/lessons/:lessonId/complete",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    if (req.user!.role !== "learner") {
      res.status(403).json({ error: "Only learners track progress" });
      return;
    }

    const sb = createUserClient(req.accessToken!);
    const { courseId, lessonId } = req.params;

    const { data: lesson } = await sb
      .from("lessons")
      .select("id,course_id")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!lesson) {
      res.status(404).json({ error: "Lesson not found in course" });
      return;
    }

    const { error } = await sb.from("progress").insert({
      user_id: req.user!.id,
      lesson_id: lessonId,
    });

    if (error) {
      if (error.code === "23505") {
        res.json({ ok: true });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ ok: true });
  }
);

router.post(
  "/",
  authMiddleware,
  requireRoles("admin"),
  async (req: AuthedRequest, res) => {
    const { title, description, category, lessons } = req.body as {
      title?: string;
      description?: string;
      category?: string;
      lessons?: { title: string; content: string }[];
    };
    if (!title || !description || !category || !lessons?.length) {
      res.status(400).json({ error: "title, description, category, lessons[] required" });
      return;
    }

    const sb = createUserClient(req.accessToken!);
    const { data: course, error: cErr } = await sb
      .from("courses")
      .insert({ title, description, category })
      .select("*")
      .single();

    if (cErr || !course) {
      res.status(400).json({ error: cErr?.message ?? "Failed to create course" });
      return;
    }

    const rows = lessons.map((l, order) => ({
      course_id: course.id,
      title: l.title,
      content: l.content,
      sort_order: order,
    }));

    const { data: inserted, error: lErr } = await sb.from("lessons").insert(rows).select("*");

    if (lErr) {
      await sb.from("courses").delete().eq("id", course.id);
      res.status(400).json({ error: lErr.message });
      return;
    }

    res.status(201).json({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      createdAt: course.created_at,
      lessonIds: (inserted ?? []).map((l) => l.id),
      lessons: (inserted ?? []).map((l) => ({
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        content: l.content,
        order: l.sort_order,
      })),
    });
  }
);

router.put(
  "/:id",
  authMiddleware,
  requireRoles("admin"),
  async (req: AuthedRequest, res) => {
    const sb = createUserClient(req.accessToken!);
    const body = req.body as { title?: string; description?: string; category?: string };
    const { data: course, error } = await sb
      .from("courses")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
      })
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (!course) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const { data: lessons } = await sb
      .from("lessons")
      .select("*")
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true });

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      createdAt: course.created_at,
      lessonIds: (lessons ?? []).map((l) => l.id),
      lessons: (lessons ?? []).map((l) => ({
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        content: l.content,
        order: l.sort_order,
      })),
    });
  }
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles("admin"),
  async (req: AuthedRequest, res) => {
    const sb = createUserClient(req.accessToken!);
    const { error } = await sb.from("courses").delete().eq("id", req.params.id);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(204).send();
  }
);

export default router;
