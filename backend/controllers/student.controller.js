const Student = require("../models/Student.model");
const User = require("../models/User.model");
const Enrollment = require("../models/Enrollment.model");
const Grade = require("../models/Grade.model");
const { validationResult } = require("express-validator");

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const { search, course, yearLevel, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { studentNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (course) query.course = { $regex: course, $options: "i" };
    if (yearLevel) query.yearLevel = yearLevel;
    if (status) query.status = status;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: students.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: students,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Students can only view their own profile
    if (req.user.role === "student") {
      const user = await User.findById(req.user.id);
      if (!user.studentId || user.studentId.toString() !== student._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const existing = await Student.findOne({
      $or: [{ studentNumber: req.body.studentNumber }, { email: req.body.email }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Student with this number or email already exists",
      });
    }

    const student = await Student.create(req.body);
    res.status(201).json({ success: true, message: "Student created successfully", data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check for duplicate student number or email (excluding current student)
    if (req.body.studentNumber || req.body.email) {
      const duplicate = await Student.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(req.body.studentNumber ? [{ studentNumber: req.body.studentNumber }] : []),
          ...(req.body.email ? [{ email: req.body.email }] : []),
        ],
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Student number or email already in use",
        });
      }
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: "Student updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete student (soft delete by setting status to Inactive)
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Hard delete
    await Student.findByIdAndDelete(req.params.id);

    // Also deactivate the associated user account
    await User.findOneAndUpdate({ studentId: req.params.id }, { isActive: false });

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Search students
// @route   GET /api/students/search
// @access  Private/Admin
const searchStudents = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const students = await Student.find({
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { studentNumber: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student statistics
// @route   GET /api/students/stats
// @access  Private/Admin
const getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: "Active" });
    const byCourse = await Student.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byYearLevel = await Student.aggregate([
      { $group: { _id: "$yearLevel", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: { totalStudents, activeStudents, byCourse, byYearLevel },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
  getStudentStats,
};
