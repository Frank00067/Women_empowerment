import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const lessons = [
    { course_id: 1, title: 'Introduction to Word', content: 'Learn Word basics', order: 1 },
    { course_id: 1, title: 'Formatting Documents', content: 'Formatting text, paragraphs', order: 2 },
    { course_id: 1, title: 'Using Tables', content: 'Insert and format tables', order: 3 },
  ];

  for (const lesson of lessons) {
    const { error } = await supabase.from('lessons').insert(lesson);
    if (error) console.error(error);
    else console.log('Inserted:', lesson.title);
  }
}

main();