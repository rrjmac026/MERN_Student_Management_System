import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { FiSearch, FiToggleLeft, FiToggleRight, FiShield, FiUser } from "react-icons/fi";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (id) => {
    try {
      const res = await api.put(`/auth/users/${id}/toggle`);
      toast.success(res.data.message);
      fetchUsers();
    } catch { toast.error("Failed to update user status"); }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system user accounts — {users.length} total</p>
        </div>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input className="form-control" placeholder="Search username or email..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38, minWidth: 260 }} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><div className="loading-spinner" style={{ margin: "0 auto" }} /></div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Username</th><th>Email</th><th>Role</th><th>Linked Student</th><th>Status</th><th>Created</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state"><div className="empty-state-icon">👤</div><h3>No users found</h3></div>
                  </td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.role === "admin" ? "var(--primary)" : "var(--gold)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === "admin" ? "badge-primary" : "badge-gold"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {u.role === "admin" ? <FiShield size={11} /> : <FiUser size={11} />}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {u.studentId ? (
                        <span style={{ color: "var(--primary)" }}>
                          {u.studentId.firstName} {u.studentId.lastName}
                          <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>({u.studentId.studentNumber})</span>
                        </span>
                      ) : <span style={{ color: "var(--text-light)" }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-success" : "badge-danger"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(u._id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: u.isActive ? "var(--danger)" : "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}
                        title={u.isActive ? "Deactivate" : "Activate"}>
                        {u.isActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
