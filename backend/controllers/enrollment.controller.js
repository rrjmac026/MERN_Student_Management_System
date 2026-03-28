const Enrollment = require("../models/Enrollment.model");
const Student = require("../models/Student.model");
const Subject = require("../models/Subject.model");
const Grade = require("../models/Grade.model");
const User = require("../models/User.model");
const { validationResult } = require("express-validator");

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private/Admin
const getEnrollments = async (req, res) => {
  try {
    const { student, academicYear, semester, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (student) query.student = student;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (status) query.status = status;

    const total = await Enrollment.countDocuments(query);
    const enrollments = await Enrollment.find(query)
      .populate("student", "firstName lastName studentNumber course yearLevel")
      .populate("subjects.subject", "subjectCode subjectName units")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: enrollments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: enrollments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get enrollment by student (for student role)
// @route   GET /api/enrollments/my
// @access  Private/Student
const getMyEnrollments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.studentId) {
      return res.status(404).json({ success: false, message: "No student profile linked" });
    }

    const enrollments = await Enrollment.find({ student: user.studentId })
      .populate("subjects.subject", "subjectCode subjectName units type")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
const getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("student", "firstName lastName studentNumber course yearLevel section")
      .populate("subjects.subject", "subjectCode subjectName units type");

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // Students can only view their own enrollment
    if (req.user.role === "student") {
      const user = await User.findById(req.user.id);
      if (enrollment.student._id.toString() !== user.studentId?.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create enrollment
// @route   POST /api/enrollments
// @access  Private/Admin
const createEnrollment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { student, subjects, academicYear, semester, yearLevel } = req.body;

  try {
    // Check if student exists
    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check for duplicate enrollment
    const existing = await Enrollment.findOne({ student, academicYear, semester });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Student is already enrolled for this semester",
      });
    }

    // Validate all subjects exist and calculate total units
    let totalUnits = 0;
    for (const s of subjects) {
      const subjectDoc = await Subject.findById(s.subject);
      if (!subjectDoc) {
        return res.status(404).json({ success: false, message: `Subject not found: ${s.subject}` });
      }
      totalUnits += subjectDoc.units;
    }

    const enrollment = await Enrollment.create({
      student,
      subjects,
      academicYear,
      semester,
      yearLevel,
      totalUnits,
    });

    // Auto-create grade records for each subject
    for (const s of subjects) {
      await Grade.create({
        enrollment: enrollment._id,
        student,
        subject: s.subject,
        academicYear,
        semester,
      });
    }

    const populated = await Enrollment.findById(enrollment._id)
      .populate("student", "firstName lastName studentNumber")
      .populate("subjects.subject", "subjectCode subjectName units");

    res.status(201).json({
      success: true,
      message: "Student enrolled successfully",
      data: populated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Duplicate enrollment" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
// @access  Private/Admin
const updateEnrollment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // Recalculate total units if subjects changed
    if (req.body.subjects) {
      let totalUnits = 0;
      for (const s of req.body.subjects) {
        const subjectDoc = await Subject.findById(s.subject);
        if (subjectDoc) totalUnits += subjectDoc.units;
      }
      req.body.totalUnits = totalUnits;
    }

    const updated = await Enrollment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("student", "firstName lastName studentNumber")
      .populate("subjects.subject", "subjectCode subjectName units");

    res.json({ success: true, message: "Enrollment updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private/Admin
const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // Delete associated grades
    await Grade.deleteMany({ enrollment: req.params.id });
    await Enrollment.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Enrollment and associated grades deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEnrollments,
  getMyEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
