import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome, ${user.username}!`);
      navigate(user.role === "admin" ? "/admin" : "/student", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left decorative panel */}
      <div style={styles.leftPanel}>
        <div style={styles.logoArea}>
          <div style={styles.emblem}>
            <span style={{ fontSize: 48 }}>🎓</span>
          </div>
          <h1 style={styles.uni}>Bukidnon State University</h1>
          <p style={styles.uniSub}>Student Information System</p>
          <div style={styles.divider} />
          <p style={styles.tagline}>
            Empowering academic excellence through seamless information management.
          </p>
        </div>
        <div style={styles.decorCircle1} />
        <div style={styles.decorCircle2} />
        <div style={styles.decorCircle3} />
      </div>

      {/* Right login form */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={styles.loginTitle}>Sign In</h2>
            <p style={styles.loginSub}>Enter your credentials to access the portal</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="search-bar">
                <FiMail className="search-icon" />
                <input
                  type="email"
                  className="form-control"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <FiLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  type={showPw ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                >
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? <><span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : "Sign In"}
            </button>
          </form>

          <div style={styles.hint}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}><strong>Demo Credentials:</strong></p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Admin: admin@buksu.edu.ph / admin123</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Student: maria.santos@student.buksu.edu.ph / student123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(145deg, #7B1C2E 0%, #5a1321 50%, #3d0d18 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px 40px",
    position: "relative",
    overflow: "hidden",
    minHeight: "100vh",
  },
  logoArea: {
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  emblem: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "rgba(201,168,76,0.2)",
    border: "2px solid rgba(201,168,76,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  uni: {
    fontFamily: "'Playfair Display', serif",
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  uniSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  divider: {
    width: 60,
    height: 2,
    background: "rgba(201,168,76,0.6)",
    margin: "20px auto",
    borderRadius: 1,
  },
  tagline: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    maxWidth: 300,
    lineHeight: 1.7,
  },
  decorCircle1: {
    position: "absolute", width: 300, height: 300,
    borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)",
    top: -80, left: -80,
  },
  decorCircle2: {
    position: "absolute", width: 200, height: 200,
    borderRadius: "50%", border: "1px solid rgba(201,168,76,0.1)",
    bottom: 40, right: -60,
  },
  decorCircle3: {
    position: "absolute", width: 120, height: 120,
    borderRadius: "50%", background: "rgba(201,168,76,0.05)",
    bottom: 100, left: 40,
  },
  rightPanel: {
    width: "480px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
    background: "#f7f5f2",
  },
  formCard: {
    width: "100%",
    maxWidth: 380,
  },
  loginTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    fontWeight: 700,
    color: "var(--text)",
    marginBottom: 6,
  },
  loginSub: {
    color: "var(--text-muted)",
    fontSize: 14,
  },
  hint: {
    marginTop: 24,
    padding: 16,
    background: "#fff",
    borderRadius: 10,
    border: "1px solid var(--border)",
  },
};
