import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FiGrid, FiUsers, FiBook, FiClipboard, FiAward,
  FiUserCheck, FiLogOut, FiMenu, FiX, FiChevronRight
} from "react-icons/fi";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/admin/students", label: "Students", icon: FiUsers },
  { to: "/admin/subjects", label: "Subjects", icon: FiBook },
  { to: "/admin/enrollments", label: "Enrollments", icon: FiClipboard },
  { to: "/admin/grades", label: "Grades", icon: FiAward },
  { to: "/admin/users", label: "Users", icon: FiUserCheck },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div style={styles.shell}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        ...styles.sidebar,
        width: collapsed ? 72 : 260,
        left: mobileOpen ? 0 : undefined,
      }}>
        {/* Logo */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>🎓</div>
            {!collapsed && <span style={styles.logoText}>BukSU SIS</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={styles.collapseBtn}
            className="hide-mobile"
          >
            <FiChevronRight style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.3s" }} />
          </button>
          <button onClick={() => setMobileOpen(false)} style={{ ...styles.collapseBtn, display: "none" }} className="show-mobile">
            <FiX />
          </button>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {!collapsed && <p style={styles.navSection}>MAIN MENU</p>}
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                ...styles.navLink,
                background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                color: isActive ? "#C9A84C" : "rgba(255,255,255,0.7)",
                borderLeft: isActive ? "3px solid #C9A84C" : "3px solid transparent",
                justifyContent: collapsed ? "center" : "flex-start",
              })}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        <div style={styles.userArea}>
          {!collapsed && (
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.userName}>{user?.username}</p>
                <p style={styles.userRole}>Administrator</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            <FiLogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ ...styles.main, marginLeft: collapsed ? 72 : 260 }}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <button
            style={styles.menuBtn}
            onClick={() => setMobileOpen(true)}
            className="show-mobile"
          >
            <FiMenu size={20} />
          </button>
          <div style={{ flex: 1 }} />
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
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh", background: "var(--bg)" },
  mobileOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    zIndex: 99, display: "none",
  },
  sidebar: {
    position: "fixed", top: 0, left: 0, height: "100vh",
    background: "linear-gradient(180deg, #3d0d18 0%, #5a1321 40%, #7B1C2E 100%)",
    display: "flex", flexDirection: "column",
    transition: "width 0.3s ease",
    zIndex: 100, overflowX: "hidden",
    boxShadow: "2px 0 20px rgba(0,0,0,0.2)",
  },
  sidebarHeader: {
    padding: "20px 16px", display: "flex", alignItems: "center",
    justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)",
    minHeight: 72,
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 24, flexShrink: 0 },
  logoText: {
    fontFamily: "'Playfair Display', serif", color: "#fff",
    fontSize: 16, fontWeight: 700, whiteSpace: "nowrap",
  },
  collapseBtn: {
    background: "rgba(255,255,255,0.1)", border: "none",
    color: "rgba(255,255,255,0.7)", width: 28, height: 28,
    borderRadius: 6, cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  nav: { flex: 1, padding: "16px 8px", overflowY: "auto", overflowX: "hidden" },
  navSection: {
    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.1em", padding: "0 8px", marginBottom: 8,
  },
  navLink: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderRadius: 8, marginBottom: 2,
    textDecoration: "none", fontSize: 14, fontWeight: 500,
    transition: "all 0.15s", whiteSpace: "nowrap",
  },
  userArea: {
    padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  userInfo: {
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 10, padding: "8px",
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--gold)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  userName: { color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userRole: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 8,
    width: "100%", padding: "9px 12px", borderRadius: 8,
    background: "rgba(255,255,255,0.08)", border: "none",
    color: "rgba(255,255,255,0.7)", cursor: "pointer",
    fontSize: 13, fontWeight: 500, transition: "all 0.15s",
    justifyContent: "center",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", transition: "margin-left 0.3s ease" },
  topbar: {
    height: 64, background: "#fff", borderBottom: "1px solid var(--border)",
    display: "flex", alignItems: "center", padding: "0 24px",
    position: "sticky", top: 0, zIndex: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  menuBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text)", padding: 8, borderRadius: 8,
    display: "flex", alignItems: "center",
  },
  topbarRight: { display: "flex", alignItems: "center", gap: 10 },
  topAvatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "var(--primary)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 13,
  },
  content: { flex: 1, padding: "28px 28px", overflowY: "auto" },
};
