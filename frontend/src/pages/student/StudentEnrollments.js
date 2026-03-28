import React, { useEffect, useState } from "react";
import api from "../../api/axios";

export default function StudentEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get("/enrollments/my");
        setEnrollments(res.data.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const statusColor = { Enrolled: "badge-success", Dropped: "badge-danger", Completed: "badge-info", Pending: "badge-warning" };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><div className="loading-spinner" style={{ margin: "0 auto" }} /></div>;

  if (!enrollments.length) return (
    <div>
      <div className="page-header"><h1 className="page-title">My Enrollments</h1></div>
      <div className="card"><div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>No enrollment records</h3>
        <p>You are not yet enrolled in any semester.</p>
      </div></div>
    </div>
  );

  const active = enrollments[activeIdx];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Enrollments</h1>
          <p className="page-subtitle">{enrollments.length} enrollment record{enrollments.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Semester tabs */}
      <div className="tabs">
        {enrollments.map((e, i) => (
          <button key={e._id} className={`tab-btn ${activeIdx === i ? "active" : ""}`} onClick={() => setActiveIdx(i)}>
            {e.academicYear} — {e.semester}
          </button>
        ))}
      </div>

      {active && (
        <div>
          {/* Summary */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="stat-icon primary">📅</div>
              <div><p className="stat-label">Academic Year</p><p style={{ fontWeight: 700, fontSize: 16 }}>{active.academicYear}</p></div>
            </div>
            <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="stat-icon gold">🗓</div>
              <div><p className="stat-label">Semester</p><p style={{ fontWeight: 700, fontSize: 15 }}>{active.semester}</p></div>
            </div>
            <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="stat-icon success">📚</div>
              <div><p className="stat-label">Total Units</p><p className="stat-value">{active.totalUnits}</p></div>
            </div>
            <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="stat-icon info">✅</div>
              <div>
                <p className="stat-label">Status</p>
                <span className={`badge ${statusColor[active.status] || "badge-muted"}`} style={{ fontSize: 14, padding: "4px 12px", marginTop: 4 }}>{active.status}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Enrolled Subjects</h2>
              <span className="badge badge-primary">{active.subjects?.length} subjects</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>Code</th><th>Subject Name</th><th>Units</th><th>Type</th><th>Schedule</th><th>Room</th></tr>
                </thead>
                <tbody>
                  {active.subjects?.map((s, i) => (
                    <tr key={s._id}>
                      <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>{s.subject?.subjectCode}</td>
                      <td style={{ fontWeight: 500 }}>{s.subject?.subjectName}</td>
                      <td><span className="badge badge-primary">{s.subject?.units} units</span></td>
                      <td><span className="badge badge-muted">{s.subject?.type}</span></td>
                      <td style={{ fontSize: 13 }}>{s.schedule || <span style={{ color: "var(--text-light)" }}>TBA</span>}</td>
                      <td style={{ fontSize: 13 }}>{s.room || <span style={{ color: "var(--text-light)" }}>TBA</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 13 }}>Total Units:</td>
                    <td><span className="badge badge-gold" style={{ fontSize: 14 }}>{active.totalUnits}</span></td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
