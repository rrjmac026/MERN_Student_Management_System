import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const geBadge = (ge) => {
  if (!ge) return { cls: "grade-pending", label: ge || "Pending" };
  if (ge === "5.0") return { cls: "grade-failed", label: ge };
  if (["INC", "OD", "W"].includes(ge)) return { cls: "grade-inc", label: ge };
  return { cls: "grade-passed", label: ge };
};

const BUKSU_TABLE = [
  ["1.0","98–100"],["1.25","95–97"],["1.50","92–94"],["1.75","89–91"],
  ["2.0","86–88"],["2.25","83–85"],["2.50","80–82"],["2.75","77–79"],
  ["3.0","75–76"],["5.0","Below 75"],
];

export default function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterAY, setFilterAY] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filterAY) params.academicYear = filterAY;
        if (filterSem) params.semester = filterSem;
        const res = await api.get("/grades/my", { params });
        setGrades(res.data.data);
        setGrouped(res.data.grouped);
        const keys = Object.keys(res.data.grouped);
        if (keys.length && !activeTab) setActiveTab(keys[0]);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, [filterAY, filterSem]);

  const computeGWA = (gradeList) => {
    const valid = gradeList.filter(g => g.gradeEquivalent && !["INC","OD","W","5.0"].includes(g.gradeEquivalent) && g.gradeEquivalent !== "Pending");
    if (!valid.length) return null;
    const totalW = valid.reduce((s, g) => s + parseFloat(g.gradeEquivalent) * (g.subject?.units || 3), 0);
    const totalU = valid.reduce((s, g) => s + (g.subject?.units || 3), 0);
    return totalU ? (totalW / totalU).toFixed(4) : null;
  };

  const student = user?.studentInfo;
  const tabKeys = Object.keys(grouped);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Grades</h1>
          <p className="page-subtitle">View your academic grades — BukSU Grading System</p>
        </div>
      </div>

      {/* Student Info Banner */}
      {student && (
        <div style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(201,168,76,0.3)", border: "2px solid rgba(201,168,76,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>
            {student.firstName[0]}
          </div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>{student.firstName} {student.middleName} {student.lastName}</p>
            <p style={{ opacity: 0.8, fontSize: 14 }}>{student.studentNumber} · {student.course} · Year {student.yearLevel}{student.section ? ` — Section ${student.section}` : ""}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-row" style={{ marginBottom: 0 }}>
        <select className="form-control" value={filterAY} onChange={e => setFilterAY(e.target.value)}>
          <option value="">All Academic Years</option>
          {["2024-2025","2023-2024","2022-2023"].map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="form-control" value={filterSem} onChange={e => setFilterSem(e.target.value)}>
          <option value="">All Semesters</option>
          <option>1st Semester</option><option>2nd Semester</option><option>Summer</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><div className="loading-spinner" style={{ margin: "0 auto" }} /></div>
      ) : tabKeys.length === 0 ? (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No grade records yet</h3>
            <p>Your grades will appear here once you are enrolled and grades are encoded.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="tabs" style={{ marginTop: 20 }}>
            {tabKeys.map(key => (
              <button key={key} className={`tab-btn ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                {key}
              </button>
            ))}
          </div>

          {activeTab && grouped[activeTab] && (
            <div>
              {/* GWA for this period */}
              {(() => {
                const gwa = computeGWA(grouped[activeTab]);
                const totalUnits = grouped[activeTab].reduce((s, g) => s + (g.subject?.units || 0), 0);
                return (
                  <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                    <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
                      <div className="stat-icon primary">📚</div>
                      <div><p className="stat-label">Subjects</p><p className="stat-value">{grouped[activeTab].length}</p></div>
                    </div>
                    <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
                      <div className="stat-icon gold">⚖️</div>
                      <div><p className="stat-label">Total Units</p><p className="stat-value">{totalUnits}</p></div>
                    </div>
                    {gwa && (
                      <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
                        <div className="stat-icon success">🏆</div>
                        <div><p className="stat-label">GWA (this period)</p><p className="stat-value">{gwa}</p></div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="card">
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject</th><th>Units</th>
                        <th style={{ textAlign: "center" }}>Prelim<br /><span style={{ fontWeight: 400, fontSize: 11 }}>(20%)</span></th>
                        <th style={{ textAlign: "center" }}>Midterm<br /><span style={{ fontWeight: 400, fontSize: 11 }}>(20%)</span></th>
                        <th style={{ textAlign: "center" }}>Pre-Final<br /><span style={{ fontWeight: 400, fontSize: 11 }}>(20%)</span></th>
                        <th style={{ textAlign: "center" }}>Final<br /><span style={{ fontWeight: 400, fontSize: 11 }}>(40%)</span></th>
                        <th style={{ textAlign: "center" }}>Grade</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[activeTab].map(g => {
                        const { cls, label } = geBadge(g.gradeEquivalent);
                        return (
                          <tr key={g._id}>
                            <td>
                              <div style={{ fontWeight: 600, color: "var(--primary)" }}>{g.subject?.subjectCode}</div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{g.subject?.subjectName}</div>
                              <div style={{ fontSize: 11, color: "var(--text-light)" }}>{g.subject?.type}</div>
                            </td>
                            <td><span className="badge badge-primary">{g.subject?.units}</span></td>
                            <td style={{ textAlign: "center", fontWeight: 500 }}>{g.prelim ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                            <td style={{ textAlign: "center", fontWeight: 500 }}>{g.midterm ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                            <td style={{ textAlign: "center", fontWeight: 500 }}>{g.prefinal ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                            <td style={{ textAlign: "center", fontWeight: 500 }}>{g.final ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                            <td style={{ textAlign: "center" }}>
                              <span className={`grade-pill ${cls}`} style={{ fontSize: 16, fontWeight: 800, padding: "4px 14px" }}>{label || "—"}</span>
                            </td>
                            <td>
                              <span className={`badge ${g.remarks === "Passed" ? "badge-success" : g.remarks === "Failed" ? "badge-danger" : g.remarks === "Incomplete" ? "badge-warning" : "badge-muted"}`}>
                                {g.remarks}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BukSU Grade Legend */}
          <div style={{ marginTop: 20, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "16px 20px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>BukSU Grading Scale</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BUKSU_TABLE.map(([g, r]) => (
                <div key={g} style={{ background: "var(--bg)", padding: "4px 12px", borderRadius: 6, fontSize: 12, border: "1px solid var(--border)" }}>
                  <strong style={{ color: g === "5.0" ? "var(--danger)" : g === "3.0" ? "var(--warning)" : "var(--success)" }}>{g}</strong>
                  <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>= {r}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
