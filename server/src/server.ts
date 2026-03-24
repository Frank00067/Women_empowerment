import "dotenv/config";
import { createApp } from "./app";

const PORT = Number(process.env.PORT) || 4000;

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const;
for (const k of required) {
  if (!process.env[k]) {
    console.error(`Missing env: ${k}`);
    process.exit(1);
  }
}

const app = createApp();
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} (Supabase-backed)`);
});
