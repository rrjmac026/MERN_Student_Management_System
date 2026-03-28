const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  getGrades,
  getMyGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradesByStudent,
} = require("../controllers/grade.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const gradeComponentValidation = [
  body("prelim").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("Prelim must be 0-100"),
  body("midterm").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("Midterm must be 0-100"),
  body("prefinal").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("Pre-final must be 0-100"),
  body("final").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("Final must be 0-100"),
];

router.get("/my", protect, getMyGrades);
router.get("/student/:studentId", protect, authorize("admin"), getGradesByStudent);
router.get("/", protect, authorize("admin"), getGrades);
router.get("/:id", protect, getGrade);
router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("enrollment").notEmpty().withMessage("Enrollment is required"),
    body("student").notEmpty().withMessage("Student is required"),
    body("subject").notEmpty().withMessage("Subject is required"),
    body("academicYear").notEmpty().withMessage("Academic year is required"),
    body("semester").isIn(["1st Semester", "2nd Semester", "Summer"]).withMessage("Invalid semester"),
    ...gradeComponentValidation,
  ],
  createGrade
);
router.put("/:id", protect, authorize("admin"), gradeComponentValidation, updateGrade);
router.delete("/:id", protect, authorize("admin"), deleteGrade);

module.exports = router;
