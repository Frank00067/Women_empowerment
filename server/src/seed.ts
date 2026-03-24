import "dotenv/config";
import { createServiceClient } from "./lib/supabase";

const courseSpecs: {
  title: string;
  description: string;
  category: string;
  lessons: { title: string; content: string }[];
}[] = [
  {
    title: "Microsoft Word Essentials",
    description: "Create professional documents, styles, and tables for the workplace.",
    category: "Microsoft Word",
    lessons: [
      {
        title: "Interface & navigation",
        content: "Learn the ribbon, quick access toolbar, and document views.",
      },
      {
        title: "Formatting text & paragraphs",
        content: "Fonts, spacing, bullets, and styles for consistent documents.",
      },
      {
        title: "Tables & layout",
        content: "Insert tables, merge cells, and control page layout.",
      },
    ],
  },
  {
    title: "Excel for Beginners",
    description: "Spreadsheets, formulas, and simple charts for data tasks.",
    category: "Microsoft Excel",
    lessons: [
      {
        title: "Cells, rows, and columns",
        content: "Enter data, resize columns, and freeze panes.",
      },
      {
        title: "Formulas & functions",
        content: "SUM, AVERAGE, and basic calculations.",
      },
      {
        title: "Charts & printing",
        content: "Visualize data and prepare print-ready sheets.",
      },
    ],
  },
  {
    title: "Digital Literacy Fundamentals",
    description: "Safe browsing, email professionalism, and file organization.",
    category: "Digital Skills",
    lessons: [
      {
        title: "Online safety",
        content: "Passwords, phishing awareness, and privacy basics.",
      },
      {
        title: "Email etiquette",
        content: "Subject lines, tone, and attachments best practices.",
      },
      {
        title: "Cloud & files",
        content: "Folders, naming conventions, and sharing links responsibly.",
      },
    ],
  },
];

async function ensureAdmin(
  email: string,
  password: string
): Promise<void> {
  const service = createServiceClient();
  const { data: list } = await service.auth.admin.listUsers({ perPage: 200 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrator" },
    });
    if (error) throw error;
    user = data.user!;
  }

  const { error: pErr } = await service
    .from("profiles")
    .update({ role: "admin", full_name: "Administrator" })
    .eq("id", user.id);

  if (pErr) throw pErr;
  console.log("Admin ready:", email);
}

async function seedContent(): Promise<void> {
  const service = createServiceClient();
  const { count } = await service.from("courses").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    console.log("Courses already present, skipping demo courses");
    return;
  }

  for (const spec of courseSpecs) {
    const { data: course, error: cErr } = await service
      .from("courses")
      .insert({
        title: spec.title,
        description: spec.description,
        category: spec.category,
      })
      .select("id")
      .single();

    if (cErr || !course) throw cErr ?? new Error("course insert failed");

    const rows = spec.lessons.map((l, order) => ({
      course_id: course.id,
      title: l.title,
      content: l.content,
      sort_order: order,
    }));

    const { error: lErr } = await service.from("lessons").insert(rows);
    if (lErr) throw lErr;
  }

  console.log("Seeded demo courses");

  const { count: rcount } = await service.from("resources").select("*", { count: "exact", head: true });
  if ((rcount ?? 0) === 0) {
    await service.from("resources").insert([
      {
        title: "Interview preparation checklist",
        type: "pdf",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        description: "Printable checklist for interview day.",
      },
      {
        title: "Women in Tech mentorship directory",
        type: "link",
        url: "https://www.techwomen.org/",
        description: "Global mentorship and leadership programs.",
      },
      {
        title: "CV formatting walkthrough",
        type: "video",
        url: "https://www.youtube.com/watch?v=x7V5kT0oKjc",
        description: "Short guide to clean CV layout.",
      },
    ]);
    console.log("Seeded mentorship resources");
  }
}

async function main() {
  const email = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@demo.com";
  const password = process.env.DEFAULT_ADMIN_PASSWORD ?? "password123";

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is required for seed");
    process.exit(1);
  }

  await ensureAdmin(email, password);
  await seedContent();
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
