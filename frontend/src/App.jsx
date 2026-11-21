import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UploadCloud,
  X,
  XCircle,
  AlertTriangle,
  LockKeyhole,
} from "lucide-react";
import api from "./api";
import Orb from "./Orb";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.2, 0.7, 0.2, 1] },
  },
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("veriscope_token"));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("verify");
  const [claim, setClaim] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total_checks: 0,
    real_count: 0,
    fake_count: 0,
    unverified_count: 0,
  });
  const [mobile, setMobile] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [theme, setTheme] = useState(
    localStorage.getItem("veriscope_theme") || "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("veriscope_theme", theme);
  }, [theme]);
  const load = async () => {
    try {
      const [u, h, s] = await Promise.all([
        api.get("/api/auth/me"),
        api.get("/api/auth/history"),
        api.get("/api/auth/stats"),
      ]);
      setUser(u.data);
      setHistory(h.data.predictions);
      setStats(s.data);
    } catch {
      logout();
    }
  };
  useEffect(() => {
    if (token) load();
  }, [token]);
  function logout() {
    localStorage.removeItem("veriscope_token");
    setToken(null);
    setUser(null);
    setResult(null);
    setHistory([]);
    setPage("verify");
  }
  async function submitAuth(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(
        authMode === "login" ? "/api/auth/login" : "/api/auth/register",
        auth,
      );
      localStorage.setItem("veriscope_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Unable to authenticate. Check that the backend is running.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify(e) {
    e?.preventDefault();
    if (claim.trim().length < 5) {
      setError("Enter a claim with at least 5 characters.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post("/api/predict", { claim: claim.trim() });
      setResult(data);
      await load();
    } catch (e) {
      setError(
        e.response?.data?.detail || "Verification failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/api/image-predict", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      setClaim(data.extracted_text || "");
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not process this image.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  async function remove(id) {
    try {
      await api.delete(`/api/auth/history/${id}`);
      await load();
      if (result?.id === id) setResult(null);
    } catch {
      setError("Could not delete this history item.");
    }
  }

  if (!token)
    return showAuth ? (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        auth={auth}
        setAuth={setAuth}
        submitAuth={submitAuth}
        busy={busy}
        error={error}
        theme={theme}
        setTheme={setTheme}
        onBack={() => setShowAuth(false)}
      />
    ) : (
      <LandingPage
        theme={theme}
        setTheme={setTheme}
        onStart={() => {
          setAuthMode("register");
          setShowAuth(true);
        }}
        onLogin={() => {
          setAuthMode("login");
          setShowAuth(true);
        }}
      />
    );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={19} />
          </span>
          <span>
            VeriScope<span className="brand-ai"> AI</span>
          </span>
          <button className="mobile-close" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <button
          className={`nav-item ${page === "verify" ? "active" : ""}`}
          onClick={() => {
            setPage("verify");
            setMobile(false);
          }}
        >
          <LayoutDashboard /> Overview
        </button>
        <button
          className={`nav-item ${page === "history" ? "active" : ""}`}
          onClick={() => {
            setPage("history");
            setMobile(false);
          }}
        >
          <History /> Verification history
        </button>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Sparkles size={17} />
            <b>Think before you share</b>
            <p>
              AI assessments are a starting point. Review original sources
              before acting on a claim.
            </p>
          </div>
          <div className="profile">
            <div className="avatar">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="profile-text">
              <b>{user?.name || "User"}</b>
              <span>{user?.email}</span>
            </div>
            <button title="Sign out" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div className="crumb">
            Workspace <ChevronRight size={14} />{" "}
            <b>{page === "verify" ? "Overview" : "Verification history"}</b>
          </div>
          <div className="top-actions">
            <span className="system-state">
              <i /> System ready
            </span>
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="avatar small">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="content">
          {page === "verify" ? (
            <>
              <motion.div
                className="page-heading"
                initial="hidden"
                animate="show"
                variants={fadeUp}
              >
                <div>
                  <span className="eyebrow">YOUR FACT-CHECKING WORKSPACE</span>
                  <h1>
                    Good{" "}
                    {new Date().getHours() < 12
                      ? "morning"
                      : new Date().getHours() < 18
                        ? "afternoon"
                        : "evening"}
                    , {user?.name?.split(" ")[0] || "there"}.
                  </h1>
                  <p>
                    Investigate a claim. Examine the evidence. Make an informed
                    decision.
                  </p>
                </div>
                <div className="date-chip">
                  <Activity size={15} /> LIVE WORKSPACE
                </div>
              </motion.div>
              <motion.div
                className="stats-grid"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              >
                {[
                  {
                    label: "Total checks",
                    value: stats.total_checks,
                    icon: <Search />,
                    tone: "blue",
                  },
                  {
                    label: "Assessed as real",
                    value: stats.real_count,
                    icon: <CheckCircle2 />,
                    tone: "green",
                  },
                  {
                    label: "Assessed as fake",
                    value: stats.fake_count,
                    icon: <XCircle />,
                    tone: "red",
                  },
                  {
                    label: "Unverified",
                    value: stats.unverified_count,
                    icon: <AlertTriangle />,
                    tone: "amber",
                  },
                ].map((s) => (
                  <motion.div
                    className="stat-card"
                    variants={fadeUp}
                    key={s.label}
                  >
                    <div className={`stat-icon ${s.tone}`}>{s.icon}</div>
                    <div>
                      <span>{s.label}</span>
                      <strong>{s.value}</strong>
                    </div>
                    <div className="stat-glow" />
                  </motion.div>
                ))}
              </motion.div>
              <div className="workspace-grid">
                <motion.section
                  className="panel verify-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <div className="panel-title">
                    <div className="panel-icon">
                      <Search />
                    </div>
                    <div>
                      <span className="eyebrow">INVESTIGATION DESK</span>
                      <h2>Verify a news claim</h2>
                      <p>Paste a headline, statement, or article excerpt.</p>
                    </div>
                  </div>
                  <form onSubmit={verify}>
                    <label className="field-label">CLAIM OR NEWS TEXT</label>
                    <textarea
                      value={claim}
                      onChange={(e) => setClaim(e.target.value)}
                      placeholder="Paste a claim you want to investigate…"
                      maxLength={12000}
                    />
                    <div className="field-meta">
                      <span>Specific claims produce more useful context.</span>
                      <span>{claim.length.toLocaleString()} / 12,000</span>
                    </div>
                    <div className="verify-actions">
                      <button
                        className="primary"
                        disabled={busy || claim.trim().length < 5}
                      >
                        {busy ? (
                          <>
                            <span className="spinner" /> Analyzing…
                          </>
                        ) : (
                          <>
                            Analyze claim <ArrowUpRight size={17} />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          setClaim("");
                          setResult(null);
                          setError("");
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                  <div className="upload-box">
                    <div className="upload-icon">
                      <UploadCloud />
                    </div>
                    <div>
                      <b>Have a screenshot instead?</b>
                      <p>
                        Drop a news or social image here, or browse to extract
                        its text with OCR.
                      </p>
                    </div>
                    <label className="upload-btn">
                      Upload image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={upload}
                        disabled={busy}
                      />
                    </label>
                  </div>
                  {error && <div className="error">{error}</div>}
                </motion.section>
                <motion.aside
                  className="panel how-panel"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="orb-mini">
                    <Orb compact />
                    <span className="orb-label">
                      VERISCOPE ENGINE <i />
                    </span>
                  </div>
                  <span className="eyebrow">THE VERIFICATION FLOW</span>
                  <h2>From claim to context.</h2>
                  <div className="steps">
                    <Step
                      n="01"
                      title="Submit a claim"
                      desc="Paste text or upload a screenshot for OCR extraction."
                    />
                    <Step
                      n="02"
                      title="Gather context"
                      desc="Find related reporting through Google News RSS."
                    />
                    <Step
                      n="03"
                      title="AI assessment"
                      desc="Gemini reviews the claim and available context."
                    />
                    <Step
                      n="04"
                      title="Review evidence"
                      desc="Explore the verdict, explanation and source links."
                    />
                  </div>
                  <div className="notice">
                    <ShieldCheck />
                    <span>
                      <b>Responsible by design</b>
                      <br />
                      UNVERIFIED is a valid outcome. Related articles alone do
                      not prove a claim.
                    </span>
                  </div>
                </motion.aside>
              </div>
              <AnimatePresence>
                {result && <Result result={result} />}
              </AnimatePresence>
              <div className="recent-heading">
                <div>
                  <span className="eyebrow">YOUR ACTIVITY</span>
                  <h2>Recent verifications</h2>
                  <p>Your latest claim assessments</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setPage("history")}
                >
                  View all <ArrowUpRight size={15} />
                </button>
              </div>
              {history.length ? (
                <div className="history-list">
                  {history.slice(0, 4).map((item, i) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      onDelete={remove}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={<FileText />}
                  title="No verifications yet"
                  text="Your analyzed claims will appear here."
                />
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="page-heading">
                <div>
                  <span className="eyebrow">YOUR ACTIVITY</span>
                  <h1>Verification history</h1>
                  <p>A record of the claims you've investigated.</p>
                </div>
              </div>
              {history.length ? (
                <div className="history-list full-history">
                  {history.map((item, i) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      onDelete={remove}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={<History />}
                  title="Your history is empty"
                  text="Start by analyzing a news claim."
                  action={() => setPage("verify")}
                />
              )}
            </motion.div>
          )}
          <footer>
            © {new Date().getFullYear()} VeriScope AI{" "}
            <span>Evidence-aware information verification</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function AuthScreen({
  authMode,
  setAuthMode,
  auth,
  setAuth,
  submitAuth,
  busy,
  error,
  theme,
  setTheme,
  onBack,
}) {
  return (
    <div className="auth-shell">
      <section className="auth-visual">
        <div className="auth-visual-top">
          <button className="back-home" onClick={onBack}>
            ← Back to home
          </button>
          <div className="brand">
            <span className="brand-mark">
              <ShieldCheck size={19} />
            </span>
            <span>
              VeriScope<span className="brand-ai"> AI</span>
            </span>
          </div>
          <button
            className="theme-toggle auth-theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
        <div className="auth-orb-wrap">
          <Orb />
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orb-caption">
            <span>01 / INTELLIGENCE CORE</span>
            <b>Signal over noise.</b>
          </div>
        </div>
        <div className="auth-copy">
          <span className="eyebrow">TRUST THE FACTS, NOT THE VIRALITY</span>
          <h1>
            Clarity in a world
            <br />
            full of claims.
          </h1>
          <p>
            Investigate information with AI-assisted analysis, real-world news
            context and transparent uncertainty.
          </p>
          <div className="auth-points">
            <span>
              <Check size={15} /> Evidence-aware analysis
            </span>
            <span>
              <Check size={15} /> Screenshot text extraction
            </span>
            <span>
              <Check size={15} /> Private verification history
            </span>
          </div>
        </div>
        <div className="auth-foot">
          <span>VERISCOPE AI</span>
          <span>BUILT FOR RESPONSIBLE VERIFICATION</span>
        </div>
      </section>
      <section className="auth-form-side">
        <motion.form
          className="auth-card"
          onSubmit={submitAuth}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="form-index">
            YOUR WORKSPACE{" "}
            <span>
              {" "}
              / {authMode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </span>
          </div>
          <span className="eyebrow">
            {authMode === "login" ? "WELCOME BACK" : "GET STARTED"}
          </span>
          <h2>
            {authMode === "login"
              ? "Enter the signal."
              : "Start investigating."}
          </h2>
          <p className="muted">
            {authMode === "login"
              ? "Sign in to continue to your verification workspace."
              : "Create an account to keep your research in one place."}
          </p>
          {authMode === "register" && (
            <label>
              Full name
              <input
                required
                value={auth.name}
                onChange={(e) => setAuth({ ...auth, name: e.target.value })}
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              required
              value={auth.email}
              onChange={(e) => setAuth({ ...auth, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength="6"
              value={auth.password}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary full" disabled={busy}>
            {busy
              ? "Please wait…"
              : authMode === "login"
                ? "Sign in to workspace"
                : "Create account"}{" "}
            <ArrowRight size={17} />
          </button>
          <p className="switch-auth">
            {authMode === "login"
              ? "New to VeriScope?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <div className="secure-note">
            <LockKeyhole size={14} /> Your account and history stay private.
          </div>
        </motion.form>
        <div className="form-side-foot">
          AI ASSISTANCE IS NOT A SUBSTITUTE FOR PRIMARY SOURCES.
        </div>
      </section>
    </div>
  );
}

function LandingPage({ theme, setTheme, onStart, onLogin }) {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <ShieldCheck size={19} />
          </span>
          <span>
            VeriScope<span className="brand-ai"> AI</span>
          </span>
        </a>
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Capabilities</a>
        </nav>
        <div className="landing-nav-actions">
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="landing-login" onClick={onLogin}>
            Sign in
          </button>
          <button className="primary landing-nav-cta" onClick={onStart}>
            Get started <ArrowRight size={16} />
          </button>
        </div>
      </header>
      <main id="home">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <motion.div
              className="landing-kicker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="live-dot" /> A CLEARER WAY TO CHECK WHAT YOU READ
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              Less noise.
              <br />
              <em>More clarity.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              Question a headline, investigate a claim, and explore the context
              behind it. VeriScope AI helps you slow down and look closer before
              you share.
            </motion.p>
            <motion.div
              className="landing-hero-actions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.23 }}
            >
              <button className="primary landing-main-cta" onClick={onStart}>
                Start verifying <ArrowRight size={18} />
              </button>
              <a className="landing-secondary-cta" href="#how-it-works">
                See how it works <ArrowUpRight size={16} />
              </a>
            </motion.div>
            <div className="landing-trust">
              <span>
                <Check size={15} /> AI-assisted analysis
              </span>
              <span>
                <Check size={15} /> Related news context
              </span>
              <span>
                <Check size={15} /> Transparent uncertainty
              </span>
            </div>
          </div>
          <motion.div
            className="landing-visual"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="visual-halo" />
            <div className="visual-grid" />
            <div className="landing-orb">
              <Orb />
            </div>
            <div className="orbit-line orbit-a" />
            <div className="orbit-line orbit-b" />
            <div className="visual-chip chip-top">
              <span className="chip-icon">
                <Activity size={15} />
              </span>
              <span>
                <b>Signal detected</b>
                <small>Claim ready for review</small>
              </span>
              <i />
            </div>
            <div className="visual-chip chip-bottom">
              <span className="chip-icon mint">
                <ShieldCheck size={16} />
              </span>
              <span>
                <b>Evidence matters</b>
                <small>Explore sources, not just scores</small>
              </span>
            </div>
            <div className="visual-coordinate">
              INTELLIGENCE CORE <span> / 01</span>
            </div>
          </motion.div>
        </section>
        <section className="landing-proof">
          <div>
            <strong>01</strong>
            <span>Submit a claim</span>
          </div>
          <i />
          <div>
            <strong>02</strong>
            <span>Gather context</span>
          </div>
          <i />
          <div>
            <strong>03</strong>
            <span>Review the assessment</span>
          </div>
          <i />
          <div>
            <strong>04</strong>
            <span>Make an informed decision</span>
          </div>
        </section>
        <section className="landing-section" id="features">
          <div className="section-intro">
            <span className="eyebrow">BUILT FOR BETTER QUESTIONS</span>
            <h2>Look beyond the headline.</h2>
            <p>
              Useful tools to help you examine information with more context and
              care.
            </p>
          </div>
          <div className="landing-feature-grid">
            <article className="landing-feature">
              <span className="feature-icon">
                <Search size={20} />
              </span>
              <span className="eyebrow">01 / ANALYZE</span>
              <h3>Investigate a claim</h3>
              <p>
                Paste a headline or statement and receive an AI-assisted
                assessment with a clear explanation.
              </p>
            </article>
            <article className="landing-feature">
              <span className="feature-icon">
                <Newspaper size={20} />
              </span>
              <span className="eyebrow">02 / CONTEXT</span>
              <h3>Explore related coverage</h3>
              <p>
                Find related news articles and open the original reporting to
                review the context yourself.
              </p>
            </article>
            <article className="landing-feature">
              <span className="feature-icon">
                <ScanTextFallback />
              </span>
              <span className="eyebrow">03 / EXTRACT</span>
              <h3>Check screenshot text</h3>
              <p>
                Upload an image and extract its text with OCR before sending the
                claim for analysis.
              </p>
            </article>
          </div>
        </section>
        <section className="landing-how" id="how-it-works">
          <div>
            <span className="eyebrow">A SIMPLE, TRANSPARENT FLOW</span>
            <h2>
              From curiosity
              <br />
              to context.
            </h2>
            <p>
              VeriScope is designed to support your judgment, not replace it. An
              AI verdict is a starting point for investigation—not the final
              word.
            </p>
            <button className="primary" onClick={onStart}>
              Try VeriScope AI <ArrowRight size={16} />
            </button>
          </div>
          <div className="landing-flow">
            <div>
              <b>01</b>
              <span>
                <strong>Share what you found</strong>
                <small>Enter a claim or upload a screenshot.</small>
              </span>
            </div>
            <div>
              <b>02</b>
              <span>
                <strong>Review the available context</strong>
                <small>
                  AI analysis and related news help frame the claim.
                </small>
              </span>
            </div>
            <div>
              <b>03</b>
              <span>
                <strong>Decide with care</strong>
                <small>Check primary sources before drawing conclusions.</small>
              </span>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <ShieldCheck size={17} />
          </span>
          <span>
            VeriScope<span className="brand-ai"> AI</span>
          </span>
        </a>
        <span>Signal over noise. Evidence over virality.</span>
        <span>AI assistance is not a substitute for primary sources.</span>
      </footer>
    </div>
  );
}
function ScanTextFallback() {
  return <FileText size={20} />;
}

function Step({ n, title, desc }) {
  return (
    <div className="step">
      <span>{n}</span>
      <div>
        <b>{title}</b>
        <p>{desc}</p>
      </div>
    </div>
  );
}
function Result({ result }) {
  const v = (
    result.verdict ||
    result.prediction?.toUpperCase() ||
    "UNVERIFIED"
  ).toUpperCase();
  return (
    <motion.section
      className="panel result-panel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.4 }}
    >
      <div className="result-head">
        <div>
          <span className="eyebrow">ANALYSIS COMPLETE</span>
          <h2>Verification result</h2>
        </div>
        <span className={`verdict ${v.toLowerCase()}`}>
          {v === "REAL" ? (
            <CheckCircle2 />
          ) : v === "FAKE" ? (
            <XCircle />
          ) : (
            <AlertTriangle />
          )}
          {v}
        </span>
      </div>
      <div className="claim-quote">“{result.claim}”</div>
      <div className="result-grid">
        <div className="confidence">
          <span>AI confidence estimate</span>
          <strong>
            {Math.round(result.confidence || 0)}
            <small>%</small>
          </strong>
          <div className="progress">
            <i
              style={{
                width: `${Math.max(0, Math.min(100, result.confidence || 0))}%`,
              }}
            />
          </div>
          <small>Model-reported estimate, not a calibrated probability.</small>
        </div>
        <div className="reasoning">
          <b>Why this assessment?</b>
          <p>{result.reasoning}</p>
        </div>
      </div>
      {result.extracted_text && (
        <div className="extracted">
          <b>Text extracted from image</b>
          <p>{result.extracted_text}</p>
        </div>
      )}
      <div className="sources-head">
        <b>
          <Newspaper size={17} /> Related news coverage
        </b>
        <span>{result.sources?.length || 0} results</span>
      </div>
      {result.sources?.length ? (
        <div className="source-list">
          {result.sources.map((s, i) => (
            <a
              className="source"
              href={s.url}
              target="_blank"
              rel="noreferrer"
              key={i}
            >
              <div>
                <b>{s.title}</b>
                <span>
                  {s.publisher} {s.published && `· ${s.published}`}
                </span>
              </div>
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      ) : (
        <p className="muted source-empty">
          No related news articles were found or the news service was
          unavailable.
        </p>
      )}
      <div className="disclaimer">
        <AlertTriangle size={16} />
        {result.disclaimer ||
          "AI-generated assessment, not definitive proof. Review original sources."}
      </div>
    </motion.section>
  );
}
function HistoryRow({ item, onDelete, index = 0 }) {
  const v = (
    item.verdict ||
    item.prediction?.toUpperCase() ||
    "UNVERIFIED"
  ).toUpperCase();
  return (
    <motion.div
      className="history-row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.2) }}
    >
      <div className={`history-status ${v.toLowerCase()}`}>
        {v === "REAL" ? (
          <CheckCircle2 />
        ) : v === "FAKE" ? (
          <XCircle />
        ) : (
          <AlertTriangle />
        )}
      </div>
      <div className="history-copy">
        <b>{item.claim || item.text}</b>
        <span>
          {item.created_at
            ? new Date(item.created_at).toLocaleString()
            : "Recently"}{" "}
          {item.from_image ? "· Image OCR" : ""}
        </span>
      </div>
      <span className={`mini-verdict ${v.toLowerCase()}`}>{v}</span>
      <button
        className="icon-btn"
        title="Delete record"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}
function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      {icon}
      <b>{title}</b>
      <span>{text}</span>
      {action && (
        <button className="secondary" onClick={action}>
          Verify a claim
        </button>
      )}
    </div>
  );
}
export default App;
