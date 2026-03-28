const Subject = require("../models/Subject.model");
const { validationResult } = require("express-validator");

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const { search, course, yearLevel, semester, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { subjectCode: { $regex: search, $options: "i" } },
        { subjectName: { $regex: search, $options: "i" } },
      ];
    }
    if (course) query.course = { $regex: course, $options: "i" };
    if (yearLevel) query.yearLevel = yearLevel;
    if (semester) query.semester = semester;
    if (status) query.status = status;

    const total = await Subject.countDocuments(query);
    const subjects = await Subject.find(query)
      .sort({ subjectCode: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: subjects.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: subjects,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    res.json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const existing = await Subject.findOne({ subjectCode: req.body.subjectCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Subject code already exists" });
    }

    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, message: "Subject created successfully", data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    if (req.body.subjectCode) {
      const duplicate = await Subject.findOne({
        _id: { $ne: req.params.id },
        subjectCode: req.body.subjectCode.toUpperCase(),
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Subject code already in use" });
      }
    }

    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: "Subject updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Search subjects
// @route   GET /api/subjects/search
// @access  Private
const searchSubjects = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const subjects = await Subject.find({
      status: "Active",
      $or: [
        { subjectCode: { $regex: q, $options: "i" } },
        { subjectName: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSubjects, getSubject, createSubject, updateSubject, deleteSubject, searchSubjects };
