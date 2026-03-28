const mongoose = require("mongoose");

// BukSU Grading System
// 1.0 = 98-100 (Excellent)
// 1.25 = 95-97
// 1.5 = 92-94
// 1.75 = 89-91
// 2.0 = 86-88
// 2.25 = 83-85
// 2.5 = 80-82
// 2.75 = 77-79
// 3.0 = 75-76 (Passed)
// 5.0 = Below 75 (Failed)
// INC = Incomplete
// OD = Officially Dropped
// W = Withdrawn

const gradeSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: [true, "Enrollment is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: ["1st Semester", "2nd Semester", "Summer"],
    },
    // Grade components
    prelim: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    midterm: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    prefinal: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    final: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Computed grade
    numericGrade: {
      type: Number,
      default: null,
    },
    // BukSU grade equivalent
    gradeEquivalent: {
      type: String,
      default: null,
    },
    remarks: {
      type: String,
      enum: ["Passed", "Failed", "Incomplete", "Officially Dropped", "Withdrawn", "Pending"],
      default: "Pending",
    },
    encodedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Unique grade per student per subject per semester
gradeSchema.index(
  { student: 1, subject: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

// BukSU grade conversion function
gradeSchema.statics.convertToGradeEquivalent = function (numericScore) {
  if (numericScore === null || numericScore === undefined) return null;
  if (numericScore >= 98) return "1.0";
  if (numericScore >= 95) return "1.25";
  if (numericScore >= 92) return "1.5";
  if (numericScore >= 89) return "1.75";
  if (numericScore >= 86) return "2.0";
  if (numericScore >= 83) return "2.25";
  if (numericScore >= 80) return "2.5";
  if (numericScore >= 77) return "2.75";
  if (numericScore >= 75) return "3.0";
  return "5.0";
};

gradeSchema.statics.getRemarks = function (gradeEquivalent) {
  if (!gradeEquivalent) return "Pending";
  if (gradeEquivalent === "5.0") return "Failed";
  if (["INC", "Incomplete"].includes(gradeEquivalent)) return "Incomplete";
  if (gradeEquivalent === "OD") return "Officially Dropped";
  if (gradeEquivalent === "W") return "Withdrawn";
  return "Passed";
};

module.exports = mongoose.model("Grade", gradeSchema);
