export function SetupMissingEnv() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "36rem",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        background: "#f8f3ee",
        color: "#1c1410",
      }}
    >
      <h1 style={{ fontSize: "1.35rem", marginTop: 0 }}>Configure the frontend</h1>
      <p>
        The app needs Supabase environment variables. Create{" "}
        <code style={{ background: "#efe6dc", padding: "0.15rem 0.35rem", borderRadius: 6 }}>
          client/.env.local
        </code>{" "}
        (copy from <code style={{ background: "#efe6dc", padding: "0.15rem 0.35rem", borderRadius: 6 }}>client/.env.example</code>
        ) with:
      </p>
      <pre
        style={{
          background: "#1c1410",
          color: "#f8f3ee",
          padding: "1rem",
          borderRadius: 8,
          overflow: "auto",
          fontSize: "0.85rem",
        }}
      >
        {`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key`}
      </pre>
      <p>
        Use the same <strong>Project URL</strong> and <strong>anon public</strong> key from the Supabase dashboard
        (Settings → API). Then <strong>restart</strong> the Vite dev server (<code>npm run dev</code>).
      </p>
    </div>
  );
}
