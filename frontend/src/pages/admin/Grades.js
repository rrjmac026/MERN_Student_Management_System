import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { FiEdit2, FiSearch, FiX, FiInfo } from "react-icons/fi";

const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
const SPECIAL_GRADES = ["", "INC", "OD", "W"];

const BUKSU_TABLE = [
  { grade: "1.0", range: "98–100", desc: "Excellent" },
  { grade: "1.25", range: "95–97", desc: "" },
  { grade: "1.50", range: "92–94", desc: "" },
  { grade: "1.75", range: "89–91", desc: "" },
  { grade: "2.0", range: "86–88", desc: "" },
  { grade: "2.25", range: "83–85", desc: "" },
  { grade: "2.50", range: "80–82", desc: "" },
  { grade: "2.75", range: "77–79", desc: "" },
  { grade: "3.0", range: "75–76", desc: "Passed" },
  { grade: "5.0", range: "Below 75", desc: "Failed" },
];

export default function Grades() {
  const [grades, setGrades] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterAY, setFilterAY] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [filterStudent, setFilterStudent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [editing, setEditing] = useState(null);
  const [gradeForm, setGradeForm] = useState({ prelim: "", midterm: "", prefinal: "", final: "", specialGrade: "" });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterAY) params.academicYear = filterAY;
      if (filterSem) params.semester = filterSem;
      if (filterStudent) params.student = filterStudent;
      const res = await api.get("/grades", { params });
      setGrades(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error("Failed to load grades"); }
    finally { setLoading(false); }
  }, [page, filterAY, filterSem, filterStudent]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!studentSearch) { setStudentResults([]); return; }
      try {
        const res = await api.get(`/students/search?q=${studentSearch}`);
        setStudentResults(res.data.data);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  // Live grade preview
  useEffect(() => {
    const { prelim, midterm, prefinal, final, specialGrade } = gradeForm;
    if (specialGrade) { setPreview({ gradeEquivalent: specialGrade, remarks: specialGrade === "INC" ? "Incomplete" : specialGrade === "OD" ? "Officially Dropped" : "Withdrawn" }); return; }
    const p = parseFloat(prelim), m = parseFloat(midterm), pf = parseFloat(prefinal), f = parseFloat(final);
    if (!isNaN(p) && !isNaN(m) && !isNaN(pf) && !isNaN(f)) {
      const score = p * 0.2 + m * 0.2 + pf * 0.2 + f * 0.4;
      const ge = convertGrade(score);
      setPreview({ score: score.toFixed(2), gradeEquivalent: ge, remarks: ge === "5.0" ? "Failed" : "Passed" });
    } else {
      setPreview(null);
    }
  }, [gradeForm]);

  const convertGrade = (score) => {
    if (score >= 98) return "1.0";
    if (score >= 95) return "1.25";
    if (score >= 92) return "1.5";
    if (score >= 89) return "1.75";
    if (score >= 86) return "2.0";
    if (score >= 83) return "2.25";
    if (score >= 80) return "2.5";
    if (score >= 77) return "2.75";
    if (score >= 75) return "3.0";
    return "5.0";
  };

  const openEdit = (g) => {
    setEditing(g);
    setGradeForm({
      prelim: g.prelim ?? "",
      midterm: g.midterm ?? "",
      prefinal: g.prefinal ?? "",
      final: g.final ?? "",
      specialGrade: ["INC", "OD", "W"].includes(g.gradeEquivalent) ? g.gradeEquivalent : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...gradeForm };
      if (payload.specialGrade) {
        payload.prelim = null; payload.midterm = null; payload.prefinal = null; payload.final = null;
      } else {
        delete payload.specialGrade;
        ["prelim", "midterm", "prefinal", "final"].forEach(k => {
          payload[k] = payload[k] !== "" ? parseFloat(payload[k]) : null;
        });
      }
      await api.put(`/grades/${editing._id}`, payload);
      toast.success("Grade updated successfully");
      setShowModal(false);
      fetchGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update grade");
    } finally { setSaving(false); }
  };

  const remarksBadge = (r) => {
    const map = { Passed: "badge-success", Failed: "badge-danger", Incomplete: "badge-warning", "Officially Dropped": "badge-muted", Withdrawn: "badge-muted", Pending: "badge-muted" };
    return map[r] || "badge-muted";
  };

  const geBadge = (ge) => {
    if (!ge) return "grade-pending";
    if (ge === "5.0") return "grade-failed";
    if (["INC", "OD", "W"].includes(ge)) return "grade-inc";
    return "grade-passed";
  };

  const ScoreInput = ({ label, field, weight }) => (
    <div className="form-group">
      <label className="form-label">{label} <span style={{ color: "var(--text-muted)", fontSize: 12 }}>({weight}%)</span></label>
      <input className="form-control" type="number" min="0" max="100" step="0.01" placeholder="0–100"
        value={gradeForm[field]} onChange={e => setGradeForm({ ...gradeForm, [field]: e.target.value })}
        disabled={!!gradeForm.specialGrade} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade Management</h1>
          <p className="page-subtitle">Encode and manage student grades — {total} records</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowTable(true)}><FiInfo /> BukSU Grading Table</button>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div style={{ position: "relative" }}>
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input className="form-control" placeholder="Filter by student..." value={studentSearch}
              onChange={e => { setStudentSearch(e.target.value); if (!e.target.value) { setFilterStudent(""); } }}
              style={{ paddingLeft: 38, minWidth: 220 }} />
          </div>
          {studentResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow)", zIndex: 50, maxHeight: 180, overflowY: "auto" }}>
              {studentResults.map(s => (
                <div key={s._id} onClick={() => { setFilterStudent(s._id); setStudentSearch(`${s.firstName} ${s.lastName}`); setStudentResults([]); setPage(1); }}
                  style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--border)" }}
                  onMouseOver={e => e.currentTarget.style.background = "#fdf9f9"}
                  onMouseOut={e => e.currentTarget.style.background = ""}>
                  {s.firstName} {s.lastName} <span style={{ color: "var(--text-muted)" }}>— {s.studentNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <select className="form-control" value={filterAY} onChange={e => { setFilterAY(e.target.value); setPage(1); }}>
          <option value="">All A.Y.</option>
          {["2024-2025", "2023-2024", "2022-2023"].map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="form-control" value={filterSem} onChange={e => { setFilterSem(e.target.value); setPage(1); }}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(filterAY || filterSem || filterStudent) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterAY(""); setFilterSem(""); setFilterStudent(""); setStudentSearch(""); setPage(1); }}><FiX /> Clear</button>
        )}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><div className="loading-spinner" style={{ margin: "0 auto" }} /></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th><th>Subject</th><th>A.Y. / Sem</th>
                  <th>Prelim</th><th>Midterm</th><th>Pre-Final</th><th>Final</th>
                  <th>Grade</th><th>Remarks</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grades.length === 0 ? (
                  <tr><td colSpan={10}>
                    <div className="empty-state"><div className="empty-state-icon">📝</div><h3>No grade records found</h3><p>Enroll students and grades will appear here</p></div>
                  </td></tr>
                ) : grades.map(g => (
                  <tr key={g._id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{g.student?.firstName} {g.student?.lastName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{g.student?.studentNumber}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--primary)", fontSize: 13 }}>{g.subject?.subjectCode}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{g.subject?.subjectName}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{g.academicYear}<br /><span style={{ color: "var(--text-muted)" }}>{g.semester}</span></td>
                    <td style={{ textAlign: "center" }}>{g.prelim ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>{g.midterm ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>{g.prefinal ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>{g.final ?? <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>
                      {g.gradeEquivalent ? (
                        <span className={`grade-pill ${geBadge(g.gradeEquivalent)}`}>{g.gradeEquivalent}</span>
                      ) : <span style={{ color: "var(--text-light)" }}>—</span>}
                    </td>
                    <td><span className={`badge ${remarksBadge(g.remarks)}`}>{g.remarks}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(g)} title="Encode grade"><FiEdit2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pages > 1 && (
          <div style={{ padding: "0 24px 16px" }}>
            <div className="pagination">
              <span className="pagination-info">Showing {grades.length} of {total}</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grade Encode Modal */}
      {showModal && editing && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Encode Grade</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              {/* Info */}
              <div style={{ background: "var(--primary-muted)", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{editing.student?.firstName} {editing.student?.lastName}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{editing.subject?.subjectCode} — {editing.subject?.subjectName}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{editing.academicYear} · {editing.semester}</p>
              </div>

              {/* Grade Components */}
              <div className="form-grid">
                <ScoreInput label="Prelim" field="prelim" weight={20} />
                <ScoreInput label="Midterm" field="midterm" weight={20} />
              </div>
              <div className="form-grid">
                <ScoreInput label="Pre-Final" field="prefinal" weight={20} />
                <ScoreInput label="Final" field="final" weight={40} />
              </div>

              {/* Special Grade */}
              <div className="form-group">
                <label className="form-label">Special Grade (overrides components)</label>
                <select className="form-control" value={gradeForm.specialGrade}
                  onChange={e => setGradeForm({ ...gradeForm, specialGrade: e.target.value })}>
                  {SPECIAL_GRADES.map(g => <option key={g} value={g}>{g || "None"}</option>)}
                </select>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>INC = Incomplete · OD = Officially Dropped · W = Withdrawn</span>
              </div>

              {/* Grade Preview */}
              {preview && (
                <div style={{
                  background: preview.remarks === "Passed" ? "var(--success-bg)" : preview.remarks === "Failed" ? "var(--danger-bg)" : "var(--warning-bg)",
                  borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grade Preview</p>
                    {preview.score && <p style={{ fontSize: 13 }}>Computed Score: <strong>{preview.score}</strong></p>}
                    <p style={{ fontSize: 13 }}>Remarks: <strong>{preview.remarks}</strong></p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{preview.gradeEquivalent}</p>
                    <p style={{ fontSize: 11, opacity: 0.7 }}>Grade Equivalent</p>
                  </div>
                </div>
              )}

              {/* BukSU Formula note */}
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                Formula: Prelim (20%) + Midterm (20%) + Pre-Final (20%) + Final (40%)
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BukSU Grading Table Modal */}
      {showTable && (
        <div className="modal-overlay" onClick={() => setShowTable(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">BukSU Grading System</h2>
              <button className="modal-close" onClick={() => setShowTable(false)}><FiX /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr><th>Grade Equivalent</th><th>Percentage Range</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {BUKSU_TABLE.map(row => (
                    <tr key={row.grade}>
                      <td style={{ fontWeight: 700, color: row.grade === "5.0" ? "var(--danger)" : row.grade === "3.0" ? "var(--warning)" : "var(--success)", fontSize: 16 }}>{row.grade}</td>
                      <td>{row.range}</td>
                      <td><span style={{ color: "var(--text-muted)", fontSize: 13 }}>{row.desc}</span></td>
                    </tr>
                  ))}
                  <tr><td style={{ fontWeight: 700, color: "var(--warning)" }}>INC</td><td colSpan={2}>Incomplete</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>OD</td><td colSpan={2}>Officially Dropped</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>W</td><td colSpan={2}>Withdrawn</td></tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowTable(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
