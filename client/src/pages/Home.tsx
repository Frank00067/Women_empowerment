import { Link } from "react-router-dom";

export function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Digital learning & careers</p>
          <h1>Skills, confidence, and job-readiness for the next generation of women leaders.</h1>
          <p className="lead">
            Rise Digital helps young African women master essential tools like Word and Excel, build
            a polished CV, explore mentorship, and connect with employers — all in one welcoming
            space.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              Get started free
            </Link>
            <Link to="/courses" className="btn btn-secondary">
              Browse courses
            </Link>
          </div>
        </div>
        <div className="hero-card" aria-hidden={false}>
          <p className="eyebrow">Your journey</p>
          <h2 style={{ marginTop: 0, fontSize: "1.35rem" }}>From first lesson to first offer</h2>
          <p className="muted" style={{ fontSize: "0.95rem" }}>
            Structured modules, progress you can see, certificates when you finish, and real job
            posts from partner employers.
          </p>
          <div className="stats-row">
            <div className="stat">
              <strong>3+</strong>
              <span>Core skill tracks</span>
            </div>
            <div className="stat">
              <strong>Live</strong>
              <span>CV preview</span>
            </div>
            <div className="stat">
              <strong>100%</strong>
              <span>Your pace</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <p className="eyebrow">Why Rise Digital</p>
        <h2 className="page-title">Built for real workplace skills</h2>
        <p className="page-intro">
          Practical lessons, respectful mentorship links, and employer connections designed around
          busy schedules and big ambitions.
        </p>
        <div className="features-grid">
          <article className="feature-card">
            <h3>Microsoft Office & digital literacy</h3>
            <p className="muted">
              Word, Excel, and everyday digital skills explained with clarity — so documents and
              spreadsheets feel approachable, not intimidating.
            </p>
          </article>
          <article className="feature-card">
            <h3>CV builder with live preview</h3>
            <p className="muted">
              Guided fields update a clean resume layout instantly. Save from your profile and tune
              it before you apply.
            </p>
          </article>
          <article className="feature-card">
            <h3>Jobs & applications</h3>
            <p className="muted">
              Employers post roles; learners apply with a short note. Status updates keep everyone
              in the loop.
            </p>
          </article>
          <article className="feature-card">
            <h3>Mentorship resources</h3>
            <p className="muted">
              Curated PDFs, videos, and links — expanded by admins as your program grows.
            </p>
          </article>
        </div>
        <div className="cta-band">
          <h2>Ready to rise?</h2>
          <p>Create a free learner account and start your first module in minutes.</p>
          <Link to="/register" className="btn btn-primary">
            Create learner account
          </Link>
        </div>
      </section>
    </>
  );
}
