import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
    <span style={{ width: 160, fontSize: 13, color: "var(--text-muted)", fontWeight: 500, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{value || <span style={{ color: "var(--text-light)" }}>—</span>}</span>
  </div>
);

export default function StudentProfile() {
  const { user } = useAuth();
  const student = user?.studentInfo;
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ cur: false, new: false, con: false });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPwForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally { setSaving(false); }
  };

  const PwInput = ({ field, label, showKey }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input className="form-control" type={showPw[showKey] ? "text" : "password"}
          value={pwForm[field]} onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
          style={{ paddingRight: 38 }} />
        <button type="button" onClick={() => setShowPw({ ...showPw, [showKey]: !showPw[showKey] })}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
          {showPw[showKey] ? <FiEyeOff size={15} /> : <FiEye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View your student information</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Personal Information */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <h2 className="card-title">Personal Information</h2>
            {student && <span className={`badge ${student.status === "Active" ? "badge-success" : "badge-muted"}`}>{student.status}</span>}
          </div>
          <div className="card-body">
            {!student ? (
              <div className="empty-state"><p>No student profile linked to your account.</p></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
                <div>
                  <InfoRow label="Student Number" value={<span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>{student.studentNumber}</span>} />
                  <InfoRow label="First Name" value={student.firstName} />
                  <InfoRow label="Middle Name" value={student.middleName} />
                  <InfoRow label="Last Name" value={student.lastName} />
                  <InfoRow label="Email" value={student.email} />
                  <InfoRow label="Contact Number" value={student.contactNumber} />
                </div>
                <div>
                  <InfoRow label="Course" value={student.course} />
                  <InfoRow label="Year Level" value={`Year ${student.yearLevel}`} />
                  <InfoRow label="Section" value={student.section} />
                  <InfoRow label="Gender" value={student.gender} />
                  <InfoRow label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : null} />
                  <InfoRow label="Address" value={student.address} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Account Information</h2></div>
          <div className="card-body">
            <InfoRow label="Username" value={user?.username} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Role" value={<span className="badge badge-gold">{user?.role}</span>} />
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Security</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setShowPwForm(!showPwForm)}>
              <FiLock size={14} /> {showPwForm ? "Cancel" : "Change Password"}
            </button>
          </div>
          <div className="card-body">
            {!showPwForm ? (
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Click "Change Password" to update your password.</p>
            ) : (
              <div>
                <PwInput field="currentPassword" label="Current Password" showKey="cur" />
                <PwInput field="newPassword" label="New Password" showKey="new" />
                <PwInput field="confirmPassword" label="Confirm New Password" showKey="con" />
                <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving} style={{ marginTop: 4 }}>
                  {saving ? "Saving..." : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 640px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
