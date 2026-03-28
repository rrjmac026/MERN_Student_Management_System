import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";

const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
const STATUSES = ["Enrolled", "Dropped", "Completed", "Pending"];

const emptyForm = {
  student: "", subjects: [], academicYear: "", semester: "", yearLevel: "", status: "Enrolled",
};

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterSem, setFilterSem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAY, setFilterAY] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});
  // For subject/student search in modal
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterSem) params.semester = filterSem;
      if (filterStatus) params.status = filterStatus;
      if (filterAY) params.academicYear = filterAY;
      const res = await api.get("/enrollments", { params });
      setEnrollments(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error("Failed to load enrollments"); }
    finally { setLoading(false); }
  }, [page, filterSem, filterStatus, filterAY]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects?limit=100&status=Active");
      setAllSubjects(res.data.data);
    } catch {}
  };

  const searchStudents = async (q) => {
    if (!q) { setStudentResults([]); return; }
    try {
      const res = await api.get(`/students/search?q=${q}`);
      setStudentResults(res.data.data);
    } catch {}
  };

  useEffect(() => {
    const t = setTimeout(() => searchStudents(studentSearch), 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const openCreate = async () => {
    await fetchSubjects();
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentResults([]);
    setShowModal(true);
  };

  const openEdit = async (e) => {
    await fetchSubjects();
    setEditing(e);
    setSelectedStudent(e.student);
    setStudentSearch(`${e.student.firstName} ${e.student.lastName}`);
    setForm({
      student: e.student._id,
      subjects: e.subjects.map(s => ({ subject: s.subject._id, schedule: s.schedule, room: s.room })),
      academicYear: e.academicYear,
      semester: e.semester,
      yearLevel: e.yearLevel,
      status: e.status,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openDelete = (e) => { setDeleteTarget(e); setShowDeleteModal(true); };

  const toggleSubject = (subjectId) => {
    const exists = form.subjects.find(s => s.subject === subjectId);
    if (exists) {
      setForm({ ...form, subjects: form.subjects.filter(s => s.subject !== subjectId) });
    } else {
      setForm({ ...form, subjects: [...form.subjects, { subject: subjectId, schedule: "", room: "" }] });
    }
  };

  const updateSubjectField = (subjectId, field, value) => {
    setForm({
      ...form,
      subjects: form.subjects.map(s => s.subject === subjectId ? { ...s, [field]: value } : s),
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.student) errs.student = "Student is required";
    if (!form.subjects.length) errs.subjects = "Select at least one subject";
    if (!form.academicYear || !/^\d{4}-\d{4}$/.test(form.academicYear)) errs.academicYear = "Format: YYYY-YYYY";
    if (!form.semester) errs.semester = "Required";
    if (!form.yearLevel) errs.yearLevel = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/enrollments/${editing._id}`, form);
        toast.success("Enrollment updated");
      } else {
        await api.post("/enrollments", form);
        toast.success("Student enrolled successfully");
      }
      setShowModal(false);
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save enrollment");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/enrollments/${deleteTarget._id}`);
      toast.success("Enrollment deleted");
      setShowDeleteModal(false);
      fetchEnrollments();
    } catch { toast.error("Failed to delete enrollment"); }
  };

  const statusColor = { Enrolled: "badge-success", Dropped: "badge-danger", Completed: "badge-info", Pending: "badge-warning" };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollments</h1>
          <p className="page-subtitle">Manage student enrollments — {total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Enrollment</button>
      </div>

      <div className="filter-row">
        <select className="form-control" value={filterAY} onChange={e => { setFilterAY(e.target.value); setPage(1); }}>
          <option value="">All Academic Years</option>
          {["2024-2025", "2023-2024", "2022-2023"].map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="form-control" value={filterSem} onChange={e => { setFilterSem(e.target.value); setPage(1); }}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="form-control" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(filterAY || filterSem || filterStatus) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterAY(""); setFilterSem(""); setFilterStatus(""); setPage(1); }}><FiX /> Clear</button>
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
                  <th></th><th>Student</th><th>Academic Year</th>
                  <th>Semester</th><th>Year Level</th><th>Units</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No enrollments found</h3></div>
                  </td></tr>
                ) : enrollments.map(e => (
                  <React.Fragment key={e._id}>
                    <tr>
                      <td>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                          onClick={() => setExpanded(prev => ({ ...prev, [e._id]: !prev[e._id] }))}>
                          {expanded[e._id] ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.student?.firstName} {e.student?.lastName}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.student?.studentNumber}</div>
                      </td>
                      <td>{e.academicYear}</td>
                      <td>{e.semester}</td>
                      <td>Year {e.yearLevel}</td>
                      <td><span className="badge badge-primary">{e.totalUnits} units</span></td>
                      <td><span className={`badge ${statusColor[e.status] || "badge-muted"}`}>{e.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(e)}><FiEdit2 size={15} /></button>
                          <button className="btn btn-sm btn-icon" onClick={() => openDelete(e)} style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}><FiTrash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                    {expanded[e._id] && (
                      <tr>
                        <td colSpan={8} style={{ padding: "0 16px 12px 48px", background: "#fdf9f9" }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Enrolled Subjects</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {e.subjects?.map(s => (
                              <span key={s._id} style={{ background: "var(--primary-muted)", color: "var(--primary)", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
                                {s.subject?.subjectCode} — {s.subject?.subjectName} ({s.subject?.units} units)
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pages > 1 && (
          <div style={{ padding: "0 24px 16px" }}>
            <div className="pagination">
              <span className="pagination-info">Showing {enrollments.length} of {total}</span>
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

      {/* Enrollment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? "Edit Enrollment" : "New Enrollment"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              {/* Student search */}
              <div className="form-group" style={{ position: "relative" }}>
                <label className="form-label">Student *</label>
                <div className="search-bar">
                  <FiSearch className="search-icon" />
                  <input className={`form-control${formErrors.student ? " error" : ""}`}
                    placeholder="Search student name or number..."
                    value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); if (selectedStudent) { setSelectedStudent(null); setForm({ ...form, student: "" }); } }}
                    style={{ paddingLeft: 38 }} />
                </div>
                {formErrors.student && <span className="form-error">{formErrors.student}</span>}
                {studentResults.length > 0 && !selectedStudent && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow)", zIndex: 50, maxHeight: 200, overflowY: "auto" }}>
                    {studentResults.map(s => (
                      <div key={s._id} onClick={() => { setSelectedStudent(s); setStudentSearch(`${s.firstName} ${s.lastName} (${s.studentNumber})`); setForm(f => ({ ...f, student: s._id })); setStudentResults([]); }}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 14 }}
                        onMouseOver={e => e.currentTarget.style.background = "#fdf9f9"}
                        onMouseOut={e => e.currentTarget.style.background = ""}>
                        <strong>{s.firstName} {s.lastName}</strong> <span style={{ color: "var(--text-muted)" }}>— {s.studentNumber} ({s.course})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <input className={`form-control${formErrors.academicYear ? " error" : ""}`}
                    placeholder="2024-2025" value={form.academicYear}
                    onChange={e => setForm({ ...form, academicYear: e.target.value })} />
                  {formErrors.academicYear && <span className="form-error">{formErrors.academicYear}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className={`form-control${formErrors.semester ? " error" : ""}`}
                    value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                    <option value="">Select</option>
                    {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {formErrors.semester && <span className="form-error">{formErrors.semester}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Year Level *</label>
                  <select className={`form-control${formErrors.yearLevel ? " error" : ""}`}
                    value={form.yearLevel} onChange={e => setForm({ ...form, yearLevel: e.target.value })}>
                    <option value="">Select</option>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                  {formErrors.yearLevel && <span className="form-error">{formErrors.yearLevel}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Subject Selection */}
              <div className="form-group">
                <label className="form-label">Subjects * {form.subjects.length > 0 && <span style={{ color: "var(--primary)", fontWeight: 600 }}>({form.subjects.length} selected)</span>}</label>
                {formErrors.subjects && <span className="form-error">{formErrors.subjects}</span>}
                <div style={{ border: "1.5px solid var(--border)", borderRadius: 8, maxHeight: 280, overflowY: "auto" }}>
                  {allSubjects.map(s => {
                    const selected = form.subjects.find(fs => fs.subject === s._id);
                    return (
                      <div key={s._id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <div onClick={() => toggleSubject(s._id)}
                          style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: selected ? "var(--primary-muted)" : "" }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? "var(--primary)" : "var(--border)"}`, background: selected ? "var(--primary)" : "", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {selected && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: "var(--primary)" }}>{s.subjectCode}</span>
                            <span style={{ marginLeft: 8 }}>{s.subjectName}</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)" }}>{s.units} units · {s.type}</span>
                          </div>
                        </div>
                        {selected && (
                          <div style={{ padding: "8px 14px 10px 42px", display: "flex", gap: 10, background: "var(--primary-muted)" }}>
                            <div style={{ flex: 1 }}>
                              <input className="form-control" placeholder="Schedule (e.g. MWF 8:00-9:00)" style={{ fontSize: 13 }}
                                value={selected.schedule || ""} onChange={e => updateSubjectField(s._id, "schedule", e.target.value)} />
                            </div>
                            <div style={{ width: 120 }}>
                              <input className="form-control" placeholder="Room" style={{ fontSize: 13 }}
                                value={selected.room || ""} onChange={e => updateSubjectField(s._id, "room", e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allSubjects.length === 0 && (
                    <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 14 }}>No active subjects available</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Enrollment" : "Enroll Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-muted)" }}>
                Delete enrollment for <strong>{deleteTarget.student?.firstName} {deleteTarget.student?.lastName}</strong> — {deleteTarget.academicYear} {deleteTarget.semester}?
                All associated grade records will also be deleted.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Enrollment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
