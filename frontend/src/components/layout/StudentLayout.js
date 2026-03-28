import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FiAward, FiClipboard, FiUser, FiLogOut, FiMenu, FiX } from "react-icons/fi";

const navItems = [
  { to: "/student/grades", label: "My Grades", icon: FiAward },
  { to: "/student/enrollments", label: "My Enrollments", icon: FiClipboard },
  { to: "/student/profile", label: "My Profile", icon: FiUser },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const student = user?.studentInfo;

  return (
    <div style={styles.shell}>
      {mobileOpen && <div style={styles.overlay} onClick={() => setMobileOpen(false)} />}

      <aside style={{ ...styles.sidebar, left: mobileOpen ? 0 : undefined }}>
        <div style={styles.sidebarHeader}>
          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🎓</div>
            <p style={styles.logoText}>BukSU SIS</p>
            <p style={styles.portalLabel}>Student Portal</p>
          </div>
          <button onClick={() => setMobileOpen(false)} style={styles.closeBtn} className="show-mobile">
            <FiX />
          </button>
        </div>

        <div style={styles.studentCard}>
          <div style={styles.avatar}>{student?.firstName?.[0] || user?.username?.[0]}</div>
          <div>
            <p style={styles.studentName}>
              {student ? `${student.firstName} ${student.lastName}` : user?.username}
            </p>
            {student && (
              <>
                <p style={styles.studentNum}>{student.studentNumber}</p>
                <p style={styles.studentCourse}>{student.course} — Year {student.yearLevel}</p>
              </>
            )}
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...styles.navLink,
                background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                color: isActive ? "#C9A84C" : "rgba(255,255,255,0.7)",
                borderLeft: isActive ? "3px solid #C9A84C" : "3px solid transparent",
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.userArea}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div style={{ ...styles.main, marginLeft: 260 }}>
        <header style={styles.topbar}>
          <button style={styles.menuBtn} onClick={() => setMobileOpen(true)} className="show-mobile">
            <FiMenu size={20} />
          </button>
          <div style={styles.topTitle}>Student Portal</div>
          <div style={styles.topbarRight}>
            <div style={styles.topAvatar}>{user?.username?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.username}</span>
          </div>
        </header>
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .show-mobile { display: flex !important; }
          aside { position: fixed !important; left: -260px !important; z-index: 100; }
          div[style*="margin-left: 260"] { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 },
  sidebar: {
    position: "fixed", top: 0, left: 0, width: 260, height: "100vh",
    background: "linear-gradient(180deg, #3d0d18 0%, #5a1321 40%, #7B1C2E 100%)",
    display: "flex", flexDirection: "column", zIndex: 100,
    boxShadow: "2px 0 20px rgba(0,0,0,0.2)",
  },
  sidebarHeader: {
    padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  },
  logoText: { fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: 16, fontWeight: 700 },
  portalLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" },
  closeBtn: { background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", borderRadius: 6, cursor: "pointer", padding: 6, display: "flex" },
  studentCard: {
    padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex", alignItems: "center", gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "var(--gold)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 18, flexShrink: 0, textTransform: "uppercase",
  },
  studentName: { color: "#fff", fontSize: 14, fontWeight: 600 },
  studentNum: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  studentCourse: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  nav: { flex: 1, padding: "16px 8px" },
  navLink: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderRadius: 8, marginBottom: 4,
    textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "all 0.15s",
  },
  userArea: { padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 8,
    width: "100%", padding: "9px 12px", borderRadius: 8,
    background: "rgba(255,255,255,0.08)", border: "none",
    color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, fontWeight: 500,
    justifyContent: "center",
  },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  topbar: {
    height: 64, background: "#fff", borderBottom: "1px solid var(--border)",
    display: "flex", alignItems: "center", padding: "0 24px",
    position: "sticky", top: 0, zIndex: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  topTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, flex: 1 },
  menuBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: 8, borderRadius: 8, display: "flex", marginRight: 12 },
  topbarRight: { display: "flex", alignItems: "center", gap: 10 },
  topAvatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "var(--primary)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 13,
  },
  content: { flex: 1, padding: "28px 28px" },
};
