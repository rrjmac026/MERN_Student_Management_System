import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { FiUsers, FiBook, FiClipboard, FiAward } from "react-icons/fi";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, subjects: 0, enrollments: 0, grades: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [studRes, subjRes, enrRes, gradeRes] = await Promise.all([
          api.get("/students?limit=5"),
          api.get("/subjects?limit=1"),
          api.get("/enrollments?limit=1"),
          api.get("/grades?limit=1"),
        ]);
        setStats({
          students: studRes.data.total,
          subjects: subjRes.data.total,
          enrollments: enrRes.data.total,
          grades: gradeRes.data.total,
        });
        setRecentStudents(studRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statCards = [
    { label: "Total Students", value: stats.students, icon: FiUsers, color: "primary" },
    { label: "Total Subjects", value: stats.subjects, icon: FiBook, color: "gold" },
    { label: "Enrollments", value: stats.enrollments, icon: FiClipboard, color: "success" },
    { label: "Grade Records", value: stats.grades, icon: FiAward, color: "info" },
  ];

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div className="loading-spinner" style={{ margin: "0 auto" }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.username}! Here's what's happening.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}>
              <Icon />
            </div>
            <div>
              <p className="stat-label">{label}</p>
              <p className="stat-value">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Students */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Students</h2>
          <a href="/admin/students" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>View all →</a>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Name</th>
                <th>Course</th>
                <th>Year</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No students yet</td></tr>
              ) : recentStudents.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600, color: "var(--primary)", fontFamily: "monospace" }}>{s.studentNumber}</td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.course}</td>
                  <td>{s.yearLevel}</td>
                  <td>
                    <span className={`badge ${s.status === "Active" ? "badge-success" : "badge-muted"}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        marginTop: 20,
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>
            BukSU Grading System
          </h3>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Grades follow the official BukSU grading scheme: 1.0 (Excellent) to 3.0 (Passed) · 5.0 (Failed)
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["1.0","98-100"],["1.5","92-94"],["2.0","86-88"],["2.5","80-82"],["3.0","75-76"],["5.0","Below 75"]].map(([g, r]) => (
            <div key={g} style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 8, padding: "6px 12px", textAlign: "center",
            }}>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{g}</p>
              <p style={{ fontSize: 10, opacity: 0.8 }}>{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
