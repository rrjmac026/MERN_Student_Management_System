const Grade = require("../models/Grade.model");
const User = require("../models/User.model");
const { validationResult } = require("express-validator");

// BukSU Grade Conversion
const convertToGradeEquivalent = (score) => {
  if (score === null || score === undefined) return null;
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

const getRemarks = (gradeEquivalent) => {
  if (!gradeEquivalent) return "Pending";
  if (gradeEquivalent === "5.0") return "Failed";
  if (gradeEquivalent === "INC") return "Incomplete";
  if (gradeEquivalent === "OD") return "Officially Dropped";
  if (gradeEquivalent === "W") return "Withdrawn";
  return "Passed";
};

// Compute final numeric grade from components
// BukSU: Prelim 20%, Midterm 20%, Pre-Final 20%, Final 40%
const computeFinalGrade = (prelim, midterm, prefinal, final) => {
  if (
    prelim === null || prelim === undefined ||
    midterm === null || midterm === undefined ||
    prefinal === null || prefinal === undefined ||
    final === null || final === undefined
  ) return null;

  return (prelim * 0.2) + (midterm * 0.2) + (prefinal * 0.2) + (final * 0.4);
};

// @desc    Get all grades
// @route   GET /api/grades
// @access  Private/Admin
const getGrades = async (req, res) => {
  try {
    const { student, subject, academicYear, semester, page = 1, limit = 10 } = req.query;
    const query = {};

    if (student) query.student = student;
    if (subject) query.subject = subject;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const total = await Grade.countDocuments(query);
    const grades = await Grade.find(query)
      .populate("student", "firstName lastName studentNumber course")
      .populate("subject", "subjectCode subjectName units")
      .populate("encodedBy", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: grades.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: grades,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my grades (student)
// @route   GET /api/grades/my
// @access  Private/Student
const getMyGrades = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.studentId) {
      return res.status(404).json({ success: false, message: "No student profile linked" });
    }

    const { academicYear, semester } = req.query;
    const query = { student: user.studentId };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const grades = await Grade.find(query)
      .populate("subject", "subjectCode subjectName units type")
      .populate("enrollment", "academicYear semester yearLevel")
      .sort({ createdAt: -1 });

    // Group by academic year and semester
    const grouped = {};
    grades.forEach((g) => {
      const key = `${g.academicYear} - ${g.semester}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(g);
    });

    res.json({ success: true, data: grades, grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single grade
// @route   GET /api/grades/:id
// @access  Private
const getGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate("student", "firstName lastName studentNumber")
      .populate("subject", "subjectCode subjectName units")
      .populate("enrollment");

    if (!grade) {
      return res.status(404).json({ success: false, message: "Grade not found" });
    }

    // Students can only view their own grades
    if (req.user.role === "student") {
      const user = await User.findById(req.user.id);
      if (grade.student._id.toString() !== user.studentId?.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    res.json({ success: true, data: grade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create grade
// @route   POST /api/grades
// @access  Private/Admin
const createGrade = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { prelim, midterm, prefinal, final, specialGrade } = req.body;

    let numericGrade = null;
    let gradeEquivalent = null;
    let remarks = "Pending";

    if (specialGrade) {
      gradeEquivalent = specialGrade; // INC, OD, W
      remarks = getRemarks(specialGrade);
    } else {
      const computed = computeFinalGrade(prelim, midterm, prefinal, final);
      if (computed !== null) {
        numericGrade = Math.round(computed * 100) / 100;
        gradeEquivalent = convertToGradeEquivalent(numericGrade);
        remarks = getRemarks(gradeEquivalent);
      }
    }

    const grade = await Grade.create({
      ...req.body,
      numericGrade,
      gradeEquivalent,
      remarks,
      encodedBy: req.user.id,
    });

    res.status(201).json({ success: true, message: "Grade created successfully", data: grade });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Grade already exists for this subject" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update grade
// @route   PUT /api/grades/:id
// @access  Private/Admin
const updateGrade = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ success: false, message: "Grade not found" });
    }

    const { prelim, midterm, prefinal, final, specialGrade } = req.body;

    // Merge with existing values
    const newPrelim = prelim !== undefined ? prelim : grade.prelim;
    const newMidterm = midterm !== undefined ? midterm : grade.midterm;
    const newPrefinal = prefinal !== undefined ? prefinal : grade.prefinal;
    const newFinal = final !== undefined ? final : grade.final;

    let numericGrade = grade.numericGrade;
    let gradeEquivalent = grade.gradeEquivalent;
    let remarks = grade.remarks;

    if (specialGrade) {
      gradeEquivalent = specialGrade;
      remarks = getRemarks(specialGrade);
      numericGrade = null;
      req.body.prelim = null;
      req.body.midterm = null;
      req.body.prefinal = null;
      req.body.final = null;
    } else {
      const computed = computeFinalGrade(newPrelim, newMidterm, newPrefinal, newFinal);
      if (computed !== null) {
        numericGrade = Math.round(computed * 100) / 100;
        gradeEquivalent = convertToGradeEquivalent(numericGrade);
        remarks = getRemarks(gradeEquivalent);
      }
    }

    const updated = await Grade.findByIdAndUpdate(
      req.params.id,
      { ...req.body, numericGrade, gradeEquivalent, remarks, encodedBy: req.user.id },
      { new: true, runValidators: true }
    )
      .populate("student", "firstName lastName studentNumber")
      .populate("subject", "subjectCode subjectName units");

    res.json({ success: true, message: "Grade updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete grade
// @route   DELETE /api/grades/:id
// @access  Private/Admin
const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ success: false, message: "Grade not found" });
    }

    await Grade.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Grade deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get grades by student
// @route   GET /api/grades/student/:studentId
// @access  Private/Admin
const getGradesByStudent = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId })
      .populate("subject", "subjectCode subjectName units type")
      .populate("enrollment", "academicYear semester yearLevel")
      .sort({ academicYear: -1, semester: 1 });

    // Compute GWA
    const completedGrades = grades.filter(
      (g) => g.gradeEquivalent && !["INC", "OD", "W"].includes(g.gradeEquivalent)
    );

    let gwa = null;
    if (completedGrades.length > 0) {
      const totalWeighted = completedGrades.reduce((sum, g) => {
        return sum + (parseFloat(g.gradeEquivalent) * (g.subject?.units || 3));
      }, 0);
      const totalUnits = completedGrades.reduce((sum, g) => sum + (g.subject?.units || 3), 0);
      gwa = totalUnits > 0 ? (totalWeighted / totalUnits).toFixed(4) : null;
    }

    res.json({ success: true, data: grades, gwa });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getGrades,
  getMyGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradesByStudent,
};
