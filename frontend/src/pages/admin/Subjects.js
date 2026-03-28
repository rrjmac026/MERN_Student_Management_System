import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from "react-icons/fi";

const TYPES = ["Lecture", "Laboratory", "Lecture/Laboratory"];
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
const COURSES = ["BSCS", "BSIT", "BSED", "BSBA", "BSN", "BSAB", "BSAgri", "BSHM"];

const emptyForm = {
  subjectCode: "", subjectName: "", description: "",
  units: "", type: "Lecture", course: "", yearLevel: "", semester: "", status: "Active",
};

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filterSem) params.semester = filterSem;
      const res = await api.get("/subjects", { params });
      setSubjects(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error("Failed to load subjects"); }
    finally { setLoading(false); }
  }, [page, search, filterSem]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErrors({}); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm(s); setFormErrors({}); setShowModal(true); };
  const openDelete = (s) => { setDeleteTarget(s); setShowDeleteModal(true); };

  const validate = () => {
    const errs = {};
    if (!form.subjectCode) errs.subjectCode = "Required";
    if (!form.subjectName) errs.subjectName = "Required";
    if (!form.units) errs.units = "Required";
    else if (form.units < 1 || form.units > 6) errs.units = "Units must be 1-6";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/subjects/${editing._id}`, form);
        toast.success("Subject updated successfully");
      } else {
        await api.post("/subjects", form);
        toast.success("Subject created successfully");
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save subject");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/subjects/${deleteTarget._id}`);
      toast.success("Subject deleted successfully");
      setShowDeleteModal(false);
      fetchSubjects();
    } catch { toast.error("Failed to delete subject"); }
  };

  const F = (key) => ({
    value: form[key] || "",
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    className: `form-control${formErrors[key] ? " error" : ""}`,
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">Manage course subjects — {total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Subject</button>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input className="form-control" placeholder="Search code or name..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 38, minWidth: 240 }} />
        </div>
        <select className="form-control" value={filterSem} onChange={(e) => { setFilterSem(e.target.value); setPage(1); }}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterSem) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setFilterSem(""); setPage(1); }}><FiX /> Clear</button>
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
                  <th>Code</th><th>Subject Name</th><th>Units</th>
                  <th>Type</th><th>Semester</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state"><div className="empty-state-icon">📚</div><h3>No subjects found</h3></div>
                  </td></tr>
                ) : subjects.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>{s.subjectCode}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.subjectName}</div>
                      {s.description && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.description}</div>}
                    </td>
                    <td><span className="badge badge-primary">{s.units} units</span></td>
                    <td><span className="badge badge-muted">{s.type}</span></td>
                    <td>{s.semester || "—"}</td>
                    <td><span className={`badge ${s.status === "Active" ? "badge-success" : "badge-muted"}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(s)}><FiEdit2 size={15} /></button>
                        <button className="btn btn-sm btn-icon" onClick={() => openDelete(s)} style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}><FiTrash2 size={15} /></button>
                      </div>
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
              <span className="pagination-info">Showing {subjects.length} of {total}</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? "Edit Subject" : "Add New Subject"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Subject Code *</label>
                  <input {...F("subjectCode")} placeholder="CS101" style={{ textTransform: "uppercase" }} />
                  {formErrors.subjectCode && <span className="form-error">{formErrors.subjectCode}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Units *</label>
                  <input {...F("units")} type="number" min="1" max="6" placeholder="3" />
                  {formErrors.units && <span className="form-error">{formErrors.units}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name *</label>
                <input {...F("subjectName")} placeholder="Introduction to Computing" />
                {formErrors.subjectName && <span className="form-error">{formErrors.subjectName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input {...F("description")} placeholder="Brief description..." />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select {...F("type")}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select {...F("semester")}>
                    <option value="">Select</option>
                    {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select {...F("course")}>
                    <option value="">All Courses</option>
                    {COURSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year Level</label>
                  <select {...F("yearLevel")}>
                    <option value="">All Years</option>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select {...F("status")}><option>Active</option><option>Inactive</option></select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Subject" : "Create Subject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-muted)" }}>
                Delete <strong>{deleteTarget.subjectCode} - {deleteTarget.subjectName}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
