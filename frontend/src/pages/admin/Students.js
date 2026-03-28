import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUserPlus } from "react-icons/fi";

const COURSES = ["BSCS", "BSIT", "BSED", "BSBA", "BSN", "BSAB", "BSAgri", "BSHM"];
const YEAR_LEVELS = [1, 2, 3, 4, 5];
const STATUSES = ["Active", "Inactive", "Graduated", "Dropped"];

const emptyForm = {
  studentNumber: "", firstName: "", middleName: "", lastName: "",
  email: "", contactNumber: "", address: "", dateOfBirth: "",
  gender: "", course: "", yearLevel: "", section: "", status: "Active",
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", email: "", password: "", studentId: "" });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filterCourse) params.course = filterCourse;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get("/students", { params });
      setStudents(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCourse, filterStatus]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErrors({}); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "" }); setFormErrors({}); setShowModal(true); };
  const openDelete = (s) => { setDeleteTarget(s); setShowDeleteModal(true); };
  const openUserCreate = (s) => { setUserForm({ username: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}`, email: s.email, password: "student123", studentId: s._id }); setShowUserModal(true); };

  const validate = () => {
    const errs = {};
    if (!form.studentNumber) errs.studentNumber = "Required";
    if (!form.firstName) errs.firstName = "Required";
    if (!form.lastName) errs.lastName = "Required";
    if (!form.email) errs.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.course) errs.course = "Required";
    if (!form.yearLevel) errs.yearLevel = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/students/${editing._id}`, form);
        toast.success("Student updated successfully");
      } else {
        await api.post("/students", form);
        toast.success("Student created successfully");
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${deleteTarget._id}`);
      toast.success("Student deleted successfully");
      setShowDeleteModal(false);
      fetchStudents();
    } catch (err) {
      toast.error("Failed to delete student");
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post("/auth/register", { ...userForm, role: "student" });
      toast.success("Student account created");
      setShowUserModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    }
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
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student records — {total} total</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Student</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input className="form-control" placeholder="Search name, number, email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 38, minWidth: 260 }} />
        </div>
        <select className="form-control" value={filterCourse} onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}>
          <option value="">All Courses</option>
          {COURSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-control" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterCourse || filterStatus) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setFilterCourse(""); setFilterStatus(""); setPage(1); }}><FiX /> Clear</button>
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
                  <th>Student No.</th><th>Name</th><th>Course</th>
                  <th>Year</th><th>Section</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👨‍🎓</div>
                      <h3>No students found</h3>
                      <p>Add a student to get started</p>
                    </div>
                  </td></tr>
                ) : students.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, color: "var(--primary)", fontFamily: "monospace", fontSize: 13 }}>{s.studentNumber}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.firstName} {s.middleName} {s.lastName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.email}</div>
                    </td>
                    <td>{s.course}</td>
                    <td>Year {s.yearLevel}</td>
                    <td>{s.section || "—"}</td>
                    <td><span className={`badge ${s.status === "Active" ? "badge-success" : s.status === "Graduated" ? "badge-info" : "badge-muted"}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Create account" onClick={() => openUserCreate(s)}><FiUserPlus size={15} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => openEdit(s)}><FiEdit2 size={15} /></button>
                        <button className="btn btn-sm btn-icon" title="Delete" onClick={() => openDelete(s)} style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}><FiTrash2 size={15} /></button>
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
              <span className="pagination-info">Showing {students.length} of {total}</span>
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

      {/* Student Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? "Edit Student" : "Add New Student"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Student Number *</label>
                  <input {...F("studentNumber")} placeholder="2024-00001" />
                  {formErrors.studentNumber && <span className="form-error">{formErrors.studentNumber}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select {...F("course")}>
                    <option value="">Select Course</option>
                    {COURSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  {formErrors.course && <span className="form-error">{formErrors.course}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select {...F("status")}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input {...F("firstName")} placeholder="Maria" />
                  {formErrors.firstName && <span className="form-error">{formErrors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <input {...F("middleName")} placeholder="Cruz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input {...F("lastName")} placeholder="Santos" />
                  {formErrors.lastName && <span className="form-error">{formErrors.lastName}</span>}
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input {...F("email")} type="email" placeholder="maria@student.buksu.edu.ph" />
                  {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input {...F("contactNumber")} placeholder="09XXXXXXXXX" />
                </div>
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Year Level *</label>
                  <select {...F("yearLevel")}>
                    <option value="">Select Year</option>
                    {YEAR_LEVELS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                  {formErrors.yearLevel && <span className="form-error">{formErrors.yearLevel}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input {...F("section")} placeholder="A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select {...F("gender")}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input {...F("dateOfBirth")} type="date" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input {...F("address")} placeholder="City, Province" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Student" : "Create Student"}
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
                Are you sure you want to delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> ({deleteTarget.studentNumber})?
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Account Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Login Account</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-control" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input className="form-control" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateUser}>Create Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
